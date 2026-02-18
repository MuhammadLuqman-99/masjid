@echo off
title Surau Desa Murni - Paparan Waktu Solat
echo.
echo  ==========================================
echo   Surau Desa Murni Gong Kapas
echo   Paparan Waktu Solat / Prayer Display
echo  ==========================================
echo.
echo  Memulakan sistem... / Starting system...
echo.

cd /d "%~dp0"

:: Tunggu 3 saat kemudian buka browser fullscreen
start "" /min cmd /c "timeout /t 3 /nobreak >nul && start chrome --kiosk http://localhost:3000"

:: Jalankan server
node server.js

echo.
echo  Sistem telah ditutup. / System has stopped.
pause >nul
