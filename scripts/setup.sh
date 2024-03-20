# Setup requires latest versions of Node.js, python3, and pip3 installed on your machine
# 
# Setup Steps:
# 1. Install packages required for react-ui
# 2. Install packages required for flask-server


# 1. React

cd ./react-ui
# general installs
npm install 
# install axios for communication with backend
npm install axios
# install concurrently for running backend and frontend at same time in same terminal session
npm install concurrently
cd ../


# 2. Flask

cd ./flask-server/src
# create python virtual environment in src folder
python3 -m venv .venv
# activate virtual environment
source .venv/bin/activate
# install flask and flask-cors in v.env.
python3 -m pip install flask flask-cors
# deactivate v.env.
deactivate
cd ../../