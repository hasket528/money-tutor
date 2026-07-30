@echo off
title Shopping Practice - Local Server
echo Starting local server (no install needed)...
rem Port 47810, one above the whole-site launcher's 47800, so both can run at the same time
rem and each keeps its own stable origin (= its own remembered microphone permission).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 47810
echo.
echo Server stopped.
pause
