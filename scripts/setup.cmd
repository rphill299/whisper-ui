rem Setup requires latest versions of Node.js, python3, and pip3 installed on your machine
rem 
rem Setup Steps:
rem 1. Install packages required for react-ui
rem 2. Install packages required for flask-server


rem Uncomment below to suppress output
rem @echo off

rem 1. React 
 
cd .\react-ui
rem general installs
npm install 
rem install axios for communication with backend
npm install axios
rem install concurrently for running backend and frontend at same time in same terminal session
npm install concurrently
cd ..\



rem 2. Flask

cd .\flask-server\src
rem create python virtual environment in src folder
python3 -m venv .venv
rem activate virtual environment
source .venv\bin\activate
rem install flask and flask-cors in v.env.
python3 -m pip install flask flask-cors
rem deactivate v.env.
deactivate
cd ..\..\

pause