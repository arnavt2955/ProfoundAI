import React, { useState } from 'react';
import './App.css';
import icon from "./img/uploadicon.png";
import { pdfjs, Document, Page } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [message, setMessage] = useState("No file uploaded");
  const [audioUrl, setAudioUrl] = useState(null); // State for Text-to-Speech

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
        setMessage(result.full_text);
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
    const text = "Hello, this is our text to speech application with bobby who is kinky";

    try {
      const response = await query({ inputs: text });

      if (response.ok) {
        const audioBlob = await response.blob(); // Get the audio as a binary blob
        const audioUrl = URL.createObjectURL(audioBlob); // Create a URL for the audio file
        setAudioUrl(audioUrl);
      } else {
        console.error("Error with the Hugging Face API", response.statusText);
      }
    } catch (error) {
      console.error("Error in processing the API request:", error);
    }
  };

  // Fetch request for Text-to-Speech
  async function query(data) {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech",
      {
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    return response;
  }

  return (
    <div className="App min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8">
      <h1 className="text-7xl font-bold mb-8">Presently</h1>

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
        <div className='flex flex-col items-center w-full max-w-4xl bg-white p-4 rounded-lg shadow-md'>
          <span className="block text-center mb-4">Page {pageNumber} of {numPages}</span>
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="border rounded overflow-hidden"
          >
            <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} scale={1.0} />
          </Document>

          <div className="flex justify-between mt-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              Previous Page
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              Next Page
            </button>
          </div>
          <h4 className="mt-4 text-center">{message}</h4>
        </div>
      ) : (
        <div className="text-center text-gray-600">{message}</div>
      )}

      {/* Text-to-Speech Section */}
      <div className="mt-8">
        <button
          onClick={handleTextToSpeech}
          className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-600 transition duration-300 ease-in-out"
        >
          Speak
        </button>
        {audioUrl && (
          <audio controls className="mt-4 w-full max-w-md">
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </div>
  );
}

export default App;
