# Cyclone Analysis

Cyclone Analysis is a research prototype for estimating tropical cyclone intensity from infrared satellite imagery. It combines a browser-based dashboard with a Python training pipeline and an optional FastAPI integration point.

> **Important:** This is an experimental prototype and is not certified for official emergency-warning operations.

## Project workflow

1. **Prepare training data**
   - Download the DrivenData tropical-storm wind-speed dataset.
   - Place the extracted files under `data/` using the layout expected by `train_model.py`.
   - The training script reads image labels and optional storm metadata from CSV files.

2. **Train the model**
   - `train_model.py` validates the dataset, builds image paths, removes missing files, and creates a train/validation split.
   - When `storm_id` is available, the split is storm-aware to reduce data leakage.
   - Images are decoded as single-channel infrared data, resized to `224 × 224`, normalized, and augmented during training.
   - A TensorFlow CNN regresses sustained wind speed in knots.
   - The best model is saved as `cyclone_wind_speed_model.keras`.

3. **Run the dashboard**
   - `index.html`, `style.css`, and `app.js` provide the frontend application.
   - The dashboard includes cyclone analysis, prediction history, model information, and trajectory forecast views.
   - It starts in **Simulation Driver** mode, which uses built-in sample data and generated satellite-image presets.

4. **Use the optional live API mode**
   - The frontend can call a backend at `http://localhost:8000`.
   - It expects `GET /health`, `POST /predict`, and `POST /forecast` endpoints.
   - The current `serve_api.py` file is empty, so live API mode requires implementing or adding those endpoints first. Until then, the dashboard falls back to simulation data.

5. **Export results**
   - Prediction history can be exported as CSV.
   - The latest prediction can be exported as a GeoJSON payload.

## Repository layout

```text
.
├── index.html          # Dashboard markup and application pages
├── app.js              # Frontend state, analysis flow, history, and forecast logic
├── style.css           # Dashboard styling and responsive layout
├── train_model.py      # TensorFlow training pipeline
├── serve_api.py        # Reserved backend entry point; currently empty
├── requirements.txt    # Python dependencies
├── LICENSE             # MIT license
└── README.md           # Project documentation
```

## Requirements

- Python 3.9+ recommended
- A modern web browser
- TensorFlow-compatible hardware or environment for model training
- Training data placed under `data/` when running the training script

## Setup

Create and activate a virtual environment, then install the Python dependencies:

```bash
python -m venv .venv
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

**Windows PowerShell:**

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run the dashboard

Because the frontend uses JavaScript modules such as `fetch`, serve the repository with a local HTTP server instead of opening `index.html` directly:

```bash
python -m http.server 5500
```

Open:

```text
http://localhost:5500
```

The dashboard works in simulation mode without a backend.

## Train the model

After downloading and extracting the dataset, verify the CSV column names and update the configuration at the top of `train_model.py` if necessary. The default paths are:

```text
data/
├── train_images/
├── training_set_labels.csv
└── training_set_features.csv   # optional
```

Run training with:

```bash
python train_model.py
```

The script produces:

```text
cyclone_wind_speed_model.keras
```

Useful dataset checks:

```bash
python -c "import pandas as pd; print(pd.read_csv('data/training_set_labels.csv').columns.tolist())"
python -c "import pandas as pd; print(pd.read_csv('data/training_set_features.csv').columns.tolist())"
```

## API integration

The frontend is configured to use:

```text
http://localhost:8000
```

The expected request for image prediction is:

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@satellite_tile.png"
```

Expected routes used by `app.js`:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Check backend availability and model status |
| `POST` | `/predict` | Predict cyclone intensity from an uploaded image |
| `POST` | `/forecast` | Return trajectory and intensity forecast data |

To enable the live mode, implement these routes in `serve_api.py`, start the API on port `8000`, and switch the dashboard toggle from **SIM** to **LIVE API**.

## Notes

- The training script currently uses a compact custom CNN, while the dashboard displays a ResNet-style prototype model description. Keep those descriptions synchronized when the production model is finalized.
- The supplied training workflow is a proof of concept using public storm imagery. A production North Indian Ocean system should be retrained and validated with appropriate INSAT and best-track data.
- Do not use simulated or prototype predictions for operational warnings.
