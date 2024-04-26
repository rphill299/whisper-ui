import io
import librosa

from os import makedirs
from os.path import join, splitext, split

def loadAudio(file):
    buf = io.BytesIO(file.read())
    data, sr = librosa.load(buf)
    if sr != 16000:
        data = librosa.resample(data, orig_sr=sr, target_sr=16000)
    print(data[:100])
    return data

# saves transcripts[i] with filename outputFolder+filepaths[i]
# outputFolder: String - full path to output folder
# filepaths: [String] - array of filepaths (including extensions)
# transcripts: [String] - array of transcripts
def saveTextOutputs(outputFolder, filepaths, transcripts) :
    current_datetime = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    transcripts_id = str(current_datetime)
    for idx, fn in enumerate(filepaths):
        path, filename = split(fn)
        filepath = join(outputFolder, transcripts_id, path)
        makedirs(filepath, exist_ok=True)
        file = open(join(filepath, filename), 'w+') #open file in write mode
        file.write(transcripts[idx])
        file.close()
        
def prepFiles(request):
    filepaths = []
    _files = []

    #populate filepaths for cpu and gpu
    for fp, _file in request.files.items() :
        file_path = splitext(fp)[0]+'_output.txt'
        filepaths.append(file_path)
        _files.append(_file)
        
    return filepaths, _files
