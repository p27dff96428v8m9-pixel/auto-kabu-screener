$gasSource = "C:\Users\p27df\mysite\fund-flow-ai\GAS.txt"
$spreadsheetUrl = "https://docs.google.com/spreadsheets/d/1C8UzXEeRYIuw4mMoYEB1Di3WdRyIhRsOmL0LVvPGNiQ/edit"
if (-not (Test-Path $gasSource)) {
    throw "GAS source not found: $gasSource"
}
$gasCode = Get-Content -Path $gasSource -Raw -Encoding UTF8
Set-Clipboard -Value $gasCode
Start-Process $spreadsheetUrl
Write-Output "Copied GAS.txt to clipboard and opened the spreadsheet."
Write-Output "In Apps Script: Extensions > Apps Script, replace Code.gs, Deploy > Manage deployments > Edit > New version > Deploy."