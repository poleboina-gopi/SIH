@echo off
echo ========================================================
echo  ⚖️ Starting Legal Metrology Compliance Enforcement System
echo ========================================================
echo Starting Backend API (Port 5000)...
start "Legal Metrology API :5000" cmd /k "cd server && npm start"
timeout /t 2 /nobreak >nul
echo Starting Frontend Client (Port 5173)...
start "Legal Metrology Client :5173" cmd /k "cd client && npm run dev"
echo.
echo Both services are now running!
echo Backend:  http://localhost:5000/api
echo Frontend: http://localhost:5173
echo ========================================================
