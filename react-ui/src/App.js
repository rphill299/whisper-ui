import './App.css';
import React, { useState, useEffect } from 'react';
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import axios from 'axios'

function App() {
 
//   [ this_is_the_variable, this_is_the_setter ]

    const [file, setFile] = useState() //stores return value of file selector
    const [model, setModel] = useState('Whisper'); //stores model in use
    const [outputHeader, setOutputHeader] = useState(); // gives output details
    const [output, setOutput] = useState() //store the transcription output
    const [inputDataFolder, setInputDataFolder] = useState()
    const [tabIndex, setTabIndex] = useState(0);

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
        setFile(event.target.files)
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
                const filenames = Array.from(file).map(f => f.name);
                axios.get('/whisper-transcribe-files-batched/', {params:{'folder':inputDataFolder, 'filenames':JSON.stringify(filenames)}})
                .then((response, filenames) => {handleBackendResponse(response, filenames)})
                .catch((error) => {handleNetworkErrors(error)})
                } 
            else if (inputMode === 'folder') { // pass a folder
                axios.get('/whisper-transcribe-folder', {params:{'folder':inputDataFolder}})
                .then((response, filenames) => { handleBackendResponse(response, filenames)})
                .catch((error) => {handleNetworkErrors(error)})
            }
            
            
        }
    }

    function handleBackendResponse(response, filenames) {
        const data = response.data;
        const status = data.status;
        if (status === 0) {
            const transcripts = data.transcript
            setOutput(TabbedOutput(transcripts, filenames))
        } else {
            alert(status);
        }
    }

    function TabbedOutput(transcripts, filenames) {
        const tabsArray = []
        for (let i = 0; i < filenames.length; i++) {
            tabsArray.push(<Tab label={filenames[i]}/>)
        }
        return (
            <Paper square>
                <Tabs value={tabIndex} onChange={(event,newIndex) => setTabIndex(newIndex)}>
                    {tabsArray}
                </Tabs>
                <p>transcripts[tabIndex-1]</p>
            </Paper>
        )
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
        <div className='App'>
            <div>
                <h1>Transcription Tool</h1>
            </div>
            <div>
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
            </div>
            <div>
                <Outputs output={output} outputHeader={outputHeader} tabIndex={tabIndex} setTabIndex={setTabIndex}> </Outputs>
            </div>
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
                <input type='file' multiple directory={(inputMode==='folder')&&""} webkitdirectory={(inputMode==='folder')&&""} defaultValue={inputDataFolder} onChange={handleChangeFile}/>
            </div>
            <div>
                <button onClick={handleOptionsButtonClick}>{((optionsVisible && "Hide ") || "") + "Options"}</button>
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

function Outputs({output, outputHeader, tabIndex, setTabIndex}) {

    return outputHeader && (
        <fieldset>
            <h3>
                {outputHeader}
            </h3>
            <Paper>
                <Tabs textColor="black" indicatorColor="primary" value={tabIndex} onChange={(event,newIndex) => setTabIndex(newIndex)}>
                    <Tab label="test">Test</Tab>
                    <Tab label="another">Another</Tab>
                </Tabs>
                <p>Tab {tabIndex}</p>
            </Paper>
        </fieldset>
    );
}

export default App;
