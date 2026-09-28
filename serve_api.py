from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import random


app = FastAPI(
    title="Cyclone Analysis API",
    description="Prototype Tropical Cyclone Analysis System",
    version="1.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Home
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Cyclone Analysis API is running",
        "mode": "prototype"
    }


# --------------------------------------------------
# Health
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "mode": "prototype"
    }


# --------------------------------------------------
# Intensity classification
# --------------------------------------------------

def get_intensity(wind_speed):

    if wind_speed < 17:
        return "Depression"

    elif wind_speed < 28:
        return "Deep Depression"

    elif wind_speed < 34:
        return "Cyclonic Storm"

    elif wind_speed < 48:
        return "Severe Cyclonic Storm"

    elif wind_speed < 64:
        return "Very Severe Cyclonic Storm"

    elif wind_speed < 90:
        return "Extremely Severe Cyclonic Storm"

    else:
        return "Super Cyclonic Storm"


# --------------------------------------------------
# Prediction
# --------------------------------------------------

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    try:

        # Read image
        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        )

        # Basic validation
        width, height = image.size

        # ------------------------------------------------
        # DEMO prediction
        # ------------------------------------------------

        # Generate a realistic demo wind speed
        wind_speed = random.uniform(35, 110)

        wind_speed = round(
            wind_speed,
            2
        )

        intensity = get_intensity(
            wind_speed
        )

        return {
            "success": True,
            "mode": "prototype",
            "filename": file.filename,
            "image_width": width,
            "image_height": height,
            "wind_speed_knots": wind_speed,
            "intensity": intensity,
            "message": "Prototype cyclone analysis completed"
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }


# --------------------------------------------------
# Forecast
# --------------------------------------------------

@app.post("/forecast")
async def forecast():

    return {
        "success": True,
        "mode": "prototype",
        "forecast": [
            {
                "time": "6 hours",
                "wind_speed_knots": 62
            },
            {
                "time": "12 hours",
                "wind_speed_knots": 68
            },
            {
                "time": "24 hours",
                "wind_speed_knots": 74
            }
        ]
    }
