from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import sys
from wav2vec2_test2 import run
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
CURR_DIR = getcwd() #project directory
PROJ_DIR = CURR_DIR

model = whisper.load_model("base")

# this is called once when the app starts up
# simply returns a default data folder in the correct formatting of the user's os
@app.route('/init/')
@cross_origin()
def init():
    print("received initial request", file=PRINT_TO_CONSOLE)
    outputDir = join(CURR_DIR, "outputs")
    response = {'inputFolder'   : CURR_DIR, 
                'outputFolder'  : outputDir} 
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
    print("received batched whisper transcribe request", file=PRINT_TO_CONSOLE)
    files_json = request.args.get("filenames")

    if files_json:
        files = json.loads(files_json) # Parse JSON string back into Python list
    else:
        files = []
    inputFolder = request.args.get("folder")
    inputFilePaths = [join(inputFolder, inputFilename) for inputFilename in files]

    # if no GPU, sequential transcribe
    if not torch.cuda.is_available() : 
        transcripts = []
        for ifp in inputFilePaths :
            transcripts.append(model.transcribe(ifp)['text'])
        return {'status': 0, 'transcript':transcripts}

    
    ds = load_dataset(inputFolder, data_files=files)["train"]
    ds = ds.cast_column("audio", Audio(sampling_rate=16000))
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
