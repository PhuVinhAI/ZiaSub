param(
    # Đường dẫn tới thư mục dự án
    [Parameter(
        Mandatory = $true,
        Position = 0,
        HelpMessage = "Nhập đường dẫn tới thư mục dự án Git"
    )]
    [ValidateNotNullOrEmpty()]
    [string]$ProjectPath,

    # Đường dẫn file ZIP đầu ra, không bắt buộc
    [Parameter(Position = 1)]
    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-GitProjectFiles {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,

        [Parameter(Mandatory = $true)]
        [string]$GitExecutable
    )

    # Dùng -z để Git trả về danh sách file ngăn cách bằng ký tự NULL.
    # Cách này xử lý tốt tên file có khoảng trắng hoặc ký tự đặc biệt.
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $GitExecutable
    $processInfo.WorkingDirectory = $WorkingDirectory
    $processInfo.Arguments = `
        "-c core.quotepath=false ls-files --cached --others --exclude-standard -z"

    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo

    $memoryStream = New-Object System.IO.MemoryStream

    try {
        [void]$process.Start()

        $process.StandardOutput.BaseStream.CopyTo($memoryStream)
        $errorOutput = $process.StandardError.ReadToEnd()

        $process.WaitForExit()

        if ($process.ExitCode -ne 0) {
            throw "Không thể lấy danh sách file từ Git.`n$errorOutput"
        }

        $bytes = $memoryStream.ToArray()
        $encoding = New-Object System.Text.UTF8Encoding($false)
        $fileList = New-Object System.Collections.Generic.List[string]

        $startIndex = 0

        for ($index = 0; $index -lt $bytes.Length; $index++) {
            if ($bytes[$index] -eq 0) {
                if ($index -gt $startIndex) {
                    $length = $index - $startIndex
                    $fileName = $encoding.GetString(
                        $bytes,
                        $startIndex,
                        $length
                    )

                    if (-not [string]::IsNullOrWhiteSpace($fileName)) {
                        $fileList.Add($fileName)
                    }
                }

                $startIndex = $index + 1
            }
        }

        return $fileList
    }
    finally {
        $memoryStream.Dispose()
        $process.Dispose()
    }
}

try {
    # Kiểm tra Git
    $gitCommand = Get-Command git -ErrorAction SilentlyContinue

    if ($null -eq $gitCommand) {
        throw @"
Không tìm thấy lệnh Git.

Hãy cài Git và đảm bảo lệnh sau chạy được:
git --version
"@
    }

    # Chuẩn hóa đường dẫn dự án
    $resolvedProjectPath = Resolve-Path `
        -LiteralPath $ProjectPath `
        -ErrorAction Stop

    $projectRoot = $resolvedProjectPath.ProviderPath.TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )

    if (-not (Test-Path -LiteralPath $projectRoot -PathType Container)) {
        throw "Đường dẫn không phải là thư mục: $projectRoot"
    }

    # Kiểm tra đây có phải Git repository hay không
    $isGitRepository = & $gitCommand.Source `
        -C $projectRoot `
        rev-parse `
        --is-inside-work-tree 2>$null

    if (
        $LASTEXITCODE -ne 0 -or
        "$isGitRepository".Trim() -ne "true"
    ) {
        throw "Thư mục không nằm trong một Git repository: $projectRoot"
    }

    $projectName = Split-Path -Leaf $projectRoot

    if ([string]::IsNullOrWhiteSpace($projectName)) {
        $projectName = "project"
    }

    # Tạo đường dẫn ZIP mặc định
    if ([string]::IsNullOrWhiteSpace($OutputPath)) {
        $parentDirectory = Split-Path -Parent $projectRoot
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $zipName = "$projectName-$timestamp.zip"

        $outputFullPath = Join-Path $parentDirectory $zipName
    }
    else {
        if (-not $OutputPath.EndsWith(
            ".zip",
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
            $OutputPath = "$OutputPath.zip"
        }

        if ([System.IO.Path]::IsPathRooted($OutputPath)) {
            $outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
        }
        else {
            $outputFullPath = [System.IO.Path]::GetFullPath(
                (Join-Path (Get-Location).Path $OutputPath)
            )
        }
    }

    $outputDirectory = Split-Path -Parent $outputFullPath

    if (-not (Test-Path -LiteralPath $outputDirectory)) {
        [void](New-Item `
            -ItemType Directory `
            -Path $outputDirectory `
            -Force)
    }

    if (Test-Path -LiteralPath $outputFullPath) {
        Remove-Item -LiteralPath $outputFullPath -Force
    }

    Write-Host ""
    Write-Host "Đang đọc danh sách file từ Git..." -ForegroundColor Cyan

    $files = Get-GitProjectFiles `
        -WorkingDirectory $projectRoot `
        -GitExecutable $gitCommand.Source

    if ($files.Count -eq 0) {
        throw "Không tìm thấy file nào để nén."
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $zipFileStream = [System.IO.File]::Open(
        $outputFullPath,
        [System.IO.FileMode]::Create
    )

    $zipArchive = New-Object System.IO.Compression.ZipArchive(
        $zipFileStream,
        [System.IO.Compression.ZipArchiveMode]::Create
    )

    $addedCount = 0
    $skippedCount = 0

    try {
        foreach ($relativePath in $files) {
            $fullPath = [System.IO.Path]::GetFullPath(
                (Join-Path $projectRoot $relativePath)
            )

            # Không tự thêm chính file ZIP đầu ra vào ZIP
            if (
                $fullPath.Equals(
                    $outputFullPath,
                    [System.StringComparison]::OrdinalIgnoreCase
                )
            ) {
                $skippedCount++
                continue
            }

            # Bỏ qua directory, submodule hoặc file không còn tồn tại
            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                $skippedCount++
                continue
            }

            # Trong file ZIP luôn sử dụng dấu /
            $zipEntryName = $relativePath.Replace("\", "/")

            [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zipArchive,
                $fullPath,
                $zipEntryName,
                [System.IO.Compression.CompressionLevel]::Optimal
            )

            $addedCount++

            Write-Progress `
                -Activity "Đang nén dự án" `
                -Status "$addedCount / $($files.Count): $relativePath" `
                -PercentComplete (($addedCount / $files.Count) * 100)
        }
    }
    finally {
        Write-Progress -Activity "Đang nén dự án" -Completed
        $zipArchive.Dispose()
        $zipFileStream.Dispose()
    }

    $zipSize = (Get-Item -LiteralPath $outputFullPath).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)

    Write-Host ""
    Write-Host "Nén dự án thành công." -ForegroundColor Green
    Write-Host "Số file đã nén : $addedCount"
    Write-Host "Số mục bỏ qua  : $skippedCount"
    Write-Host "Kích thước ZIP : $zipSizeMB MB"
    Write-Host "File đầu ra    : $outputFullPath"
}
catch {
    Write-Host ""
    Write-Host "Nén dự án thất bại:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}