from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import io
import os

app = FastAPI(
    title="Cyclone Analysis API",
    description="AI-based tropical cyclone analysis API",
    version="1.0"
)

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Cyclone Analysis API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    # Read uploaded image
    contents = await file.read()

    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # Resize image
    image = image.resize((256, 256))

    # Convert to numpy
    image_array = np.array(image) / 255.0

    # Add batch dimension
    image_array = np.expand_dims(image_array, axis=0)

    # Temporary response
    # We will connect your trained CNN here in the next step.
    return {
        "wind_speed": 0,
        "intensity": "Unknown",
        "message": "Image received successfully"
    }


@app.post("/forecast")
async def forecast():

    return {
        "message": "Forecast endpoint is working"
    }
