@echo off
cd /d "%~dp0"
title AliceD Game Launcher

echo ========================================================
echo                 AliceD Game Launcher
echo ========================================================
echo.
echo Starting local game server...
echo The game will open in your default browser automatically.
echo.
echo [NOTE]
echo Please keep this window OPEN while playing the game.
echo Closing this window will stop the game.
echo.

:: Use npx vite --open to start the server and open browser
call npx vite --open

pause
