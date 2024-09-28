import React, { useState, useRef, useEffect } from 'react';
import './App.css'; // Minimal usage for Tailwind only
import icon from "./img/uploadicon.png";
import { pdfjs, Document, Page } from 'react-pdf';
import { Buffer } from 'buffer';
import axios from 'axios';
//require('dotenv').config({ path: '.env.local' });

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

function App() {
  const [file, setFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [message, setMessage] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTextBox, setShowTextBox] = useState(false);
  const audioRef = useRef(null);
  const [userThoughts, setUserThoughts] = useState(""); 
  const [submittedText, setSubmittedText] = useState(""); 
  const [canvasURL, setCanvasURL] = useState("");
  const [canvasToken, setCanvasToken] = useState("");
  const audioSummaryPlayer= useRef(null);
  const [isChangingPageNum, setIsChangingPageNum] = useState(false);


  

  const changeFile = async (e) => {
    setSelectedFile(e.target.files[0]);
  } 
  // PDF upload handler
  const uploadFile = async () => {
    const uploadedFile = selectedFile;
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('canvasURL', canvasURL);
    formData.append('canvasToken', canvasToken);
    console.log(canvasURL);
    console.log(canvasToken);
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        const fileURL = URL.createObjectURL(uploadedFile);
        setFile(fileURL);
        setMessage(result.page_text);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('An error occurred while uploading the file.');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => {
    setIsChangingPageNum(true);
    setPageNumber(prev => Math.max(prev - 1, 1));
    setIsChangingPageNum(false);
  }
  const goToNextPage = () => {
    setIsChangingPageNum(true);
    setPageNumber(prev => Math.min(prev + 1, numPages));
    setIsChangingPageNum(false);
  }

  // Text-to-Speech handler
  const handleTextToSpeech = async () => {
    if (audioSummaryPlayer.current && !audioSummaryPlayer.current.paused) {
      audioSummaryPlayer.current.pause();
    }
    setIsLoading(true);
    const text = message[pageNumber - 1];

    const openaimessage = await getAudioBuffer(text);
    const blob = new Blob([openaimessage], { type: 'audio/mpeg' });
    const audioURL2 = URL.createObjectURL(blob);
    setAudioUrl(audioURL2)
    const audioplayerlocal = new Audio(audioURL2)
    audioSummaryPlayer.current = audioplayerlocal;
    audioSummaryPlayer.current.playbackRate = 1.25;
    audioSummaryPlayer.current.play()
    setIsLoading(false);
  };

  async function getAudioBuffer(text) {
    const response = await axios.post('https://api.openai.com/v1/audio/speech', {
      model: 'tts-1-hd',
      voice: 'alloy',
      input: text
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_KEY}`
      },
      responseType: 'arraybuffer' // Specify arraybuffer as the response type
    });
  
    return Buffer.from(response.data);
  }

  useEffect(() => {
    if (message.length !== 0 && pageNumber > 0) {
      handleTextToSpeech();
    }
  }, [pageNumber]);

  const handleHandRaise = () => {
    
    if (audioSummaryPlayer.current && !audioSummaryPlayer.current.paused) {
      audioSummaryPlayer.current.pause();
    } else if (audioSummaryPlayer.current && audioSummaryPlayer.current.paused && !audioSummaryPlayer.current.ended) {
      audioSummaryPlayer.current.play();
    }
    
    
    setShowTextBox(!showTextBox);
  };

  const handleSubmit = async () => {
    setSubmittedText(userThoughts);
    const data = { message: userThoughts };
    try {
      const response = await fetch('/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
      if (response.ok) {
        const openaimessage = await getAudioBuffer(result.answer);
        const blob = new Blob([openaimessage], { type: 'audio/mpeg' });
        const audioUrlAnswer = URL.createObjectURL(blob);
        const audioAnswerPlayer = new Audio(audioUrlAnswer);
        audioAnswerPlayer.play();
      } else {
        setMessage(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Error sending string:', error);
    }
    setUserThoughts(""); 
  };

  return (
    <div className="App min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 flex flex-col items-center justify-center py-8">
      <h1 className="text-5xl font-semibold mb-8 text-gray-700">Profound AI</h1>

      {/* PDF Upload Section */}
      <label className="cursor-pointer mb-6 flex flex-col items-center" style={!file ? {display: 'block'} : {display: 'none'}}>
        <img src={icon} alt="Upload File" style={{margin: "0 auto"}}className="w-20 h-20 mb-2 opacity-80 hover:opacity-100 transition-opacity duration-300" />
        <input
          id="file-upload"
          type="file"
          onChange={changeFile}
          style={{ display: 'none' }}
          accept="application/pdf"
        />
        <span className="text-gray-600 text-lg">{selectedFile ? selectedFile.name : "No file selected..."}</span>
      </label>
      <div className="mb-6 flex flex-col items-center w-full max-w-md" style={!file ? {display: 'block'} : {display: 'none'}}>
        <input
          type="text"
          value={canvasURL}
          onChange={(e) => setCanvasURL(e.target.value)}
          placeholder="Enter Canvas URL"
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          value={canvasToken}
          onChange={(e) => setCanvasToken(e.target.value)}
          placeholder="Enter Canvas Token"
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <button onClick={uploadFile} style={!file ? {display: 'block'} : {display: 'none'}} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" >Submit</button>

      {/* PDF Viewer */}
      {file ? (
        <div className="flex items-center justify-center w-full max-w-5xl bg-white p-8 rounded-xl shadow-lg relative">
          {/* Left Arrow */}
          <button
            className="flex-shrink-0 bg-blue-500 text-white w-12 h-12 rounded-full hover:bg-blue-600 disabled:opacity-50 mr-4 shadow-lg transition duration-300 flex items-center justify-center"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            &larr;
          </button>

          {/* PDF Document */}
          <div>
            <span className="block text-center mb-4 text-gray-600">Page {pageNumber} of {numPages}</span>
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              className="border rounded-lg overflow-hidden shadow-md"
            >
              <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} scale={1.0} />
            </Document>
          </div>

          {/* Right Arrow */}
          <button
            className="flex-shrink-0 bg-blue-500 text-white w-12 h-12 rounded-full hover:bg-blue-600 disabled:opacity-50 ml-4 shadow-lg transition duration-300 flex items-center justify-center"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            &rarr;
          </button>
        </div>
      ) : (
        <div></div>
      )}


      {/* Text-to-Speech Section */}
      {file ? (
        <div className="mt-10">
          <button
            onClick={handleTextToSpeech}
            className="bg-teal-500 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-teal-600 transition duration-300 ease-in-out"
          >
            Play
          </button>
        </div>
      ) : (
        <div></div>
      )}

      {/* Hand Raise Button */}
      {file && audioUrl && !isLoading && !showTextBox && (
        <button
          onClick={handleHandRaise}
          className="bg-purple-500 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-purple-600 transition duration-300 ease-in-out mt-6"
        >
          ✋
        </button>
      )}

      {file && audioUrl && !isLoading && showTextBox &&(
        <button
          onClick={handleHandRaise}
          className="bg-purple-500 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-purple-600 transition duration-300 ease-in-out mt-6"
        >
          Resume
        </button>
      )}

      {/* Text Input Box */}
      {showTextBox && (
        <div className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <input
            type="text"
            value={userThoughts}
            onChange={(e) => setUserThoughts(e.target.value)}
            placeholder="Type your thoughts..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-600 transition duration-300"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
