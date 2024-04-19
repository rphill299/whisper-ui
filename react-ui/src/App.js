import './App.css';
import React, { useState, useEffect } from 'react';
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import axios from 'axios'

function App() {
 
//   [ this_is_the_variable, this_is_the_setter ]

    const [file, setFile] = useState() //stores return value of file selector
    const [files, setFiles] = useState([])
    const [model, setModel] = useState('Whisper'); //stores model in use
    const [outputHeader, setOutputHeader] = useState(); // gives output details
    const [output, setOutput] = useState() //store the transcription output
    const [inputDataFolder, setInputDataFolder] = useState()
    const [tabIndex, setTabIndex] = useState(0);
    const [transcripts, setTranscripts] = useState([])
    const [filenames, setFilenames] = useState([])

    const [inputMode, setInputMode] = useState('file') // determine file vs. folder select
    const [optionsVisible, setOptionsVisible] = useState(false) // toggle options

    /* Simple communication with backend here 
        obtaining default data folder from backend on app  init*/
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
    
    function handleAddFiles(event) {
        var newFiles = [...files]
        for (let i=0; i<event.target.files.length; i++){
            newFiles = [...newFiles, event.target.files[i]]
            console.log(event.target.files[i].name)
        }
        setFiles(newFiles)
        setFile('9')
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

    function handleChangeTab(index) {
        setTabIndex(index)
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

        setOutputHeader('Transcribing ' + files.length + ' file' + (files.length===1 ? '' : 's') + ' using ' + model + ':')
        setOutput("")
        console.log(files.length)

        if (model === "Wav2Vec2") {
            const formData = new FormData();
            for (let i=0; i<files.length; i++) {
                formData.append(files[i].name, files[i]);
            }

            axios.post('/transcribe/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }).then((response) => { handleBackendResponse(response)})
            .catch((error) => {handleNetworkErrors(error)})
        }
        else if (model === "Whisper") {
            if (inputMode === 'file') { // pass a file
                const fns = Array.from(files).map(f => f.name);
                const filenames = fns.filter((fn) => fn.endsWith(".wav") || fn.endsWith(".mp3") || fn.endsWith(".m4a"))
                setFilenames(filenames)
                // axios.get('/whisper-transcribe-files-batched/', {params:{'folder':inputDataFolder, 'filenames':JSON.stringify(filenames)}})
                // .then((response) => {handleBackendResponse(response)})
                // .catch((error) => {handleNetworkErrors(error)})
                const formData = new FormData();
                for (let i=0; i<files.length; i++) {
                    const fileName = files[i].name;
                    if (fileName.endsWith(".mp3") || fileName.endsWith(".wav") || fileName.endsWith(".m4a")) {
                        formData.append(fileName, files[i]);
                    }
                    else {
                        console.log("Error")
                    }

                }

                axios.post('/transcribe/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }).then((response) => { handleBackendResponse(response)})
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
        console.log(data)
        const status = data.status;
        if (status === 0) {
            setTranscripts(data.transcript)
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
        <div className='App'>
            <div>
                <h1>Transcription Tool</h1>
            </div>
            <div>
                <Inputs 
                    inputDataFolder={inputDataFolder}
                    handleChangeInputDataFolder={handleChangeInputDataFolder}
                    handleChangeFile={handleChangeFile} 
                    handleAddFiles={handleAddFiles}
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
                <Outputs 
                    outputHeader={outputHeader} 
                    tabIndex={tabIndex} 
                    handleChangeTab={handleChangeTab}
                    transcripts={transcripts}
                    filenames={filenames}> 
                </Outputs>
            </div>
        </div>
    );
}

function Inputs({inputDataFolder, handleChangeInputDataFolder, handleChangeFile, handleAddFiles, modelInUse, handleChangeModel, handleTranscribeButtonClick,
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
                <input type='file' multiple directory={(inputMode==='folder')&&""} webkitdirectory={(inputMode==='folder')&&""} defaultValue={inputDataFolder} onChange={handleAddFiles}/>
            </div>
            <div>
                <button onClick={handleOptionsButtonClick}>{(optionsVisible ? "Hide " : "") + "Options"}</button>
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

function Outputs({outputHeader, tabIndex, handleChangeTab, transcripts, filenames}) {
    const tabsArray = []
    for (let i = 0; i < filenames.length; i++) {
        tabsArray.push(<Tab value={i} label={filenames[i]}/>)
    }
    console.log(tabsArray)
    return outputHeader && (
        <div>
            <h3>
                {outputHeader}
            </h3>
            <Paper square>
                <Tabs value={tabIndex} onChange={(event, newIndex) => {handleChangeTab(newIndex)}}>
                    {tabsArray}
                </Tabs>
                <p>{transcripts[tabIndex]}</p>
            </Paper> 
        </div>
    );
}

export default App;



{/* <Paper square>
<Tabs value={tabIndex} onChange={(event, newIndex) => {handleChangeTab(newIndex)}}>
    {tabsArray}
</Tabs>
<p>{transcripts[tabIndex]}</p>
</Paper> */}
