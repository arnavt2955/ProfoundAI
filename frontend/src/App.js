import React, { useState, useRef } from 'react';
import './App.css'; // Minimal usage for Tailwind only
import icon from "./img/uploadicon.png";
import { pdfjs, Document, Page } from 'react-pdf';
import OpenAI from 'openai'
import {Buffer} from 'buffer'
//require('dotenv').config({ path: '.env.local' });

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [message, setMessage] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTextBox, setShowTextBox] = useState(false);
  const audioRef = useRef(null);
  const apiKey = process.env.REACT_APP_HUGGING_FACE_TOKEN;
  const openai = new OpenAI({apiKey:`${process.env.REACT_APP_OPENAI_KEY}`, dangerouslyAllowBrowser: true});
  //console.log(apiKey);
  const [userThoughts, setUserThoughts] = useState(""); 
  const [submittedText, setSubmittedText] = useState(""); 

  // PDF upload handler
  const uploadFile = async (e) => {
    const uploadedFile = e.target.files[0];
    const formData = new FormData();
    formData.append('file', uploadedFile);

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

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  // Text-to-Speech handler
  const handleTextToSpeech = async () => {
    setIsLoading(true);
    const text = message[pageNumber-1];

    const openaimessage = openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'alloy',
      input: text,
    });

    const buffer = Buffer.from(await openaimessage.arrayBuffer());
    const blob = new Blob([buffer], {type:'audio/mpeg'});
    const audioURL2 = URL.createObjectURL(blob);
    setAudioUrl(audioURL2);
    setIsLoading(false);
/**
    try {
      const response = await query({ inputs: text });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl1 = URL.createObjectURL(audioBlob);
        
        setAudioUrl(audioUrl1);
        setIsLoading(false);
        
      } else {
        console.error("Error with the Hugging Face API", response.statusText);
      }
    } catch (error) {
      console.error("Error in processing the API request:", error);
    }*/
  };

  // Handle "hand raise" button click
  const handleHandRaise = () => {
    // Pause the audio if it's playing
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    // Toggle the visibility of the text input box
    setShowTextBox(!showTextBox);
  };

  // Fetch request for Text-to-Speech
  async function query(data) {
    var response = await fetch("https://api-inference.huggingface.co/models/suno/bark", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      response = await fetch("https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    return response;
  }

  const handleSubmit = () => {
    setSubmittedText(userThoughts);
    setUserThoughts(""); 
  };

  return (
    <div className="App min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8">
      <h1 className="text-4xl font-bold mb-8">Simon Says</h1>

      {/* PDF Upload Section */}
      <label className="cursor-pointer mb-4">
        <img src={icon} alt="Upload File" className="w-16 h-16" />
        <input
          id="file-upload"
          type="file"
          onChange={uploadFile}
          style={{ display: 'none' }}
          accept="application/pdf"
        />
      </label>

      {/* PDF Viewer */}
      {file ? (
        <div className="flex flex-col items-center w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
          <span className="block text-center mb-4">Page {pageNumber} of {numPages}</span>
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="border rounded overflow-hidden"
          >
            <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} scale={1.0} />
          </Document>

          <div className="flex justify-between mt-4 w-full max-w-xs">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              Previous Page
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              Next Page
            </button>
          </div>
          <h4 className="mt-4 text-center">{message[pageNumber - 1]}</h4>
        </div>
      ) : (
        <div className="text-center text-gray-600">{message[pageNumber - 1]}</div>
      )}

      {/* Text-to-Speech Section */}
      <div className="mt-8">
        <button
          onClick={handleTextToSpeech}
          className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-600 transition duration-300 ease-in-out"
        >
          Speak
        </button>
        {audioUrl && !isLoading && (
          <audio controls className="mt-4 w-full max-w-md" ref={audioRef}>
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
      

      {/* Hand Raise Button */}
      {file && (
        <button
          onClick={handleHandRaise}
          className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-600 transition duration-300 ease-in-out mt-4"
        >
          ✋
        </button>
      )}

      {/* Text Input Box */}
      {showTextBox && (
      <div className="mt-8 w-full max-w-md">
      <input
        type="text"
        value={userThoughts}
        onChange={(e) => setUserThoughts(e.target.value)}
        placeholder="Type your thoughts..."
        className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full hover:bg-blue-600"
      >
        Submit
      </button>
    </div>
      )}
    </div>
  );
}

export default App;
