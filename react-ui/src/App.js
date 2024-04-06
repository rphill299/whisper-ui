import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios'

function App() {
    const [file, setFile] = useState()
    const [language, setLanguage] = useState('Whisper');
    const [outputHeader, setOutputHeader] = useState('Choose a file above and click "Transcribe" to transcribe the audio/video file into the desired language');
    const [output, setOutput] = useState()
    const [inputDataFolder, setInputDataFolder] = useState()
    const [selectFile, setSelectFile] = useState(true)

    /* Simple communication with backend here 
        obtaining default data folder from backend */
    let defaultDataFolder // in general, this variable will be empty due to re-rendering
    if (!inputDataFolder) {
        axios.get('/init/').then((response) => {
            const data = response.data
            defaultDataFolder = data.folder
            setInputDataFolder(defaultDataFolder)
        }).catch((error) => {handleNetworkErrors(error)})
    }

    function handleChangeInputDataFolder(event) {
        setInputDataFolder(event.target.value)
    }

    function handleChangeFile(event) {
        const file = event.target.files[0]
        setFile(file)
    }

    function handleChangeSourceLanguage(event) {
        const lang = event.target.value
        setLanguage(lang)
    }

    function handleSelectFile(event) {
        setSelectFile(!selectFile)
    }

    /* ==========================================

        Handling communication with backend here
       ==========================================
    */
    function handleTranscribeButtonClick() {
        if ((selectFile || language==="Wav2Vec2") && !file) {
            alert("You must select a file to transcribe.")
            return
        }


        if (language === "Wav2Vec2") {
            const formData = new FormData();

            formData.append("file", file);

            axios.post('/wav2vec2-transcribe/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }).then((response) => {
                const data = response.data
                const status = data.status
                if (status === 0) {
                    const nl = NewlineText(data.transcript)
                    setOutputHeader('Transcribing ' + file.name + ' using ' + language + ':')
                    setOutput(nl)
                } else {
                alert(status) 
                }

            }).catch((error) => {handleNetworkErrors(error)})
        } 
        else if (language === "Whisper") {
            if (selectFile) { // pass a file
                setOutputHeader('Transcribing ' + file.name + ' using ' + language + ':')
                axios.get('/whisper-transcribe-file/', {params:{'folder':inputDataFolder, 'filename':file.name}})
                .then((response) => {const data = response.data;
                    const status = data.status;
                    if (status === 0) {
                        const nl = NewlineText(data.transcript.text);
                        setOutput(nl);
                    } else {
                        alert(status);
                    }})
                .catch((error) => {handleNetworkErrors(error)})
                } 
            else { // pass a folder
                setOutputHeader('Transcribing ' + inputDataFolder + ' using ' + language + ':')
                axios.get('/whisper-transcribe-folder', {params:{'folder':inputDataFolder}})
                .then((response) => { handleBackendResponse(response)})
                .catch((error) => {handleNetworkErrors(error)})
            }
            
            
        }
    }

    function handleBackendResponse(response) {
        const data = response.data;
        const status = data.status;
        if (status === 0) {
            const nl = NewlineText(data.transcript.text);
            setOutput(nl);
        } else {
            alert(status);
        }
    }

    function NewlineText(text) {
        const newText = text.split('\n').map(str => <p>{str}</p>)

        return newText
    }

    function handleNetworkErrors(error) {
        if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
        } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
        }
        console.log(error.config);
    }

    return (
        <div>
            <h1>Transcription & Translation Tool</h1>
            <Inputs 
                inputDataFolder={inputDataFolder}
                handleChangeInputDataFolder={handleChangeInputDataFolder}
                handleChangeFile={handleChangeFile} 
                handleChangeSourceLanguage={handleChangeSourceLanguage}
                handleTranscribeButtonClick={handleTranscribeButtonClick}
                language={language}
                selectFile={selectFile}
                handleSelectFile={handleSelectFile}
                >
            </Inputs>
            <Outputs output={output} outputHeader={outputHeader}> </Outputs>
        </div>
    );
}

function Inputs({inputDataFolder, handleChangeInputDataFolder, handleChangeFile, handleChangeSourceLanguage, handleTranscribeButtonClick, language, selectFile, handleSelectFile}) {

    function LanguageRadioButton({lang}) {
        return (
            <>
                <input id={lang} type='radio' name='language' value={lang} checked={lang === language}
                    onChange={handleChangeSourceLanguage}/>
                <label for={lang}>{lang}</label>
            </>
        );
    }

    return (
        <fieldset>
            <h2>Inputs:</h2>
            <div>
                <h3>Input Folder: </h3>
                <input type='text' defaultValue={inputDataFolder} onChange={handleChangeInputDataFolder} disabled={language === "Wav2Vec2"}/>
            </div>
            <div>
                <h3>
                    <input type='checkbox' checked={selectFile || language === "Wav2Vec2"} onChange={handleSelectFile} disabled={language === "Wav2Vec2"}/> Select single file (uncheck to pass folder) </h3>
                <div>
                    <input type='file' disabled={!selectFile && language !== "Wav2Vec2"} defaultValue={inputDataFolder} onChange={handleChangeFile}/>
                </div>
            </div>
            <div>
                <h3>Language: </h3> 
                <LanguageRadioButton lang='Whisper'></LanguageRadioButton>
                <LanguageRadioButton lang='Wav2Vec2'></LanguageRadioButton>
            </div>
            <div>
                <button type='submit' onClick={handleTranscribeButtonClick}>Transcribe</button>
            </div>
        </fieldset>
    );
}

function Outputs({output, outputHeader}) {

    return (
        <fieldset>
            <h2>Output:</h2>
            <h3>
                {outputHeader}
            </h3>
            <div >{output}</div>
        </fieldset>
    );
}

export default App;
