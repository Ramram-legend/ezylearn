@echo off
chcp 65001 >nul
title EasyLearn - Tests E2E Vercel
color 0B

echo.
echo  ══════════════════════════════════════════════════════
echo    EasyLearn - Tests E2E sur Vercel Production
echo    URL : https://easylearn-ochre.vercel.app
echo  ══════════════════════════════════════════════════════
echo.

:: Vérifier Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  [ERREUR] Node.js n'est pas installe !
    echo  Installez-le sur : https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  Node.js detecte : %NODE_VER%
echo  Lancement des tests...
echo.

:: Lancer les tests
node "%~dp0e2e-vercel.mjs"
set EXIT_CODE=%ERRORLEVEL%

echo.
if %EXIT_CODE% EQU 0 (
    color 0A
    echo  ✓ Tous les tests passes !
) else (
    color 0C
    echo  ✗ Certains tests ont echoue (code: %EXIT_CODE%)
)
echo.

pause
exit /b %EXIT_CODE%
