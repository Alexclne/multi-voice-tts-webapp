import os
import uuid
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import edge_tts

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

TMP_DIR = "/tmp"


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/voices")
async def get_voices():
    voices = await edge_tts.list_voices()

    result = []
    for v in voices:
        result.append({
            "name": v["Name"],
            "short_name": v["ShortName"],
            "locale": v["Locale"],
            "gender": v["Gender"],
            "style_list": v.get("StyleList", [])
        })

    return result


@app.post("/generate")
async def generate_audio(request: Request):
    data = await request.json()
    text = data.get("text", "").strip()
    voice = data.get("voice", None)
    speed = float(data.get("speed", 1.0))
    pitch = float(data.get("pitch", 0.0))

    if not text:
        return JSONResponse({"error": "Testo mancante"}, status_code=400)
    if not voice:
        return JSONResponse({"error": "Voce mancante"}, status_code=400)

    rate_percent = int((speed - 1.0) * 100)
    rate_str = f"{rate_percent:+d}%"

    pitch_hz = int(pitch * 20)
    pitch_str = f"{pitch_hz:+d}Hz"

    file_id = uuid.uuid4().hex
    output_path = os.path.join(TMP_DIR, f"tts_{file_id}.mp3")

    communicate = edge_tts.Communicate(text, voice, rate=rate_str, pitch=pitch_str)
    await communicate.save(output_path)

    return FileResponse(
        output_path,
        media_type="audio/mpeg",
        filename="tts_output_audio.mp3"
    )
