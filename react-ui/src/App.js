import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios'

function App() {
    const [file, setFile] = useState()
    const [language, setLanguage] = useState('English');
    const [outputHeader, setOutputHeader] = useState('Choose a file above and click "Transcribe" to transcribe the audio/video file into the desired language');
    const [output, setOutput] = useState()

    function handleChangeFile(event) {
        setFile(event.target.files[0])
    }

    function handleChangeSourceLanguage(event) {
        setLanguage(event.target.value)
    }

    /* ==========================================
        Handling communication with backend here
       ==========================================
    */
    function handleTranscribeButtonClick() {
        setOutputHeader('Transcribing ' + file.name + ' to ' + language + ':')

        const formData = new FormData();

        formData.append("file", file);

        axios.post('/test/', formData, {
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	}).then((response) => {
            const data = response.data
            setOutput(data.result)
        }).catch((error) => {
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
        })
    }

    return (
        <div>
            <h1>Transcription & Translation Tool</h1>
            <Inputs 
                handleChangeFile={handleChangeFile} 
                handleChangeSourceLanguage={handleChangeSourceLanguage}
                handleTranscribeButtonClick={handleTranscribeButtonClick}
                language={language}> 
            </Inputs>
            <Outputs output={output} outputHeader={outputHeader}> </Outputs>
        </div>
    );
}

function Inputs({handleChangeFile, handleChangeSourceLanguage, handleTranscribeButtonClick, language}) {

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
                <h3>Audio/Video File: </h3>
                <input type='file'onChange={handleChangeFile}/>
            </div>
            <div>
                <h3>Language: </h3>
                <LanguageRadioButton lang='English'></LanguageRadioButton>
                <LanguageRadioButton lang='Spanish'></LanguageRadioButton>
                <LanguageRadioButton lang='Chinese'></LanguageRadioButton>
                <LanguageRadioButton lang='Russian'></LanguageRadioButton>
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
            <h3>{outputHeader}</h3>
            <div>{output}</div>
        </fieldset>
    );
}

export default App;
