@echo off
echo Stopping any running Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Starting server...
start cmd /k "cd %~dp0 && npm run dev"

echo Starting client...
start cmd /k "cd %~dp0/client && npm run dev"

echo Development servers started!
echo Server running on http://localhost:5000
echo Client running on http://localhost:5173 