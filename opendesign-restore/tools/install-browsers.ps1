# Install the Chromium build Playwright drives.
# The library is already in node_modules; this step only downloads the browser.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js was not found. Install version 22, 24, or 26 from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ("Node " + (node -v))
Write-Host "Downloading Chromium..."
# Call the local CLI directly. npx cannot find the launcher because
# node_modules was installed for another operating system.
node ".\node_modules\playwright\cli.js" install chromium
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

node ".\node_modules\playwright\cli.js" --version
Write-Host "Done. Chromium is installed in the local cache." -ForegroundColor Green
