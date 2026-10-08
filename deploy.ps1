#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════
#  EasyLearn — Script de déploiement Vercel
#  Exécuter depuis PowerShell : .\deploy.ps1
# ═══════════════════════════════════════════════════════════

Set-Location "C:\Users\hp\Desktop\easylearn\easylearn-backend\easylearn-backend"

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  EasyLearn — Déploiement Vercel Production" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Étape 1 : vérifier le statut git ─────────────────────
Write-Host "[1/4] Vérification du statut git..." -ForegroundColor Yellow
$gitStatus = git status --short 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠  Git non disponible ou pas de dépôt initialisé." -ForegroundColor Yellow
    Write-Host "  → Tentative de déploiement direct via Vercel CLI..." -ForegroundColor Gray
    goto VercelDeploy
}

Write-Host $gitStatus
Write-Host ""

# ── Étape 2 : commit de tout ─────────────────────────────
Write-Host "[2/4] Commit de tous les fichiers modifiés..." -ForegroundColor Yellow
git add -A
$commitMsg = "feat: mini-jeu ConceptAnimator + fix routes + security headers + PWA"
git commit -m $commitMsg
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Commit créé : $commitMsg" -ForegroundColor Green
} else {
    Write-Host "  ℹ  Rien à committer (working tree propre)" -ForegroundColor Gray
}

# ── Étape 3 : push vers le remote ────────────────────────
Write-Host ""
Write-Host "[3/4] Push vers le dépôt distant (déclenchera Vercel auto-deploy)..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Push réussi ! Vercel va redéployer automatiquement." -ForegroundColor Green
    Write-Host "  → Attendre 2-3 minutes puis relancer les tests." -ForegroundColor Gray
} else {
    Write-Host "  ✗ Échec du push. Vérifiez vos droits." -ForegroundColor Red
}

Write-Host ""

# ── Étape 4 (optionnel) : forcer via Vercel CLI ──────────
:VercelDeploy
Write-Host "[4/4] Déploiement forcé via Vercel CLI (si git push insuffisant)..." -ForegroundColor Yellow
$vercelExe = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelExe) {
    vercel --prod --yes
    Write-Host "  ✓ Déployé via Vercel CLI." -ForegroundColor Green
} else {
    Write-Host "  ℹ  Vercel CLI non installé. Pour l'installer :" -ForegroundColor Gray
    Write-Host "     npm install -g vercel" -ForegroundColor White
    Write-Host "     vercel --prod" -ForegroundColor White
}

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Après 2-3 min, relancez les tests :" -ForegroundColor Cyan
Write-Host "  node test/e2e-vercel.mjs --skip-ai" -ForegroundColor White
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
