@echo off
cd /d "%~dp0"
echo Starting local preview server at http://localhost:8181/
python -m http.server 8181
