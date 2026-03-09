import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from huggingface_hub import InferenceClient

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

MODEL_ID = "Qwen/Qwen3.5-35B-A3B"


def get_client():
    token = os.environ.get("HF_TOKEN")
    if not token:
        raise RuntimeError("HF_TOKEN environment variable is not set")
    return InferenceClient(
        provider="novita",
        api_key=token,
    )


@app.get("/", response_class=HTMLResponse)
async def index():
    with open("static/index.html") as f:
        return f.read()


@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    messages = body.get("messages", [])

    client = get_client()

    def generate():
        stream = client.chat_completion(
            model=MODEL_ID,
            messages=messages,
            max_tokens=2048,
            stream=True,
        )
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    return StreamingResponse(generate(), media_type="text/plain")
