#!/bin/bash
echo 'Starting backend server...'
cd backend
npm run dev &
BACKEND_PID=$!
echo 'Backend server started!'

echo 'Waiting for backend to initialize...'
sleep 10

echo 'Starting frontend server...'
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo 'Frontend server started!'

echo 'Press Ctrl+C to stop both servers'
trap 'kill $BACKEND_PID $FRONTEND_PID; echo "Servers stopped"; exit' INT
wait 