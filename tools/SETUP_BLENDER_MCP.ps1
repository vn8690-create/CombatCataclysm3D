# Run from PowerShell in the CombatCataclysm3D repository.
# Requires Blender GUI installed, official Codex CLI and uvx. This helper does not install executables.
$ErrorActionPreference = 'Stop'

function Require-Command($name, $url) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "$name not found. Install from $url, reopen PowerShell, then retry."
  }
}
Require-Command 'uvx' 'https://docs.astral.sh/uv/getting-started/installation/'
Require-Command 'codex' 'https://developers.openai.com/codex/cli/'

Write-Host 'Checking Codex MCP entries...' -ForegroundColor Cyan
$existing = & codex mcp list 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) { throw 'codex mcp list failed. Check Codex installation/login.' }
if ($existing -match '(?m)^blender\s') {
  Write-Host 'Existing blender entry detected: will not overwrite it.' -ForegroundColor Yellow
} else {
  & codex mcp add blender -- uvx mcp-for-blender
  if ($LASTEXITCODE -ne 0) { throw 'Codex Blender MCP registration failed.' }
}

Write-Host 'Installing the community Blender MCP addon...' -ForegroundColor Cyan
& uvx mcp-for-blender install-addon
if ($LASTEXITCODE -ne 0) { throw 'Blender addon installation failed. Check uvx output.' }

& codex mcp list
Write-Host ''
Write-Host 'NEXT: Open/restart Blender. Edit > Preferences > Add-ons: enable Interface: MCP for Blender.' -ForegroundColor Green
Write-Host 'In the 3D viewport press N, select MCP for Blender and start/connect its server.' -ForegroundColor Green
Write-Host 'Restart Codex so it discovers the Blender tools. Keep the Blender MCP listener on localhost.' -ForegroundColor Yellow
Write-Host 'Then follow production/GYM_UNCLE_3D_PIPELINE.md for the model and game integration.' -ForegroundColor Cyan
