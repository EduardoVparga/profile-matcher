from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Monta carpeta "static" para CSS, JS, imágenes, etc.
app.mount("/static", StaticFiles(directory="./app/static"), name="static")

# Usa Jinja2 para renderizar HTML
templates = Jinja2Templates(directory="./app/templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
