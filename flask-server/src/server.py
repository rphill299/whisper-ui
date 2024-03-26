from flask import Flask, request
from flask_cors import CORS, cross_origin
import sys
from wav2vec2_test2 import run
from os.path import expanduser, join, splitext
from os import getcwd
import whisper

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type' #this line may or may not be unnecessary

PRINT_TO_CONSOLE = sys.stderr #print to this file within endpoints to print to console
HOME_DIR = expanduser("~") #user's home directory
CURR_DIR = getcwd() #user's current directory 

model = whisper.load_model("base")

# this is called once when the app starts up
# simply returns a default data folder in the correct formatting of the user's os
@app.route('/init/')
@cross_origin()
def init():
    print("received initial request", file=PRINT_TO_CONSOLE)
    response = {'folder'   : CURR_DIR} # returning (home)/Documents/Data with correct separators
    return response


# this is called when the transcribe button is pressed 
# TODO: modify to accept arguments, or adjust to only be called under some settings
@app.route('/whisper-transcribe/', methods = ['GET'])
@cross_origin()
def whisper_transcribe():
    inputFilename = request.args.get("filename")
    inputFolder = request.args.get("folder")
    inputFilePath = join(inputFolder, inputFilename)
    print("received whisper transcribe request for " + inputFilename, file=PRINT_TO_CONSOLE)

    transcript = model.transcribe(inputFilePath)

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
