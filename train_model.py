"""
Tropical Cyclone Wind Speed Estimation — Training Script
==========================================================
Trains a CNN to predict tropical storm wind speed (knots) from a single-band
infrared satellite image, using the DrivenData "Wind-dependent Variables:
Predict Wind Speeds of Tropical Storms" dataset (NASA IMPACT / Radiant Earth
Foundation).

WHAT THIS IS FOR
----------------
This is a fast, working prototype model for SIH26070 (cyclone identification/
classification/prediction using multi-source satellite data). It trains on
PUBLIC Atlantic/Pacific storm imagery as a proof of concept. For the actual
PS you'll eventually want to retrain the same pipeline on INSAT-3D IR imagery
(North Indian Ocean, via MOSDAC) paired with IBTrACS/IMD best-track wind
speeds — say this explicitly in your demo so it's clear this is a working
methodology, not a finished India-specific model.

GET THE DATA
------------
https://www.drivendata.org/competitions/72/predict-wind-speeds/data/
(free registration required). Download and extract it, then check the actual
column names in the labels CSV before running this script:

    import pandas as pd
    print(pd.read_csv("data/training_set_labels.csv").columns.tolist())
    print(pd.read_csv("data/training_set_features.csv").columns.tolist())

Then adjust the CONFIG block below to match your real file/column names.

EXPECTED LAYOUT (DrivenData defaults)
--------------------------------------
    data/
      train_images/                <- folder of .jpg images (abs_000.jpg …)
      training_set_labels.csv      <- columns: image_id, wind_speed
      training_set_features.csv    <- columns: image_id, storm_id, relative_time, ocean
"""

import os
import sys
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# CONFIG — adjust these to match your actual downloaded files
# ---------------------------------------------------------------------------
IMAGE_DIR       = "data/train_images"               # folder containing the .jpg images
LABELS_CSV      = "data/training_set_labels.csv"     # image_id, wind_speed
FEATURES_CSV    = "data/training_set_features.csv"   # image_id, storm_id, relative_time, ocean (optional)
ID_COL          = "image_id"                         # column with image filename (no extension)
TARGET_COL      = "wind_speed"                       # column with wind speed in knots
IMAGE_EXT       = ".jpg"
IMG_SIZE        = 224                                # resize target (source images are 366×366)
BATCH_SIZE      = 32
EPOCHS          = 30
VAL_SPLIT       = 0.15
SEED            = 42
MODEL_OUT       = "cyclone_wind_speed_model.keras"

# ---------------------------------------------------------------------------
# 1. Load metadata and build train/val split
# ---------------------------------------------------------------------------
# --- Sanity-check that files exist ---
for fpath, label in [(LABELS_CSV, "labels")]:
    if not os.path.isfile(fpath):
        print(f"ERROR: {label} CSV not found at '{fpath}'")
        print("       Update the CONFIG block at the top of this script.")
        sys.exit(1)

df = pd.read_csv(LABELS_CSV)
print(f"Labels CSV columns: {df.columns.tolist()}")
print(f"Labels CSV shape  : {df.shape}")

# Optional: merge features CSV for storm-aware splitting
if os.path.isfile(FEATURES_CSV):
    feat_df = pd.read_csv(FEATURES_CSV)
    print(f"Features CSV columns: {feat_df.columns.tolist()}")
    df = df.merge(feat_df, on=ID_COL, how="left")

df["filepath"] = df[ID_COL].astype(str).apply(
    lambda x: os.path.join(IMAGE_DIR, x if x.endswith(IMAGE_EXT) else x + IMAGE_EXT)
)

# keep only rows where the image actually exists on disk
df = df[df["filepath"].apply(os.path.exists)].reset_index(drop=True)
print(f"Found {len(df)} labeled images on disk.")
if len(df) == 0:
    raise SystemExit(
        "No images found — check IMAGE_DIR / LABELS_CSV / ID_COL / IMAGE_EXT "
        "against your actual downloaded files."
    )

print(f"Wind speed range: {df[TARGET_COL].min()} – {df[TARGET_COL].max()} knots")
print(f"Wind speed mean : {df[TARGET_COL].mean():.1f} knots")

# Storm-aware split: if we have storm_id, split by whole storms so no leakage
if "storm_id" in df.columns:
    storms = df["storm_id"].unique()
    train_storms, val_storms = train_test_split(storms, test_size=VAL_SPLIT, random_state=SEED)
    train_df = df[df["storm_id"].isin(train_storms)].reset_index(drop=True)
    val_df   = df[df["storm_id"].isin(val_storms)].reset_index(drop=True)
    print(f"Storm-aware split: {len(train_storms)} train storms, {len(val_storms)} val storms")
else:
    train_df, val_df = train_test_split(df, test_size=VAL_SPLIT, random_state=SEED)

print(f"Train: {len(train_df)} images | Val: {len(val_df)} images")

# ---------------------------------------------------------------------------
# 2. tf.data pipeline
# ---------------------------------------------------------------------------
def load_image(path, label):
    img = tf.io.read_file(path)
    img = tf.image.decode_jpeg(img, channels=1)          # single-band IR image
    img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
    img = tf.cast(img, tf.float32) / 255.0
    return img, label


def make_dataset(frame, training):
    paths = frame["filepath"].values
    labels = frame[TARGET_COL].values.astype(np.float32)
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
    if training:
        ds = ds.shuffle(2048, seed=SEED)
        ds = ds.map(
            lambda img, lbl: (
                tf.image.random_flip_left_right(
                    tf.image.random_flip_up_down(img)
                ),
                lbl,
            ),
            num_parallel_calls=tf.data.AUTOTUNE,
        )
    ds = ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    return ds


train_ds = make_dataset(train_df, training=True)
val_ds = make_dataset(val_df, training=False)

# ---------------------------------------------------------------------------
# 3. Model — compact CNN regression head (single-channel IR input)
# ---------------------------------------------------------------------------
def build_model():
    inputs = layers.Input(shape=(IMG_SIZE, IMG_SIZE, 1))

    x = layers.Conv2D(32, 3, padding="same", activation="relu")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D()(x)

    x = layers.Conv2D(64, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D()(x)

    x = layers.Conv2D(128, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D()(x)

    x = layers.Conv2D(256, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.GlobalAveragePooling2D()(x)

    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation="relu")(x)

    output = layers.Dense(1, activation="linear", name="wind_speed_knots")(x)

    model = models.Model(inputs, output)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="mse",
        metrics=["mae", tf.keras.metrics.RootMeanSquaredError(name="rmse")],
    )
    return model


model = build_model()
model.summary()

# ---------------------------------------------------------------------------
# 4. Train
# ---------------------------------------------------------------------------
cb = [
    callbacks.ReduceLROnPlateau(monitor="val_rmse", factor=0.5, patience=3, min_lr=1e-6, verbose=1),
    callbacks.EarlyStopping(monitor="val_rmse", patience=7, restore_best_weights=True, verbose=1),
    callbacks.ModelCheckpoint(MODEL_OUT, monitor="val_rmse", save_best_only=True, verbose=1),
]

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=cb,
)

print("\n" + "=" * 60)
print(f"Best model saved to : {MODEL_OUT}")
print(f"Best val RMSE (knots): {min(history.history['val_rmse']):.2f}")
print(f"Best val MAE  (knots): {min(history.history['val_mae']):.2f}")
print("=" * 60)
