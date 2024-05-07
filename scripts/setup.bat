@echo off

rem Change directory to react-ui
cd .\react-ui

rem Perform all installs according to package-lock.json 
rem Use --force because otherwise cannot install @material-ui for tabbed view
if not exist node_modules npm install --force
echo doneinstalling
cd ..

rem Change directory to flask-server/src
cd .\flask-server\src

rem Create python virtual environment in src folder
python -m venv .venv

rem Activate virtual environment
call .venv\Scripts\activate.bat

rem Install flask and flask-cors in v.env.
python -m pip install -U numpy flask flask-cors python-dotenv torch torchaudio openai-whisper soundfile librosa pyannote.audio pydub

rem Install transformers from GitHub
python -m pip install git+https://github.com/huggingface/transformers

rem Deactivate v.env.
deactivate

rem Change back to the previous directory
cd ..\..\..
