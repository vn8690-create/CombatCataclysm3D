@echo off
setlocal
cd /d "%~dp0"
title Combat Cataclysm - Start Game

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul 2>nul
if errorlevel 1 (
  echo [Combat Cataclysm] Starting local game server...
  start "Combat Cataclysm Server" /min cmd /c "cd /d ""%~dp0"" && npm start > .combat-server.log 2>&1"
  timeout /t 2 /nobreak >nul
) else (
  echo [Combat Cataclysm] Server is already running on port 8000.
)

start "" "http://127.0.0.1:8000"
echo [Combat Cataclysm] Game opened in your browser.
exit /b 0
