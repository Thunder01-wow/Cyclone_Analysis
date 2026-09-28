from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import random
from datetime import datetime, timezone

app = FastAPI(
    title="Cyclone Analysis API",
    description="Tropical Cyclone Analysis Prototype",
    version="1.0"
)

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
        "message": "Cyclone Analysis API is running",
        "mode": "prototype"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "mode": "prototype",
        "model_loaded": False
    }


def get_imd_category(wind_speed):
    if wind_speed < 28:
        return "Depression"
    elif wind_speed < 34:
        return "Deep Depression"
    elif wind_speed < 48:
        return "Cyclonic Storm (CS)"
    elif wind_speed < 64:
        return "Severe Cyclonic Storm (SCS)"
    elif wind_speed < 90:
        return "Very Severe Cyclonic Storm (VSCS)"
    elif wind_speed < 120:
        return "Extremely Severe Cyclonic Storm (ESCS)"
    else:
        return "Super Cyclonic Storm (SuCS)"


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    contents = await file.read()

    try:
        image = Image.open(io.BytesIO(contents))
        width, height = image.size
    except Exception:
        return {
            "detected": False,
            "error": "Invalid image file"
        }

    # Prototype simulation
    wind_speed = round(random.uniform(65, 100), 1)

    wind_speed_kmh = round(wind_speed * 1.852, 1)
    wind_speed_mph = round(wind_speed * 1.15078, 1)

    peak_gust = round(wind_speed * random.uniform(1.15, 1.25), 1)
    peak_gust_kmh = round(peak_gust * 1.852, 1)

    confidence = round(random.uniform(90, 97), 1)

    pressure = round(random.uniform(950, 980), 1)

    return {
        "detected": True,

        "wind_speed_knots": wind_speed,
        "wind_speed_kmh": wind_speed_kmh,
        "wind_speed_mph": wind_speed_mph,

        "peak_gust_knots": peak_gust,
        "peak_gust_kmh": peak_gust_kmh,

        "confidence": confidence,

        "imd_category": get_imd_category(wind_speed),
        "imd_warning_tier": 3,

        "estimated_pressure_hpa": pressure,
        "pressure_deficit_hpa": round(1013 - pressure, 1),

        "eyewall_temp_celsius": round(random.uniform(-75, -68), 1),

        "eye_formation_type": random.choice([
            "Pinhole / Dense Central Overcast (CDO)",
            "Well-defined Eye",
            "Partial Eye Formation"
        ]),

        "inference_latency_ms": round(random.uniform(35, 60), 1),

        "model_version": "Prototype Simulation",

        "timestamp_utc": datetime.now(timezone.utc).isoformat(),

        "mode": "prototype",

        "image_width": width,
        "image_height": height
    }


@app.post("/forecast")
async def forecast(cyclone_id: str = "biparjoy", basin: str = "Arabian Sea"):

    return {
        "success": True,
        "mode": "prototype",
        "cyclone_id": cyclone_id,
        "basin": basin,

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
