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
    const [files, setFiles] = useState([]) //stores return value of file selector
    const [outputHeader, setOutputHeader] = useState(); // gives output details
    const [outputFolder, setOutputFolder] = useState("Refresh once backend starts up")
    const [tabIndex, setTabIndex] = useState(0)
    const [transcripts, setTranscripts] = useState([])
    const [filenames, setFilenames] = useState([])
    const [model, setModel] = useState('Whisper'); //stores model in use
    const [inputMode, setInputMode] = useState('file') // determine 'file' vs. 'folder' select
    const [optionsVisible, setOptionsVisible] = useState(false) // toggle options
    const [saveOutputs, setSaveOutputs] = useState(false) // toggle whether outputs are auto-saved or not
    const [showLoadingSpinner, setShowLoadingSpinner] = useState(false)
    const [processingMode, setProcessingMode] = useState("Batched") // Either 'Batched' or 'Sequential'
    const [prevProcessing, setprevProcessing] = useState("") // tracks previous processing mode for consistency
    const [useDiarization, setUseDiarization] = useState(false)
    const [useTranslation, setUseTranslation] = useState(false)
    const [languages, setLanguages] = useState([])
    const [enableTranscribe, setEnableTranscribe] = useState(true)
    /* Simple communication with backend here 
        obtaining default data folder from backend on app  init*/
    if (outputFolder === "Refresh once backend starts up") {
        axios.get('/init/').then((response) => {
            // get data
            const data = response.data 
            // get a value from data ( stored as { 'outputFolder' : value } )
            const defaultOutputFolder = data.outputFolder
            // do what we want with fetched value
            setOutputFolder(defaultOutputFolder)
        }).catch((error) => {handleNetworkErrors(error)}) // catch and report any network errors
    }
  
    /* ==========================================
        Handling communication with backend here
       ==========================================
    */
    function handleTranscribeButtonClick() {
        // don't accept transcribe calls without inputs
        if (!files || files.length === 0) { 
            alert("You must select a file to transcribe.")
            return
        }
        // prep UI for processing request
        setOutputHeader("")
        setFilenames([])
        setTranscripts([])
        setTabIndex(0)
        setShowLoadingSpinner(true)
        setLanguages([])
        setEnableTranscribe(false)

        // get filenames from user selection
        const allFilenames = Array.from(files).map((f) => f.name);
        // filter out audio filenames
        const audioFilenames = allFilenames.filter((fn) => isAudioFilename(fn))
        const audioFiles = Array.from(files).filter((f) => isAudioFilename(f.name))
        // set filenames and output header
        setFilenames(audioFilenames)
        setFiles(audioFiles)
        setOutputHeader('Transcribing ' + audioFilenames.length + ' file' + (audioFilenames.length===1 ? '' : 's') + ' using ' + model + ':')

        if (model === 'Whisper') {
            if (processingMode === 'Batched') {
                backendTranscribeCall(audioFiles, audioFilenames)
            } 
            else if (processingMode === 'Sequential') {

            }
        }
    }

    function backendTranscribeCall(audioFiles, audioFilenames) {
        // create form data storing raw files to pass to backend
        const formData = createFormData(audioFiles, audioFilenames)
        // send form data, along with params and proper headers, to backend, and handle response
        axios.post('/transcribe/', 
            formData, 
            { headers: { 'Content-Type': 'multipart/form-data' },
                params: {'saveOutputs': saveOutputs, "outputFolder": outputFolder}
            })
        .then((response) => { handleBackendResponse(response)})
        .catch((error) => {handleNetworkErrors(error)})
        .finally(() => {setShowLoadingSpinner(false); setEnableTranscribe(true)})
    }

    // creates a new formdata object with raw (audio only) files
    function createFormData(audioFiles, audioFilenames) {
        const formData = new FormData()
        for (let i=0; i<audioFiles.length; i++) {
            const fileRelPath = files[i].webkitRelativePath
            if (fileRelPath === '') { // means user passed files only
                formData.append(audioFilenames[i], files[i]);
            } else { // means user passed a folder 
                formData.append(fileRelPath, files[i])
            }
        }
        return formData
    }
    function handleBackendResponse(response) {
        const data = response.data;
        console.log("Backend Response:", data)
        const status = data.status;
        if (status === 0) {
            setTranscripts(data.transcript)
            setLanguages(data.languages)
        } else {
            alert(status);
        }
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
    function isAudioFilename(filename) {
        // return true if the file format is compatible for librosa.load() and whisper.transcribe()/whisper.translate()
        // LIBROSA INCOMPATIBLE TYPES: .m4a, 
        filename = filename.toLowerCase()
        return  (filename.endsWith(".wav") ||
            filename.endsWith(".mp3") 
            )
    }
    function handleChangeOutputFolder(event) {
        setOutputFolder(event.target.value)
    }
    function handleChangeFiles(event) {
        setFiles(event.target.files)
    }
    
    function handleAddFiles(event) {
        var newFiles = [...files]
        for (let i=0; i<event.target.files.length; i++){
            newFiles = [...newFiles, event.target.files[i]]
            //console.log(event.target.files[i].name)
        }
        setFiles(newFiles)
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
    function handleChangeProcessingMode(event) {
        setProcessingMode(event.target.value)
    }
    function handleChangeUseDiarization(event) {
        setUseDiarization(event.target.checked)
        handleTranslationDiarizationBatchedSequentialLogic(event.target.checked, useTranslation)
    }
    function handleChangeUseTranslation(event) {
        setUseTranslation(event.target.checked)
        handleTranslationDiarizationBatchedSequentialLogic(event.target.checked, useDiarization)
    }
    function handleTranslationDiarizationBatchedSequentialLogic(checked, useOther) {
        if (checked || useOther) {
            if (prevProcessing === "") {
                setprevProcessing(processingMode)
                setProcessingMode('Sequential')
            }
        } else {
            setProcessingMode(prevProcessing)
            setprevProcessing("")
        }
    }
    return (
        <div className='App'>
            <div>
                <h1>Transcription Tool</h1>
            </div>
            <div>
                <Inputs
                    enableTranscribe={enableTranscribe}
                    handleChangeFiles={handleChangeFiles} 
                    // handleChangeFiles={handleAddFiles}
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
                    processingMode={processingMode}
                    handleChangeProcessingMode={handleChangeProcessingMode}
                    useDiarization={useDiarization}
                    handleChangeUseDiarization={handleChangeUseDiarization}
                    useTranslation={useTranslation}
                    handleChangeUseTranslation={handleChangeUseTranslation}
                    >
                </Inputs>      
            </div>
            <div>
                <Outputs 
                    outputHeader={outputHeader} 
                    tabIndex={tabIndex} 
                    handleChangeTab={handleChangeTab}
                    transcripts={transcripts}
                    languages={languages}
                    filenames={filenames}
                    showLoadingSpinner={showLoadingSpinner}> 
                </Outputs>
            </div>
        </div>
    );
}
function Inputs({enableTranscribe, handleChangeFiles, modelInUse, handleChangeModel, handleTranscribeButtonClick, 
    inputMode, handleChangeInputMode, optionsVisible, handleOptionsButtonClick, saveOutputs, handleChangeSaveOutputs, outputFolder, handleChangeOutputFolder,
    processingMode, handleChangeProcessingMode, useDiarization, handleChangeUseDiarization, useTranslation, handleChangeUseTranslation}) {
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
    function ProcessingModeRadioButton({mode, disabled}) {
        return (
            <>
                <input id={mode} type='radio' name='processing' value={mode}  
                    disabled={disabled}
                    checked={mode === processingMode} 
                    onChange={handleChangeProcessingMode}
                    />
                <label for={mode}>{mode}</label>
            </>
        )
    }
    return (
        <fieldset>
            <div>
                <InputModeRadioButton mode="file" label={"I have a file"}></InputModeRadioButton>
                <InputModeRadioButton mode="folder" label={"I have a folder"}></InputModeRadioButton>
            </div>
            <div>
                <input type='file' multiple directory={(inputMode==='folder')&&""} webkitdirectory={(inputMode==='folder')&&""} onChange={handleChangeFiles}/>
            </div>
            <div>
                <button onClick={handleOptionsButtonClick}>{(optionsVisible ? "Hide " : "") + "Options"}</button>
                {optionsVisible && (
                    <div>
                        <div> 
                            <label>Processing Mode:</label>
                            <ProcessingModeRadioButton mode="Batched" disabled={useDiarization||useTranslation}></ProcessingModeRadioButton>
                            <ProcessingModeRadioButton mode="Sequential" disabled={useDiarization||useTranslation}></ProcessingModeRadioButton>
                        </div>
                        {/* <div>  
                            <label>Model: </label> 
                            <ModelRadioButton model='Whisper'></ModelRadioButton>
                        </div> */}
                        <div>
                            Additional Functionality:
                        </div>
                        <div>
                            <label>
                                <input type='checkbox' checked={useDiarization} onChange={handleChangeUseDiarization}/>
                                Diarization
                            </label>
                            <label>
                                <input type='checkbox' checked={useTranslation} onChange={handleChangeUseTranslation}/>
                                Translation
                            </label>
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
                    </div>
                )}
            </div>
            <div>
                <button type='submit' onClick={handleTranscribeButtonClick} size="lg" disabled={!enableTranscribe}>Transcribe</button>
            </div>
        </fieldset>
    );
}
function Outputs({outputHeader, tabIndex, handleChangeTab, transcripts, languages, filenames, showLoadingSpinner}) {
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
                {(showLoadingSpinner && !transcripts[tabIndex]) && (<div class="loader"></div>)}
                {transcripts[tabIndex] && NewlineText(transcripts[tabIndex])}
                {languages[tabIndex] && (<p>Language Detected: {languages[tabIndex]}</p>)}
            </Paper> 
        </div>
    );
     // text with newlines doesn't render properly in HTML; use this to put each newline into an html paragraph.
    function NewlineText(text) {
        const newText = text.split('\n').map(str => <p>{str}</p>)
        return newText
    }
}