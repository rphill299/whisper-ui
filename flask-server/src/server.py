from flask import Flask, request
from flask_cors import CORS, cross_origin
import sys

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type' #this line may or may not be unnecessary
FILE = sys.stderr #print to this file within endpoints to print to console

@app.route('/test/')
@cross_origin()
def helloName():
    print("received request", file=FILE)
    name = request.args.get('name')
    name = name.upper()
    response = {'result':'Hello, ' + name + '!'}
    return response
