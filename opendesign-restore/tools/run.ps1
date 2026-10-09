# Choose the saved HTML, rebuild restore-pack, and copy the prompt.
# ASCII only. Windows PowerShell 5.1 misreads UTF-8 without a BOM.
param([string]$html)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# Remove the previous result as soon as the program opens, before choosing a file.
$outDir = Join-Path $PSScriptRoot "restore-pack"
if (Test-Path -LiteralPath $outDir) {
    Remove-Item -LiteralPath $outDir -Recurse -Force
    Write-Host "Removed the previous restore-pack."
}

if ($html -and -not (Test-Path -LiteralPath $html)) {
    Write-Host "File not found: $html"
    exit 1
}

if (-not $html) {
    Add-Type -AssemblyName System.Windows.Forms
    $owner = New-Object System.Windows.Forms.Form
    $owner.TopMost = $true
    $owner.StartPosition = "CenterScreen"
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Filter = "HTML (*.html;*.htm)|*.html;*.htm|All files (*.*)|*.*"
    $dialog.Title = "Select the HTML saved from Open Design"
    $answer = $dialog.ShowDialog($owner)
    $owner.Dispose()
    if ($answer -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host "No file selected."
        exit 1
    }
    $html = $dialog.FileName
}

Write-Host "Reading $html"
& node (Join-Path $PSScriptRoot "extract-design.mjs") $html $outDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$prompt = Join-Path $outDir "PROMPT.md"
if (Test-Path -LiteralPath $prompt) {
    Get-Content -LiteralPath $prompt -Raw -Encoding UTF8 | Set-Clipboard
    Write-Host "Prompt copied to the clipboard."
}

Write-Host ""
Write-Host "Measurement stage complete: $outDir"
Write-Host "Next: restore/reuse web source, then convert to Kotlin/Jetpack Compose Android."
Write-Host "Deliver the Android Studio project, opening/build instructions, and a verified debug APK."
Write-Host "For another AI: send this folder plus the original HTML and paste the copied prompt."
Write-Host "Save final projects outside restore-pack; the next measurement replaces this folder."
Write-Host "The matching _files folder must stay beside the original HTML."
