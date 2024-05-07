import io
import librosa
import sys
from pydub import AudioSegment

from os import makedirs
from os.path import join, splitext, split

from datetime import datetime

PRINT_TO_CONSOLE = sys.stderr #print to this file within endpoints to print to console

def loadAudio(file):
    buf = io.BytesIO(file.read())
    data, sr = librosa.load(buf)
    if sr != 16000:
        data = librosa.resample(data, orig_sr=sr, target_sr=16000)
    print(data[:100])
    return data

def read_file_audiosegment(file):
    return AudioSegment.from_wav(io.BytesIO(file.read()))

def prepend_spacer(audio):
    spacermilli = 2000
    spacer = AudioSegment.silent(duration=spacermilli)
    return spacer.append(audio, crossfade=0)

# saves transcripts[i] with filename outputFolder+filepaths[i]
# outputFolder: String - full path to output folder
# filepaths: [String] - array of filepaths (including extensions)
# transcripts: [String] - array of transcripts
def saveTextOutputs(outputFolder, filepaths, transcripts, *, timestamp='') :
    if not timestamp:
        current_datetime = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        transcripts_id = str(current_datetime)
    else:
        transcripts_id = timestamp
    for idx, fn in enumerate(filepaths):
        path, filename = split(fn)
        filepath = join(outputFolder, transcripts_id, path)
        makedirs(filepath, exist_ok=True)
        file = open(join(filepath, filename), 'w+') #open file in write mode
        file.write(transcripts[idx])
        file.close()
    return transcripts_id
        
def prepFiles(request):
    filepaths = []
    _files = []

    #populate filepaths for cpu and gpu
    for fp, _file in request.files.items() :
        file_path = splitext(fp)[0]+'_output.txt'
        filepaths.append(file_path)
        _files.append(_file)
        
    return filepaths, _files



def configYaml(current_directory) :
    embedding_path = join(current_directory, 'flask-server','src','embedding_model.bin')
    segmentation_path = join(current_directory, 'flask-server', 'src', 'pytorch_model.bin')

    text  = "version: 3.1.0\n\n"
    text += "pipeline:\n"
    text += "  name: pyannote.audio.pipelines.SpeakerDiarization\n"
    text += "  params:\n"
    text += "    clustering: AgglomerativeClustering\n"
    text += '    embedding: "' + embedding_path + '"\n'
    text += "    embedding_batch_size: 32\n"
    text += "    embedding_exclude_overlap: true\n"
    text += '    segmentation: "' + segmentation_path + '"\n'
    text += "    segmentation_batch_size: 32\n\n"

    text += "params:\n"
    text += "  clustering:\n"
    text += "    method: centroid\n"
    text += "    min_cluster_size: 12\n"
    text += "    threshold: 0.7045654963945799\n"
    text += "  segmentation:\n"
    text += "    min_duration_off: 0.0"

    file = open(join(current_directory, 'flask-server','src','config.yaml'), "w")
    file.write(text)
    file.close()
