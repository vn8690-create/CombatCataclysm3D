@echo off
setlocal
cd /d "%~dp0"
title Combat Cataclysm - Tests

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  pause
  exit /b 1
)

echo ========================================
echo        COMBAT CATACLYSM TESTS
echo ========================================
echo.
echo [1/2] Lightweight system checks
call npm run test:unit
set UNIT_RESULT=%ERRORLEVEL%

echo.
echo [2/2] Browser smoke test
call npm test
set SMOKE_RESULT=%ERRORLEVEL%

echo.
if "%UNIT_RESULT%"=="0" if "%SMOKE_RESULT%"=="0" (
  echo ALL TESTS PASSED.
) else (
  echo Some tests did not pass. See the messages above.
  echo Note: the browser smoke test requires Playwright to be installed.
)
echo.
pause
exit /b 0
