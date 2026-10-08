# ─── EasyLearn — Lancer les tests E2E Vercel ───────────────────────────────
# Fichier : test/run-e2e.ps1
# Usage   : Faites un clic droit > "Exécuter avec PowerShell"
#           OU dans un terminal PowerShell : .\test\run-e2e.ps1

Write-Host ""
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   EasyLearn — Tests E2E sur Vercel Production   " -ForegroundColor Cyan  
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Node.js est installé
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js non trouvé. Installez-le sur https://nodejs.org" -ForegroundColor Red
    pause
    exit 1
}

$nodeVersion = node --version
Write-Host "  Node.js : $nodeVersion" -ForegroundColor Green

$scriptPath = Join-Path $PSScriptRoot "e2e-vercel.mjs"
Write-Host "  Script  : $scriptPath" -ForegroundColor Green
Write-Host ""

# Lancer les tests
node $scriptPath

# Pause pour voir les résultats
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor DarkGray
pause
