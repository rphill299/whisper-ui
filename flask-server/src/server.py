from flask import Flask, request
from flask_cors import CORS, cross_origin
import sys
from wav2vec2_test2 import run
from os.path import expanduser, join, splitext

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type' #this line may or may not be unnecessary
PRINT_TO_CONSOLE = sys.stderr #print to this file within endpoints to print to console
home = expanduser("~")


@app.route('/test/', methods = ['POST'])
@cross_origin()
def helloName():
    print("received request", file=FILE)
    file = request.files['file']
   # print(name)
   # file = request.args.get('file')
   # file.read()
    transcript = run(file=file, flag=False)
    response = {'result':transcript}

# this is called once when the app starts up
# simply returns a default data folder in the correct formatting of the user's os
@app.route('/init/')
@cross_origin()
def init():
    print("received initial request", file=PRINT_TO_CONSOLE)
    response = {'folder'   : join(home,"Documents","data")} # returning (home)/Documents/Data with correct separators
    return response


# this is called when the transcribe button is pressed 
# TODO: modify to accept arguments, or adjust to only be called under some settings
@app.route('/transcribe/')
@cross_origin()
def transcribe():
    inputFolder = request.args.get('folder')
    inputFilename = request.args.get('filename')
    inputFilePath = join(inputFolder, inputFilename)
    print("received transcribe request for " + inputFilePath, file=PRINT_TO_CONSOLE)

    inFile = 0
    outFile = 0
    try :
        inFile = open(inputFilePath)
    except :
        return {'status' : "ERROR: " + inputFilePath + " does not exist", 'transcript': 'n/a'}
    # after opening input file, do something with it here:
    # TRANSCRIBE FILE AND SAVE AS NEW TEXT FILE

    # change this to reflect the actual output file path (could be   join( inputFolder, "outputs",  splitext(inputFilename) + "_output.txt" )   )
    outputFilePath = inputFilePath

    # now simply read output file and send back transcript
    try :
        outFile = open(outputFilePath)
    except :
        return {'status' : "ERROR: " + outputFilePath + " does not exist", 'transcript': 'n/a'}
    transcript = outFile.read()
    response = {'status'    : 0,
                'note'      : 'function still needs to actually transcribe',
                'transcript': transcript}

    return response
