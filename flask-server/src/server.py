from flask import Flask, request
from flask_cors import CORS, cross_origin
import sys
from wav2vec2_test2 import run
from os.path import expanduser, join, splitext
from os import getcwd, chdir
import whisper

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type' #this line may or may not be unnecessary

PRINT_TO_CONSOLE = sys.stderr #print to this file within endpoints to print to console
HOME_DIR = expanduser("~") #user's home directory
chdir(join("..", ".."))
CURR_DIR = getcwd() #user's current directory, and project directory

model = whisper.load_model("base")

# this is called once when the app starts up
# simply returns a default data folder in the correct formatting of the user's os
@app.route('/init/')
@cross_origin()
def init():
    print("received initial request", file=PRINT_TO_CONSOLE)
    response = {'folder'   : CURR_DIR} # returning path to main project folder with correct separators
    return response


# transcribe a single file with Whisper
@app.route('/whisper-transcribe-file/', methods = ['GET'])
@cross_origin()
def whisper_transcribe_file():
    inputFilename = request.args.get("filename")
    inputFolder = request.args.get("folder")
    inputFilePath = join(inputFolder, inputFilename)
    print("received whisper transcribe request for " + inputFilename, file=PRINT_TO_CONSOLE)

    transcript = model.transcribe(inputFilePath)

    response = {'status'    : 0,
                'transcript': transcript}
    return response

# transcribe a folder with Whisper
@app.route('/whisper-transcribe-folder/', methods = ['GET'])
@cross_origin()
def whisper_transcribe_folder():
    inputFolder = request.args.get("folder")
    print("received whisper transcribe request for " + inputFolder, file=PRINT_TO_CONSOLE)

    transcript = "need to implement"

    ## HANDLE BATCH TRANSCRIPTION ## 

    response = {'status'    : 0,
                'transcript': transcript}
    return response


@app.route('/wav2vec2-transcribe/', methods = ['POST'])
@cross_origin()
def wav2vec2_transcribe():
    file = request.files['file']
    print("received wav2vec2 transcribe request for " + file.filename, file=PRINT_TO_CONSOLE)

    transcript = run(file=file, flag=False)
    response = {'status'    : 0,
                'transcript':transcript}
    return response
