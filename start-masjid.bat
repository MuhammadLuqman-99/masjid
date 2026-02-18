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
node server.js

echo.
echo  Sistem telah ditutup. / System has stopped.
echo  Tekan sebarang kekunci untuk keluar.
pause >nul
