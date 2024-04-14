from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import sys
from wav2vec2_test2 import run
from utils import read_file
from os.path import expanduser, join, splitext
from os import getcwd, chdir
import whisper
import torchaudio
from transformers import WhisperForConditionalGeneration, AutoProcessor
from datasets import load_dataset, Audio
import numpy as np
import torch
import json

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

# transcribe a multiple files with Batched Whisper
@app.route('/whisper-transcribe-files-batched/', methods = ['GET'])
@cross_origin()
def whisper_transcribe_file_batched():
    
    files_json = request.args.get("filenames")

    if files_json:
        files = json.loads(files_json) # Parse JSON string back into Python list
    else:
        files = []
    print(files)

    # if no GPU, return dummy data
    if not torch.cuda.is_available() : 
        transcripts = []
        for f in files :
            transcripts.append("(transcription of " + f + " from the backend)")
        print("RYAN HERE")
        print(transcripts)
        return {'status': 0, 'transcript':transcripts}

    inputFolder = request.args.get("folder")
    inputFilePaths = [join(inputFolder, inputFilename) for inputFilename in files]
    print("received batched whisper transcribe request", file=PRINT_TO_CONSOLE)
    print(inputFilePaths)
    ds = load_dataset(inputFolder, data_files=files)["train"]
    print(ds)
    ds = ds.cast_column("audio", Audio(sampling_rate=16000))

    print(ds)
    raw_audio = [x["array"].astype(np.float32) for x in ds["audio"]]

    # process input, make sure to pass `padding='longest'` and `return_attention_mask=True`
    processor = AutoProcessor.from_pretrained("openai/whisper-medium.en")
    inputs = processor(raw_audio, return_tensors="pt", truncation=False, padding="longest", return_attention_mask=True, sampling_rate=16_000)
    inputs = inputs.to("cuda", torch.float16)
    model_medium = WhisperForConditionalGeneration.from_pretrained("openai/whisper-medium.en", torch_dtype=torch.float16)
    model_medium.to("cuda")

    # activate `temperature_fallback` and repetition detection filters and condition on prev text
    result = model_medium.generate(**inputs, condition_on_prev_tokens=False, temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0), logprob_threshold=-1.0, compression_ratio_threshold=1.35, return_timestamps=True)

    transcript = processor.batch_decode(result, skip_special_tokens=True)
    print(transcript)
    response = {'status'    : 0,
                'transcript': transcript}
    return response
    
@app.route('/transcribe/', methods = ['POST'])
@cross_origin()
def transcribe():
    
    raw_audio = [read_file(_file) for _file in request.files.values()]
    # process input, make sure to pass `padding='longest'` and `return_attention_mask=True`
    processor = AutoProcessor.from_pretrained("openai/whisper-medium.en")
    inputs = processor(raw_audio, return_tensors="pt", truncation=False, padding="longest", return_attention_mask=True, sampling_rate=16_000)
    inputs = inputs.to("cuda", torch.float16)
    model_medium = WhisperForConditionalGeneration.from_pretrained("openai/whisper-medium.en", torch_dtype=torch.float16)
    model_medium.to("cuda")

    # activate `temperature_fallback` and repetition detection filters and condition on prev text
    result = model_medium.generate(**inputs, condition_on_prev_tokens=False, temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0), logprob_threshold=-1.0, compression_ratio_threshold=1.35, return_timestamps=True)

    transcript = processor.batch_decode(result, skip_special_tokens=True)
    print(transcript)
    response = {'status'    : 0,
                'transcript': 'success'}
    return response

@app.route('/wav2vec2-transcribe/', methods = ['POST'])
@cross_origin()
def wav2vec2_transcribe():
    for _file in request.files.values():
        print("received wav2vec2 transcribe request for " + _file.filename, file=PRINT_TO_CONSOLE)
        audio = read_file(_file)
        transcript = model.transcribe(audio)
        print(transcript['text'], file=PRINT_TO_CONSOLE)
    response = {'status'    : 0,
                'transcript':'4'}
    return response
