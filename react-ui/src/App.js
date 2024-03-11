import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

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

    function handleTranscribeButtonClick() {
        setOutputHeader('Transcribing ' + file.name + ' to ' + language + ':')
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
            <Outputs output={output}> </Outputs>
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

function Outputs({output}) {

    return (
        <fieldset>
            <h2>Output:</h2>
            <h3>{outputHeader}</h3>
            <div>{output}</div>
        </fieldset>
    );
}

export default App;
//export default Game;
//export default OldApp;

function OldApp() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

function Game() {
    const [boardHistory, setBoardHistory] = useState([Array(9).fill(null)]);
    const [isXsTurn, setXsTurn] = useState(true);
    const currentBoardState = boardHistory[boardHistory.length - 1];
    const winner = calculateWinner(currentBoardState);
    const [sortAscending, setSortAscending] = useState(true);

    let moves = boardHistory.map((_, n) => {
        if (n === boardHistory.length-1) {
            let text;
            if (winner) {
                text = "Player " + winner + " wins in " + n + " moves";
            } else if (n === 9) {
                text = "Game ends in a draw";
            } else {
                text = "You are at move " + n;
            }
            return <li>{text}</li>
        } 
        else {
            let description;
            if (n === 0) {
                description = "Reset game";
            } else {
                description = "Go to move #" + n;
            }
            return (
                <li>
                    <button onClick={() => jumpToBoardState(n)}>{description}</button>
                </li>
            );
        }
    });

    return (
        <div className='game'>
            <div className='game-board'>
                <Board isXsTurn={isXsTurn} squareVals={currentBoardState} handlePlay={handlePlay} n={boardHistory.length-1}> </Board>
            </div>
            <div className='game-info'>
                <ol>{(sortAscending ? moves : moves.reverse())}</ol>
                <button onClick={toggleSorting}>{(sortAscending ? "Sort Descending ↓" : "Sort Ascending ↑")}</button>
            </div>
        </div>
    );

    function toggleSorting() {
        setSortAscending(!sortAscending);
    }
        
    function handlePlay(nextVals) {
        setBoardHistory([...boardHistory, nextVals]);
        setXsTurn(!isXsTurn);
    }

    function jumpToBoardState(n) {
        setBoardHistory(boardHistory.slice(0, n+1));
        setXsTurn(n%2 === 0);
    }
}

function Board({isXsTurn, squareVals, handlePlay, n}) {

    const winner = calculateWinner(squareVals);
    let status;
    if (winner) {
        status = "PLAYER " + winner + " WINS!";
    } else if (n === 9) {
        status = "DRAW!";
    } else {
        status = "Player " + (isXsTurn ? "X":"O") + "'s turn:";
    }

    let boardRows = [];
    for (let i = 0; i < 3; i++) {
        let rowButtons = [];
        for (let j = 0; j < 3; j++) {
            let n = i*3+j;
            rowButtons.push(<BoardButton value={squareVals[n]} onButtonClick={() => handleBoardClick(n)}></BoardButton>);
        }
        boardRows.push(<div className='board-row'>{rowButtons}</div>);
    }

    return (
    <>
        <h1>{status}</h1>
        {boardRows}
    </>
    );

    function handleBoardClick(i) {
        if (!squareVals[i] && !winner) {
            const nextVals = squareVals.slice();
            if (isXsTurn) {
                nextVals[i] = 'X';
            } else {
                nextVals[i] = 'O';
            }
            handlePlay(nextVals);
        }
    }
}

function BoardButton({value, onButtonClick}) {
    return (
        <button className='square' onClick={onButtonClick}>{value}</button>
    )
}

function calculateWinner(squareVals) {
    const triples = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    
    for (let i = 0; i < triples.length; i++) {
        const [a, b, c] = triples[i];
        if (squareVals[a] && squareVals[a] === squareVals[b] &&
            squareVals[a] === squareVals[c]) {
                return squareVals[a];
        }
    }
    return null;
}
