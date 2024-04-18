import './App.css';
import React, { useState } from 'react';
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import axios from 'axios'

// this is the default return value of App.js
export default App;

// this defines App
function App() {
    // go to the return statement at the bottom of this function to see what an "App" is 
    // [ this_is_the_variable, this_is_the_setter ]

    const [file, setFile] = useState() //stores return value of file selector
    const [outputHeader, setOutputHeader] = useState(); // gives output details
    const [inputDataFolder, setInputDataFolder] = useState()
    const [outputFolder, setOutputFolder] = useState()
    const [tabIndex, setTabIndex] = useState(0);
    const [transcripts, setTranscripts] = useState([])

    const [filenames, setFilenames] = useState([])
    const [model, setModel] = useState('Whisper'); //stores model in use
    const [inputMode, setInputMode] = useState('file') // determine file vs. folder select
    const [optionsVisible, setOptionsVisible] = useState(false) // toggle options
    const [saveOutputs, setSaveOutputs] = useState(false) // toggle whether outputs are auto-saved or not

    /* Simple communication with backend here 
        obtaining default data folder from backend on app  init*/
    if (!inputDataFolder) {
        axios.get('/init/').then((response) => {
            const data = response.data
            const defaultDataFolder = data.inputFolder
            setInputDataFolder(defaultDataFolder)
            const defaultOutputFolder = data.outputFolder
            setOutputFolder(defaultOutputFolder)
        }).catch((error) => {handleNetworkErrors(error)})
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

        setOutputHeader('Transcribing ' + file.length + ' file' + (file.length===1 ? '' : 's') + ' using ' + model + ':')
        setTranscripts("")
        setFilenames("")

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
                    // setOutput(nl) // no longer exists
                } else {
                alert(status) 
                }

            }).catch((error) => {handleNetworkErrors(error)})
        } 
        else if (model === "Whisper") {
            if (inputMode === 'file') { // pass a file
                const filenames = Array.from(file).map(f => f.name);
                setFilenames(filenames)
                axios.get('/whisper-transcribe-files-batched/', {params:{'folder':inputDataFolder, 'filenames':JSON.stringify(filenames)}})
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

    function handleChangeInputDataFolder(event) {
        setInputDataFolder(event.target.value)
    }

    function handleChangeOutputFolder(event) {
        setOutputFolder(event.target.value)
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

    function handleChangeTab(index) {
        setTabIndex(index)
    }

    function handleChangeSaveOutputs() {
        setSaveOutputs(!saveOutputs)
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
                    saveOutputs={saveOutputs}
                    handleChangeSaveOutputs={handleChangeSaveOutputs}
                    outputFolder={outputFolder}
                    handleChangeOutputFolder={handleChangeOutputFolder}
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

function Inputs({inputDataFolder, handleChangeInputDataFolder, handleChangeFile, modelInUse, handleChangeModel, handleTranscribeButtonClick, 
    inputMode, handleChangeInputMode, optionsVisible, handleOptionsButtonClick, saveOutputs, handleChangeSaveOutputs, outputFolder, handleChangeOutputFolder}) {

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
                <button onClick={handleOptionsButtonClick}>{(optionsVisible ? "Hide " : "") + "Options"}</button>
                {optionsVisible && (
                    <div>
                        <div>
                            <label>Input Folder: </label>
                            <input type='text' defaultValue={inputDataFolder} onChange={handleChangeInputDataFolder} disabled={modelInUse === "Wav2Vec2"}/> 
                        </div>
                        <div>
                            <label>
                                <input type='checkbox' checked={saveOutputs} onChange={handleChangeSaveOutputs}/>
                                Save all output
                            </label>
                            {saveOutputs && 
                            (<div>
                                <label>Output Folder: </label>
                                <input type='text' defaultValue={outputFolder} onChange={handleChangeOutputFolder}/>
                            </div>)}
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