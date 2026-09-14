@echo off
setlocal
cd /d "%~dp0"
title Combat Cataclysm - Update and Play

echo ========================================
echo   COMBAT CATACLYSM - UPDATE AND PLAY
echo ========================================
echo.

where git >nul 2>nul
if errorlevel 1 goto :nogit

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 goto :nogit

echo [1/4] Updating stable main branch...
git fetch origin main
if errorlevel 1 goto :updatefail
git switch main
if errorlevel 1 goto :updatefail
git pull --ff-only origin main
if errorlevel 1 goto :updatefail
goto :afterupdate

:nogit
echo [1/4] Git repo not available here. Using the local copy.
goto :afterupdate

:updatefail
echo.
echo [WARNING] Automatic update could not finish.
echo Your local files were not force-overwritten.
echo The launcher will continue with the current local version.
echo.

:afterupdate
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  pause
  exit /b 1
)

echo [2/4] Running lightweight Combat Feel checks...
call npm run test:feel
if errorlevel 1 (
  echo.
  echo [WARNING] Combat Feel check reported a problem.
  echo Starting the game anyway because this launcher is configured for easy local testing.
  echo.
)

echo [3/4] Starting server if needed...
netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul 2>nul
if errorlevel 1 (
  start "Combat Cataclysm Server" /min cmd /c "cd /d ""%~dp0"" && npm start > .combat-server.log 2>&1"
  timeout /t 2 /nobreak >nul
)

echo [4/4] Opening game...
start "" "http://127.0.0.1:8000"
echo.
echo Ready. Have fun.
exit /b 0
