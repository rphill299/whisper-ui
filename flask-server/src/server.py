from flask import Flask, request
from flask_cors import CORS, cross_origin
import sys
from utils import loadAudio, saveTextOutputs, prepFiles
from os import getcwd, chdir
from os.path import expanduser, join
import whisper
import torchaudio
from transformers import WhisperForConditionalGeneration, AutoProcessor
import numpy as np
import torch

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type' #this line may or may not be unnecessary

PRINT_TO_CONSOLE = sys.stderr #print to this file within endpoints to print to console
HOME_DIR = expanduser("~") #user's home directory
chdir(join("..", ".."))
CURR_DIR = getcwd() #project directory
PROJ_DIR = CURR_DIR
DEFAULT_OUTPUT_DIR = join("outputs","")

model = whisper.load_model("base")

# this is called once when the app starts up
# simply returns a default data folder in the correct formatting of the user's os
@app.route('/init/')
@cross_origin()
def init():
    print("received initial request", file=PRINT_TO_CONSOLE)
    response = { 'outputFolder' : DEFAULT_OUTPUT_DIR } 
    return response
    
@app.route('/transcribe/', methods = ['POST'])
@cross_origin()
def transcribe():
    print("received batched whisper transcribe request", file=PRINT_TO_CONSOLE)
    
    # prepares the files for transcription
    filepaths, _files = prepFiles(request)
    transcripts = []
    languages = []

    if not torch.cuda.is_available() : #cpu
        for _file in _files :
            audio = loadAudio(_file)
            ret = model.transcribe(audio)
            transcripts.append(ret['text'])
            languages.append(ret['language'])

    else: #gpu
        raw_audio = [loadAudio(_file) for _file in _files]
        # process input, make sure to pass `padding='longest'` and `return_attention_mask=True`
        processor = AutoProcessor.from_pretrained("openai/whisper-medium.en")
        inputs = processor(raw_audio, return_tensors="pt", truncation=False, padding="longest", return_attention_mask=True, sampling_rate=16_000)
        inputs = inputs.to("cuda", torch.float16)
        model_medium = WhisperForConditionalGeneration.from_pretrained("openai/whisper-medium.en", torch_dtype=torch.float16)
        model_medium.to("cuda")

        # activate `temperature_fallback` and repetition detection filters and condition on prev text
        result = model_medium.generate(**inputs, condition_on_prev_tokens=False, temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0), logprob_threshold=-1.0, compression_ratio_threshold=1.35, return_timestamps=True)

        transcripts = processor.batch_decode(result, skip_special_tokens=True)

    response = {'status'    : 0,
                'transcript': transcripts,
                'languages'  : languages}

    if request.args.get('saveOutputs') == 'true' :
        saveTextOutputs(request.args.get('outputFolder'), filepaths, transcripts)
        
    return response
