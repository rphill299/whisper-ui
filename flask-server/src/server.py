from flask import Flask, request
from flask_cors import CORS, cross_origin
import sys
from wav2vec2_test2 import run

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type' #this line may or may not be unnecessary
FILE = sys.stderr #print to this file within endpoints to print to console

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
    return response
