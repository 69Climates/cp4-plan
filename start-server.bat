@echo off
echo Starting CP4 Development Server...
echo.
echo Server will be available at:
echo   http://localhost:8000
echo.
echo To test notifications:
echo   1. Open http://localhost:8000/test-notifications.html
echo   2. Or open http://localhost:8000/cp4%%20plan/index.html
echo.
echo Press Ctrl+C to stop the server
echo.
cd "cp4 plan"
python -m http.server 8000
