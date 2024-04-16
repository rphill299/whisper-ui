import io
import librosa
import whisper
import sys

def read_file(file):
    buf = io.BytesIO(file.read())
    data, sr = librosa.load(buf)
    if sr != 16000:
        data = librosa.resample(data, orig_sr=sr, target_sr=16000)
    print(data[:100])
    return data
