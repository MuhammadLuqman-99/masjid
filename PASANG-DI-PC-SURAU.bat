@echo off
echo.
echo  ==========================================
echo   PEMASANGAN PAPARAN WAKTU SOLAT
echo   Surau Desa Murni Gong Kapas
echo  ==========================================
echo.

:: Check if Node.js already installed
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Node.js sudah dipasang.
    goto :install_deps
)

:: Install Node.js
echo  [1/3] Memasang Node.js...
echo        Sila ikut arahan pemasangan. Tekan Next sahaja.
echo.
start /wait msiexec /i "%~dp0node-installer.msi"

:: Verify installation
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [GAGAL] Node.js tidak berjaya dipasang.
    echo  Sila restart PC dan cuba lagi.
    pause
    exit /b 1
)
echo  [OK] Node.js berjaya dipasang!

:install_deps
echo.
echo  [2/3] Memasang komponen sistem...
cd /d "%~dp0"
call npm install --production
echo  [OK] Komponen berjaya dipasang!

:: Create auto-start
echo.
echo  [3/3] Menyediakan auto-start...
cscript //nologo "%~dp0setup-autostart.vbs" 2>nul

:: Create desktop shortcut
cscript //nologo "%~dp0setup-shortcut.vbs" 2>nul

echo.
echo  ==========================================
echo   PEMASANGAN SELESAI!
echo  ==========================================
echo.
echo   Sistem akan jalan automatik bila PC on.
echo   Atau klik "Surau Desa Murni" di Desktop.
echo.
echo   Tekan sebarang kekunci untuk mulakan sekarang...
pause >nul

:: Start the app now
start "" "%~dp0start-masjid.bat"
