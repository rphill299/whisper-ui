import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios'

function App() {
 
//   [ this_is_the_variable, this_is_the_setter ]

    const [file, setFile] = useState() //stores return value of file selector
    const [model, setModel] = useState('Whisper'); //stores model in use
    const [outputHeader, setOutputHeader] = useState(); // gives output details
    const [output, setOutput] = useState() //store the transcription output
    const [inputDataFolder, setInputDataFolder] = useState()

    const [inputMode, setInputMode] = useState('file') // determine file vs. folder select
    const [optionsVisible, setOptionsVisible] = useState(false) // toggle options

    /* Simple communication with backend here 
        obtaining default data folder from backend on app init*/
    let defaultDataFolder // in general, this variable will be empty due to re-rendering, use inputDataFolder instead
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
        setFile(event.target.files[0])
    }

    function handleChangeModel(event) {
        setModel(event.target.value)
    }

    function handleOptionsButtonClick() {
        setOptionsVisible(!optionsVisible)
    }

    function handleChangeInputMode(event) {
        setInputMode(event.target.value)
    }

    /* ==========================================

        Handling communication with backend here
       ==========================================
    */
    function handleTranscribeButtonClick() {
        if (!file) {
            alert("You must select a file to transcribe.")
            return
        }

        setOutputHeader('Transcribing ' + file.name + ' using ' + model + ':')
        setOutput("")

        if (model === "Wav2Vec2") {
            const formData = new FormData();

            formData.append("file", file);

            axios.post('/wav2vec2-transcribe/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }).then((response) => {
                const data = response.data
                const status = data.status
                if (status === 0) {
                    const nl = NewlineText(data.transcript)
                    setOutput(nl)
                } else {
                alert(status) 
                }

            }).catch((error) => {handleNetworkErrors(error)})
        } 
        else if (model === "Whisper") {
            if (inputMode === 'file') { // pass a file
                axios.get('/whisper-transcribe-file/', {params:{'folder':inputDataFolder, 'filename':file.name}})
                .then((response) => {handleBackendResponse(response)})
                .catch((error) => {handleNetworkErrors(error)})
                } 
            else if (inputMode === 'folder') { // pass a folder
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
            let txt
            if (data.transcript.text) {
                txt = data.transcript.text
            } else {
                txt = data.transcript
            }
            const nl = NewlineText(txt);
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
            <h1>Transcription Tool</h1>
            <Inputs 
                inputDataFolder={inputDataFolder}
                handleChangeInputDataFolder={handleChangeInputDataFolder}
                handleChangeFile={handleChangeFile} 
                handleChangeModel={handleChangeModel}
                handleTranscribeButtonClick={handleTranscribeButtonClick}
                modelInUse={model}
                optionsVisible={optionsVisible}
                handleOptionsButtonClick={handleOptionsButtonClick}
                inputMode={inputMode}
                handleChangeInputMode={handleChangeInputMode}
                >
            </Inputs>
            <Outputs output={output} outputHeader={outputHeader}> </Outputs>
        </div>
    );
}

function Inputs({inputDataFolder, handleChangeInputDataFolder, handleChangeFile, modelInUse, handleChangeModel, handleTranscribeButtonClick, 
    inputMode, handleChangeInputMode, optionsVisible, handleOptionsButtonClick}) {

    function ModelRadioButton({model}) {
        return (
            <>
                <input id={model} type='radio' name='model' value={model} checked={model === modelInUse}
                    onChange={handleChangeModel}/>
                <label for={model}>{model}</label>
            </>
        );
    }

    function InputModeRadioButton({mode, label}) {
        return (
            <>
                <input id={mode} type='radio' name='inputMode' value={mode} checked={mode === inputMode}
                    onChange={handleChangeInputMode}/>
                <label for={mode}>{label}</label>
            </>
        );
    }

    return (
        <fieldset>
            <div>
                <InputModeRadioButton mode="file" label={"I have a file"}></InputModeRadioButton>
                <InputModeRadioButton mode="folder" label={"I have a folder"}></InputModeRadioButton>
            </div>
            <div>
                <input type='file' directory={(inputMode==='folder')&&""} webkitdirectory={(inputMode==='folder')&&""} defaultValue={inputDataFolder} onChange={handleChangeFile}/>
            </div>
            <div>
                <button onClick={handleOptionsButtonClick}>Options</button> 
                {optionsVisible && (
                    <label style={{ color: 'red'}}>{"←click again to hide options"}</label>
                )}
                {optionsVisible && (
                    <div>
                        <div>
                            <label>Input Folder: </label>
                            <input type='text' defaultValue={inputDataFolder} onChange={handleChangeInputDataFolder} disabled={modelInUse === "Wav2Vec2"}/> 
                        </div>
                        <div>  
                            <label>Model: </label> 
                            <ModelRadioButton model='Whisper'></ModelRadioButton>
                            <ModelRadioButton model='Wav2Vec2'></ModelRadioButton>    
                        </div>
                    </div>
                )}
            </div>
            <div>
                <button type='submit' onClick={handleTranscribeButtonClick} size="lg">Transcribe</button>
            </div>
        </fieldset>
    );
}

function Outputs({output, outputHeader}) {

    return outputHeader && (
        <fieldset>
            <h3>
                {outputHeader}
            </h3>
            <div >{output}</div>
        </fieldset>
    );
}

export default App;
