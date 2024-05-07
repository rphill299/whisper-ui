from flask import Flask, request
from flask_cors import CORS, cross_origin
import sys
from utils import loadAudio, saveTextOutputs, prepFiles, read_file_audiosegment, prepend_spacer
from os import getcwd, chdir
from os.path import expanduser, join
import os
import whisper
import torchaudio
from transformers import WhisperForConditionalGeneration, AutoProcessor
import numpy as np
import torch
from pyannote.audio import Pipeline

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type' #this line may or may not be unnecessary

PRINT_TO_CONSOLE = sys.stderr #print to this file within endpoints to print to console
HOME_DIR = expanduser("~") #user's home directory
chdir(join("..", ".."))
CURR_DIR = getcwd() #project directory
PROJ_DIR = CURR_DIR
DEFAULT_OUTPUT_DIR = join("outputs","")

def millisec(timeStr):
  spl = timeStr.split(":")
  s = (int)((int(spl[0]) * 60 * 60 + int(spl[1]) * 60 + float(spl[2]) )* 1000)
  return s


model = whisper.load_model("base")
cudaAvailable = torch.cuda.is_available()

# this is called once when the app starts up
# simply returns a default data folder in the correct formatting of the user's os
@app.route('/init/')
@cross_origin()
def init():
    print("received initial request", file=PRINT_TO_CONSOLE)
    response = { 'outputFolder' : DEFAULT_OUTPUT_DIR , 'cudaAvailable' : cudaAvailable} 
    return response
    
@app.route('/batched-transcribe/', methods = ['POST'])
@cross_origin()
def batchedTranscribe():
    print("received batched whisper transcribe request", file=PRINT_TO_CONSOLE)
    
    # prepares the files for transcription
    filepaths, _files = prepFiles(request)
    transcripts = []
    languages = []
    if not cudaAvailable : #cpu
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

    return_dict = {'status'    : 0,
            'transcripts': transcripts,
            'languages'  : languages}

    if request.args.get('saveOutputs') == 'true' :
        outputFolder = request.args.get('outputFolder')
        timestamp = saveTextOutputs(request.args.get('outputFolder'), filepaths, transcripts)
        return_dict['timestamp'] = timestamp

    return return_dict

@app.route('/single-transcribe/', methods = ['POST'])
@cross_origin()
def singleTranscribe():
    # prepares the file for transcription
    filepaths, _files = prepFiles(request)
    filepath, file = filepaths[0], _files[0]
    print("received single whisper transcribe request for " + filepath, file=PRINT_TO_CONSOLE)

    #audio = loadAudio(file)
    diarize = request.args.get("diarize") == 'true'
    translate = request.args.get('translate') == 'true'
    if diarize and translate :
        # TODO: handle diarize and translate
        pass
    elif diarize :
        dir_path = os.path.dirname(os.path.abspath(__file__))

        # Create the full path to the file
        file_path = os.path.join(dir_path, 'config.yaml')

        # Check if the file exists
        if os.path.exists(file_path):
            print(file_path)
            print("File exists.")
        else:
            print("File does not exist.")
        pipeline = Pipeline.from_pretrained(file_path)
        audio = read_file_audiosegment(file)

        #Pyannote misses the first 0.5 secs of audio so we prepend a spacer:
        audio = prepend_spacer(audio)
        #print(audio.shape)
        test_file = {'waveform': torch.reshape(torch.tensor(audio.get_array_of_samples(), dtype=torch.float), (1,-1)), 'sample_rate': 16000}
        dzs = pipeline(test_file)
        print("these are the dzs", str(dzs))
        print("printed deez")
        groups = []
        g = []
        lastend = 0
        import re
        # for d in list(dzs):
        #     print(d)

        for d in str(dzs).splitlines():
            d = str(d)
            print(d)
            if g and (g[0].split()[-1] != d.split()[-1]):      #same speaker
                groups.append(g)
                g = []

            g.append(d)
            end = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=d)
            print(end)
            end = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=d)[1]
            end = millisec(end)
            if (lastend > end):       #segment engulfed by a previous segment
                groups.append(g)
                g = []
            else:
                lastend = end
        if g:
            groups.append(g)
        print("printing groups:")
        print(*groups, sep='\n')

        gidx = -1
        raw_audio = []
        speaker_list = []
        print(g)
        for g in groups:
            start = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=g[0])[0]
            end = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=g[-1])[1]
            speaker_list.append(g[0].split()[-1])
            start = millisec(start) #- spacermilli
            end = millisec(end)  #- spacermilli
            print(start, end)
            gidx += 1
            
            audio = audio.set_frame_rate(16000)
            # channel_sounds = audio.split_to_mono()
            samples = audio[start:end].get_array_of_samples()

            fp_arr = np.array(samples).T.astype(np.float32)
            fp_arr /= np.iinfo(samples.typecode).max
            print(fp_arr.shape)
            raw_audio.append(fp_arr)
            #print(raw_audio)
        print("raw audio has ", len(raw_audio), "entries")
        if cudaAvailable:
            processor = AutoProcessor.from_pretrained("openai/whisper-medium.en")
            inputs = processor(raw_audio, return_tensors="pt", truncation=False, padding="longest", return_attention_mask=True, sampling_rate=16_000)
            #print(inputs.shape)
            
            print("right before generation")
            # Check and pad the mel spectrogram length to 3000 if necessary
            mel_length = inputs.input_features.shape[2]  # Use shape[2] for the time dimension
            if mel_length < 3000:
                padding_length = 3000 - mel_length
                padded_mel_features = torch.nn.functional.pad(inputs.input_features, (0, padding_length), mode='constant', value=0)
                padded_attention_mask = torch.nn.functional.pad(inputs.attention_mask, (0, padding_length), mode='constant', value=0)
                inputs['input_features'] = padded_mel_features  # Ensuring correct key assignment
                inputs['attention_mask'] = padded_attention_mask  # Update the attention mask accordingly

            # Debug print to verify shapes after padding
            print("After padding - Features:", inputs.input_features.shape)
            print("After padding - Mask:", inputs.attention_mask.shape)
            #inputs = inputs.to("cuda", torch.float16)
            inputs = inputs.to(torch.float16)
            model_medium = WhisperForConditionalGeneration.from_pretrained("openai/whisper-medium.en", torch_dtype=torch.float16)
            #model_medium.to("cuda")

            # activate `temperature_fallback` and repetition detection filters and condition on prev text
            result = model_medium.generate(**inputs, condition_on_prev_tokens=False, temperature=0, logprob_threshold=-1.0, compression_ratio_threshold=1.35, return_timestamps=True)
            #result = model_medium.generate(**inputs, condition_on_prev_tokens=False, temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0), logprob_threshold=-1.0, compression_ratio_threshold=1.35, return_timestamps=True)

            transcripts = processor.batch_decode(result, skip_special_tokens=True)
            print(transcripts)
            ret = [speaker + ": " + transcript for speaker, transcript in zip(speaker_list, transcripts)]
            return_dict = { 'status' : 0,
                            'transcript' : '\n'.join(ret),
                            'language' : 'En'
            }
        else:
            transcripts = []
            for audio in raw_audio:
                transcripts.append(model.transcribe(audio)["text"])
            ret = [speaker + ": " + transcript for speaker, transcript in zip(speaker_list, transcripts)]
            return_dict = {
            'status'        : 0,
            'transcript'    : '\n'.join(ret),
            'language'      : "En"
            }
                       
    else :
        # Simple transcribe or translate
        audio = loadAudio(file)
        if translate :
            ret = model.transcribe(audio, task="translate")
        else :
            ret = model.transcribe(audio)
        return_dict = {'status'        : 0,
            'transcript'    : ret['text'],
            'language'      : ret['language']}

    if request.args.get('saveOutputs') == 'true' :
        outputFolder = request.args.get('outputFolder')
        TS = request.args.get('timestamp')
        timestamp = saveTextOutputs(outputFolder, [filepath], [ret['text']], timestamp=TS)
        return_dict['timestamp'] = timestamp
    
    return return_dict
