from flask import Flask, request, jsonify
import pdfplumber

app = Flask(__name__)

@app.route("/test")
def test():
    return {"message": "dummy"}

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']

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

    return jsonify({"full_text": full_text, "page_text": page_text}), 200

if __name__ == "__main__":
    print('hello')
    app.run(debug=True)
