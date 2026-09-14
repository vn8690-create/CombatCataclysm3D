@echo off
setlocal
cd /d "%~dp0"
title Combat Cataclysm - Studio

echo ========================================
echo       COMBAT CATACLYSM STUDIO
echo ========================================
echo.

where code >nul 2>nul
if not errorlevel 1 (
  echo Opening project in VS Code...
  start "" code "%~dp0"
) else (
  echo VS Code command not found. Opening project folder instead...
  start "" explorer "%~dp0"
)

where claude >nul 2>nul
if not errorlevel 1 (
  echo Opening Claude Code...
  start "Claude Code - Combat Cataclysm" cmd /k "cd /d ""%~dp0"" && claude"
) else (
  echo Claude Code command was not found. The project itself is open and ready.
)

netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul 2>nul
if errorlevel 1 (
  echo Starting local game server...
  start "Combat Cataclysm Server" /min cmd /c "cd /d ""%~dp0"" && npm start > .combat-server.log 2>&1"
  timeout /t 2 /nobreak >nul
)

start "" "http://127.0.0.1:8000"
exit /b 0
