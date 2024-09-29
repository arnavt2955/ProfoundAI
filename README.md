<p align="center">
  <img width="600" alt="image" src="https://github.com/ChittebbayiPenugonda/Profound/blob/main/frontend/src/img/ProFound-ai.png">
</p>

# Welcome to Profound AI!
## Profound AI is a RAG powered lecturer agent that can walk you through your lecture slides and answer your questions
 You can upload your lecture slides (and optionally a link to your class Canvas and your Canvas Token) and Profound will walk you through the presentation. During the presentation, you can "Raise your hand" and ask Profound any questions you have about the content. Profound will use the RAG (Retrieval Augmented Generation) context from your uploads to answer your question efficiently and accurately.

Tech Stack: ReactJS, TailwindCSS, Flask, MongoDB Atlas, Langchain

## Set up for yourself:
Required Python Installations: pip install langchain pymongo bs4 openai tiktoken gradio requests lxml argparse unstructured flask pdfplumber python-dotenv requests

We also have two .env files. One for the backend and one for the frontend

Frontend .env:
REACT_APP_OPENAI_KEY=<OPEN_AI_KEY>

Backend .env:
OPENAI_KEY=<OPEN_AI_KEY>
MONGO_URI=<MONGO_URI>

When running the frontend, navigate over to the frontend folder and in your terminal, run "npm install" and then "npm start". This should spin up the frontend locally.

When running the backend, navigate over to the "flask-server" folder and in your terminal run "python server.py". This should start up the flask server.

Once both of the steps above are complete, you are ready to use Profound AI!
