# Flood Risk Dashboard Backend

This is the Python backend for the Flood Risk Dashboard project. It provides a simple web server and MongoDB integration for storing and retrieving flood risk data.

## Structure
- `main.py`: Entry point for the FastAPI web server
- `config/`: Configuration files (e.g., database connection)
- `schemas/`: Pydantic models for MongoDB collections

## Setup
1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## MongoDB
- Configure your MongoDB URI in `config/database.py`. 