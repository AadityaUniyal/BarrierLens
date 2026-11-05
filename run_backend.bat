@echo off
title BarrierLens Python Backend (Port 8000)
echo ================================================================
echo   BarrierLens Python Backend (AWS Bedrock Nova + Strands Swarm)
echo   Target: http://127.0.0.1:8000
echo   Health: http://127.0.0.1:8000/health
echo ================================================================
python backend\app.py
pause
