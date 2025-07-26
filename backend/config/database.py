import os
from mongoengine import connect, disconnect
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "flood_risk")

def connect_to_mongo():
    connect(db=DB_NAME, host=MONGO_URI)

def disconnect_from_mongo():
    disconnect() 