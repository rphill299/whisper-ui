# Audio-Analyzer-and-Transcription-Tool
End to end audio transcription and information extraction from audio input. 

# Running our Project
1. Make sure you have the required dependencies listed below
2. Open your terminal, navigate to our main project directory _(Audio-Analyzer-and-Transcription-Tool)_ and type:
- macOS/Linux:
    - sh scripts/run.sh
- Windows:
    - _(coming soon)_

# Required Depenencies
To download and run our code, the user must:
1. Install the latest versions of the following:
- Node.js
- python3
- pip3 _(if not included in your python3 download)_
- ffmpeg
2. Open your terminal, navigate to our main project directory _(Audio-Analyzer-and-Transcription-Tool)_ and type:
- macOS/Linux:
    - sh scripts/setup.sh
- Windows:
    - _(coming soon)_

setup.sh automatically downloads the following:

Node.js installs:
- general node installs ("npm install")
- axios
- concurrently

Python3 installs:
- numpy
- flask
- flask-cors
- python-dotenv
- torch
- torchaudio
- openai-whisper
- soundfile

_(node packages go into react-ui/node_modules/; python packages go into virtual environment created in flask-backend/src/.venv/; nothing outside of our project folder is touched)_