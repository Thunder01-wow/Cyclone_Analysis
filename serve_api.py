from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Cyclone Analysis API is running"}
