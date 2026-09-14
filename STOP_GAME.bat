@echo off
setlocal
cd /d "%~dp0"
title Combat Cataclysm - Stop Game Server

echo [Combat Cataclysm] Looking for local Node server...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-CimInstance Win32_Process ^| Where-Object { $_.Name -match '^node(.exe)?$' -and $_.CommandLine -match 'server\.mjs' }; if ($p) { $p ^| ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('Stopped PID ' + $_.ProcessId) } } else { Write-Host 'No Combat Cataclysm server process found.' }"

exit /b 0
