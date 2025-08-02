from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")

class TextBatch(BaseModel):
    texts: list[str]

@app.post("/embed")
async def embed(batch: TextBatch):
    vectors = model.encode(batch.texts, show_progress_bar=False).tolist()
    return {"vectors": vectors}