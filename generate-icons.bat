@echo off
echo Generating Tauri icons...
echo.

REM Check if tauri CLI is installed
where tauri >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Tauri CLI not found. Installing...
    npm install -g @tauri-apps/cli
)

REM Generate icons from the 512x512 source
cd "cp4 plan"
tauri icon 512_icon.png

echo.
echo Icons generated successfully in src-tauri/icons/
echo.
pause
