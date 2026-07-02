@echo off
cd /d "%~dp0"
title AliceD Game Launcher

echo ========================================================
echo                 AliceD Game Launcher
echo ========================================================
echo.
echo Starting latest-source development server...
echo The game will open in your default browser automatically.
echo.
echo [NOTE]
echo Please keep this window OPEN while playing the game.
echo Closing this window will stop the game.
echo.

:: Use the dev server so the browser always runs the latest src files.
:: Do not use "npm run preview" for debugging; preview serves the built dist folder.
call npm run play

pause