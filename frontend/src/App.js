import React, { useState, useRef } from 'react';
import './App.css'; // Minimal usage for Tailwind only
import icon from "./img/uploadicon.png";
import { pdfjs, Document, Page } from 'react-pdf';
import OpenAI from 'openai';
import { Buffer } from 'buffer';
import axios from 'axios';
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
  const openai = new OpenAI({ apiKey: `${process.env.REACT_APP_OPENAI_KEY}`, dangerouslyAllowBrowser: true });
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
    const text = message[pageNumber - 1];

    const openaimessage = await getAudioBuffer(text);
    const blob = new Blob([openaimessage], { type: 'audio/mpeg' });
    const audioURL2 = URL.createObjectURL(blob);
    setAudioUrl(audioURL2);
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

  const handleHandRaise = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setShowTextBox(!showTextBox);
  };

  const handleSubmit = () => {
    setSubmittedText(userThoughts);
    setUserThoughts(""); 
  };

  return (
    <div className="App min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 flex flex-col items-center justify-center py-8">
      <h1 className="text-5xl font-semibold mb-8 text-gray-700">Profound AI</h1>

      {/* PDF Upload Section */}
      <label className="cursor-pointer mb-6 flex flex-col items-center">
        <img src={icon} alt="Upload File" className="w-20 h-20 mb-2 opacity-80 hover:opacity-100 transition-opacity duration-300" />
        <input
          id="file-upload"
          type="file"
          onChange={uploadFile}
          style={{ display: 'none' }}
          accept="application/pdf"
        />
        <span className="text-gray-600 text-lg">Upload PDF</span>
      </label>

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
            Speak
          </button>
          {audioUrl && !isLoading && (
            <audio controls className="mt-6 w-full max-w-md" ref={audioRef}>
              <source src={audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {/* Hand Raise Button */}
      {file && audioUrl && (
        <button
          onClick={handleHandRaise}
          className="bg-purple-500 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-purple-600 transition duration-300 ease-in-out mt-6"
        >
          ✋
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
