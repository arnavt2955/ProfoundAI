from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import pdfplumber
from pymongo import MongoClient
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import MongoDBAtlasVectorSearch
from langchain.document_loaders import DirectoryLoader
from langchain.schema import Document
from langchain.llms import OpenAI
from langchain.chains import RetrievalQA
import certifi
from pymongo import MongoClient

load_dotenv()
OPENAI_KEY=os.getenv('OPENAI_KEY')
MONGO_URI=os.getenv('MONGO_URI')
client = MongoClient(
    MONGO_URI,
    tlsCAFile=certifi.where()
)
dbName = "profound_slides"
collectionName = "collection_of_text_blobs"
collection = client[dbName][collectionName]

embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_KEY)
llm = OpenAI(openai_api_key=OPENAI_KEY, temperature=0.5)
app = Flask(__name__)

@app.route("/test")
def test():
    return {"message": "dummy"}

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    canvasURL = request.form.get('canvasURL')
    canvasToken = request.form.get('canvasToken')

    #file.save(f'./uploads/{file.filename}')
    
    full_text = ""
    page_text = []

    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            # Extract text from each page
            text = page.extract_text() + "\n"
            # Optionally, extract tables (if available)
            tables = page.extract_tables()
            for table in tables:
                text += f"Table: {table}\n"
            full_text += text + "\n"
            page_text.append(text)
    # Clear the collection before adding new documents
    collection.delete_many({})  
    documents = [Document(page_content=doc) for doc in page_text]
    
    vectorStore = MongoDBAtlasVectorSearch.from_documents(documents, embeddings, collection=collection)
    #vectorStore = MongoDBAtlasVectorSearch(collection, embeddings)
    retriever = vectorStore.as_retriever()
    qa = RetrievalQA.from_chain_type(llm, chain_type="stuff", retriever=retriever)
    output = []
    for pt in page_text:
        output.append(qa.run("Present the following parsed lecture slide like you are a professor, concisely in paragraph format. Leave out any citations or page numbers. If the slide has little content, generate less: " + pt))
    return jsonify({"full_text": full_text, "page_text": output}), 200

@app.route('/question', methods=['POST'])
def question():
    data = request.get_json()
    message = data.get('message')
    vectorStore = MongoDBAtlasVectorSearch(collection, embeddings)
    retriever = vectorStore.as_retriever()
    qa = RetrievalQA.from_chain_type(llm, chain_type="stuff", retriever=retriever)
    out = qa.run(message)
    return jsonify({"answer": out}), 200

if __name__ == "__main__":
    print('hello')
    app.run(debug=True)
