@echo off
rem Local web server for the WHOLE project: index.html, the 24 units, adventure and the
rem dialogue module all served from http://localhost:47800 by the built-in PowerShell.
rem No Python / Node / admin rights needed.
rem
rem Why not just double-click index.html: file:// is not a secure origin, so the microphone
rem is unavailable and the service worker (offline cache) never registers. localhost is.
rem
rem The port comes from $PORT_CANDIDATES in serve.ps1 - 47800 first, because a port nothing
rem else wants means one stable origin, and the browser remembers the microphone permission
rem per origin. If it is busy anyway, serve.ps1 checks who holds it: our own server for this
rem same folder -> reuses it; anything else -> next candidate, and it says so on screen.
rem
rem The browser opens by itself: Edge first (it has the Microsoft Yating Chinese voice this
rem project prefers), then Chrome, then whatever Windows uses.
rem
rem NOTE: keep this file ASCII-only. cmd reads .bat as cp950, and multi-byte characters in a
rem rem-line can swallow the line break, turning the rest of the comment into commands.
rem
rem Close the window to stop the server; the port is released with it.
title Money Tutor - Local Server (whole site)
echo Starting local server for the whole project (no install needed)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dialogue\serve.ps1" -Root "%~dp0."
echo.
echo Server stopped.
pause
