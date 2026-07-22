param(
    [switch]$Debug,
    [switch]$BoQuaBundle
)

# Bật UTF-8 để hiển thị tiếng Việt có dấu
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Continue"
$ADB = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$TEN_PACKAGE = "com.tomisakae.ziasub"
$THU_MUC_GOC = Split-Path -Parent $PSScriptRoot
$THU_MUC_MOBILE = "$THU_MUC_GOC\packages\mobile"
$THU_MUC_ANDROID = "$THU_MUC_MOBILE\android"
$LOAI_BUILD = if ($Debug) { "Debug" } else { "Release" }
$LOAI_BUILD_THUONG = $LOAI_BUILD.ToLower()
$DUONG_DAN_APK = "$THU_MUC_ANDROID\app\build\outputs\apk\$LOAI_BUILD_THUONG\app-$LOAI_BUILD_THUONG.apk"

function Buoc([string]$noi_dung) {
    Write-Host "`n--- $noi_dung" -ForegroundColor Cyan
}

function ThanhCong([string]$noi_dung) {
    Write-Host "    OK  $noi_dung" -ForegroundColor Green
}

function ThatBai([string]$noi_dung) {
    Write-Host "    LOI $noi_dung" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== ZiaSub - Tự động Build và Cài đặt ($LOAI_BUILD) ===" -ForegroundColor Magenta

# BƯỚC 1: Kiểm tra ADB & kết nối điện thoại
Buoc "Kiểm tra kết nối điện thoại qua USB..."
if (-not (Test-Path $ADB)) {
    ThatBai "Không tìm thấy ADB tại: $ADB"
}
$ketQuaADB = & $ADB devices 2>&1
$danhSachMay = @($ketQuaADB | Where-Object { $_ -match "\sdevice$" })
if ($danhSachMay.Count -eq 0) {
    ThatBai "Không thấy điện thoại nào! Hãy cắm cáp USB và bật chế độ Gỡ lỗi USB."
}
ThanhCong "Tìm thấy điện thoại: $($danhSachMay[0])"

# BƯỚC 2: Tạo local.properties nếu chưa có
$fileCauHinh = "$THU_MUC_ANDROID\local.properties"
if (-not (Test-Path $fileCauHinh)) {
    Buoc "Tạo file cấu hình Android SDK..."
    $sdkEscaped = "$env:LOCALAPPDATA\Android\Sdk".Replace("\", "\\")
    "sdk.dir=$sdkEscaped" | Out-File -FilePath $fileCauHinh -Encoding ascii
    ThanhCong "Đã tạo local.properties"
}

# BƯỚC 3: Đóng gói mã nguồn JavaScript
if (-not $BoQuaBundle) {
    Buoc "Đóng gói mã nguồn JavaScript..."
    New-Item -ItemType Directory -Force -Path "$THU_MUC_ANDROID\app\src\main\assets" | Out-Null
    Set-Location $THU_MUC_MOBILE
    npx expo export:embed `
        --platform android `
        --dev false `
        --entry-file index.js `
        --bundle-output "android\app\src\main\assets\index.android.bundle" `
        --assets-dest "android\app\src\main\res"
    if ($LASTEXITCODE -ne 0) {
        Set-Location $THU_MUC_GOC
        ThatBai "Đóng gói JavaScript thất bại!"
    }
    Set-Location $THU_MUC_GOC
    ThanhCong "Đóng gói JavaScript thành công!"
}

# BƯỚC 4: Biên dịch APK
Buoc "Biên dịch APK bản $LOAI_BUILD..."
Set-Location $THU_MUC_ANDROID
& .\gradlew.bat "assemble$LOAI_BUILD" --quiet
if ($LASTEXITCODE -ne 0) {
    Set-Location $THU_MUC_GOC
    ThatBai "Biên dịch APK thất bại!"
}
Set-Location $THU_MUC_GOC
ThanhCong "Biên dịch APK thành công!"

# BƯỚC 5: Cài đặt APK lên điện thoại
Buoc "Cài đặt APK lên điện thoại..."
$ketQuaCaiDat = & $ADB install -r $DUONG_DAN_APK 2>&1
if ("$ketQuaCaiDat" -match "Success") {
    ThanhCong "Cài đặt thành công!"
} else {
    ThatBai "Cài đặt thất bại: $ketQuaCaiDat"
}

# BƯỚC 6: Mở ứng dụng
Buoc "Khởi động ZiaSub trên điện thoại..."
& $ADB shell am force-stop $TEN_PACKAGE | Out-Null
Start-Sleep -Milliseconds 600
& $ADB shell am start -n "$TEN_PACKAGE/.MainActivity" | Out-Null
ThanhCong "Ứng dụng đã được khởi động!"

Write-Host "`n=== HOÀN THÀNH! ZiaSub bản $LOAI_BUILD đang chạy trên điện thoại. ===`n" -ForegroundColor Green
