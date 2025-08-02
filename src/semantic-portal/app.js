// app.js
import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import PDFParser from 'pdf-parse';
import Tesseract from 'tesseract.js';
import Fuse from 'fuse.js';

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3000;

const EMBED_URL = 'http://localhost:8001/embed';
const CHROMA_URL = 'http://localhost:8002';

let fuseIndex = null;

// ——— Helpers —————————————————————————————————————————————

// Ensure a Chroma collection exists (silently ignores “already exists” errors)
async function ensureChromaCollection(name) {
  try {
    await fetch(`${CHROMA_URL}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch {}
}

// OCR an image buffer to text
async function ocrImage(buffer) {
  const { data: { text } } = await Tesseract.recognize(buffer);
  return text;
}

// Call local FastAPI embed service for an array of texts
async function embedTexts(texts) {
  const res = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });
  const { vectors } = await res.json();
  return vectors;
}

// Shorthand for embedding a single query
async function embedQuery(q) {
  const [vec] = await embedTexts([q]);
  return vec;
}

// Build or rebuild the Fuse.js index for /autocomplete
async function buildFuseIndex() {
  const res = await fetch(
    `${CHROMA_URL}/collections/knowledge_repo/get`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [] }), // empty → all documents
    }
  );
  const { documents, metadatas } = await res.json();
  const docs = documents.map((doc, i) => ({
    id: i,
    preview: metadatas[i].preview,
  }));
  fuseIndex = new Fuse(docs, { keys: ['preview'], threshold: 0.4 });
}

// ——— Routes —————————————————————————————————————————————————

// 1) Ingest endpoint: text / PDF / image → chunk → embed → Chroma
app.post('/ingest', upload.single('file'), async (req, res) => {
  await ensureChromaCollection('knowledge_repo');

  let rawText = '';
  const { mimetype, buffer } = req.file;

  if (mimetype.startsWith('image/')) {
    rawText = await ocrImage(buffer);
  } else if (mimetype === 'application/pdf') {
    const data = await PDFParser(buffer);
    rawText = data.text;
  } else {
    rawText = buffer.toString('utf-8');
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments([{ pageContent: rawText }]);
  const texts = docs.map(d => d.pageContent);
  const vectors = await embedTexts(texts);

  const ids = docs.map((_, i) => `${Date.now()}-${i}`);
  const metadatas = texts.map(txt => ({ preview: txt.slice(0, 200) }));

  await fetch(`${CHROMA_URL}/collections/knowledge_repo/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ids,
      embeddings: vectors,
      documents: texts,
      metadatas,
    }),
  });

  // Invalidate autocomplete index so new content is picked up
  fuseIndex = null;

  res.json({ status: 'ingested', count: texts.length });
});

// 2) Autocomplete: first‐100‐chars suggestions via Fuse.js
app.get('/autocomplete', async (req, res) => {
  if (!fuseIndex) await buildFuseIndex();
  const q = req.query.q || '';
  const matches = fuseIndex.search(q, { limit: 5 })
    .map(r => r.item.preview);
  res.json(matches);
});

// 3) Search: semantic search in Chroma + return text + score
app.get('/search', async (req, res) => {
  const q = req.query.q || '';
  const vector = await embedQuery(q);

  const response = await fetch(
    `${CHROMA_URL}/collections/knowledge_repo/query`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_embeddings: [vector],
        n_results: 10,
      }),
    }
  );
  const { documents, metadatas, distances } = await response.json();

  const results = documents.map((text, i) => ({
    text,
    score: distances[i],
    preview: metadatas[i].preview,
  }));
  res.json(results);
});

// ——— Start Server —————————————————————————————————————————
app.listen(PORT, () =>
  console.log(`Semantic-portal API listening on http://localhost:${PORT}`)
);