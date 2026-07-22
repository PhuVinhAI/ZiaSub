#!/usr/bin/env pwsh
# build-and-install.ps1
# Script tự động: Bundle JS -> Build Release APK -> Cài lên điện thoại qua USB
# Cách dùng: .\scripts\build-and-install.ps1
# Hoặc debug:  .\scripts\build-and-install.ps1 -Debug

param(
    [switch]$Debug,       # Build bản Debug thay vì Release
    [switch]$SkipBundle   # Bỏ qua bước bundle JS (nếu assets đã sẵn có)
)

$ErrorActionPreference = "Stop"
$ADB = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$PACKAGE = "com.tomisakae.ziasub"
$ROOT = Split-Path -Parent $PSScriptRoot
$MOBILE = "$ROOT\packages\mobile"
$ANDROID = "$MOBILE\android"
$BUILD_TYPE = if ($Debug) { "Debug" } else { "Release" }
$BUILD_TYPE_LOWER = $BUILD_TYPE.ToLower()
$APK_PATH = "$ANDROID\app\build\outputs\apk\$BUILD_TYPE_LOWER\app-$BUILD_TYPE_LOWER.apk"

function Write-Step {
    param([string]$msg, [string]$icon = "⚡")
    Write-Host "`n$icon $msg" -ForegroundColor Cyan
}

function Write-OK {
    param([string]$msg)
    Write-Host "  ✅ $msg" -ForegroundColor Green
}

function Write-Fail {
    param([string]$msg)
    Write-Host "  ❌ $msg" -ForegroundColor Red
    exit 1
}

# ─────────────────────────────────────────────
Write-Host "`n🚀 ZiaSub Build & Install - Bản $BUILD_TYPE" -ForegroundColor Magenta
Write-Host "──────────────────────────────────────────" -ForegroundColor DarkGray

# BƯỚC 1: Kiểm tra ADB & thiết bị
Write-Step "Kiểm tra kết nối USB..."
if (-not (Test-Path $ADB)) { Write-Fail "Không tìm thấy ADB: $ADB" }
$deviceList = & $ADB devices 2>&1
$deviceLines = $deviceList | Where-Object { $_ -match "\sdevice$" }
if (-not $deviceLines) { Write-Fail "Không thấy thiết bị! Hãy cắm USB và cho phép Gỡ lỗi USB." }
Write-OK "Tìm thấy thiết bị: $($deviceLines[0])"

# BƯỚC 2: Bundle JS (bỏ qua nếu -SkipBundle)
if (-not $SkipBundle) {
    Write-Step "Đóng gói mã nguồn JavaScript..."
    New-Item -ItemType Directory -Force -Path "$MOBILE\android\app\src\main\assets" | Out-Null
    $bundleArgs = @(
        "expo", "export:embed",
        "--platform", "android",
        "--dev", "false",
        "--entry-file", "index.js",
        "--bundle-output", "android/app/src/main/assets/index.android.bundle",
        "--assets-dest", "android/app/src/main/res"
    )
    Push-Location $MOBILE
    try {
        & npx @bundleArgs
        if ($LASTEXITCODE -ne 0) { Write-Fail "Bundle JS thất bại!" }
    } finally { Pop-Location }
    Write-OK "Bundle JS hoàn tất!"
}

# BƯỚC 3: Build APK
Write-Step "Build bản $BUILD_TYPE APK..."
Push-Location $ANDROID
try {
    & .\gradlew.bat "assemble$BUILD_TYPE" --quiet
    if ($LASTEXITCODE -ne 0) { Write-Fail "Build Gradle thất bại!" }
} finally { Pop-Location }
Write-OK "Build APK hoàn tất!"

# BƯỚC 4: Cài lên điện thoại
Write-Step "Cài APK lên điện thoại..."
$installResult = & $ADB install -r $APK_PATH 2>&1
if ($installResult -match "Success") {
    Write-OK "Cài đặt APK thành công!"
} else {
    Write-Fail "Cài đặt thất bại: $installResult"
}

# BƯỚC 5: Khởi động ứng dụng
Write-Step "Khởi động ZiaSub..."
& $ADB shell am force-stop $PACKAGE | Out-Null
Start-Sleep -Milliseconds 500
& $ADB shell am start -n "$PACKAGE/.MainActivity" | Out-Null
Write-OK "Ứng dụng đã được khởi động!"

Write-Host "`n🎉 HOÀN THÀNH! ZiaSub bản $BUILD_TYPE đã chạy trên điện thoại.`n" -ForegroundColor Green
