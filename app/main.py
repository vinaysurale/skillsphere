from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import create_tables
from app.routers import auth, skills, portfolio, gap_engine, recommendations, market_index, simulator


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup."""
    create_tables()
    # Auto-seed if database is empty
    from app.database import SessionLocal
    from app.models.skill import Skill
    db = SessionLocal()
    if db.query(Skill).count() == 0:
        db.close()
        from seed_data import seed
        seed()
    else:
        db.close()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# ─── Static Files & Templates ────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "static")
templates_dir = os.path.join(os.path.dirname(__file__), "templates")

app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory=templates_dir)

# ─── API Routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(skills.router)
app.include_router(portfolio.router)
app.include_router(gap_engine.router)
app.include_router(recommendations.router)
app.include_router(market_index.router)
app.include_router(simulator.router)


# ─── Page Routes ──────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def landing_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request})


@app.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    return templates.TemplateResponse("auth/signup.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/portfolio", response_class=HTMLResponse)
async def portfolio_page(request: Request):
    return templates.TemplateResponse("portfolio.html", {"request": request})


@app.get("/gap-analysis", response_class=HTMLResponse)
async def gap_analysis_page(request: Request):
    return templates.TemplateResponse("gap-analysis.html", {"request": request})


@app.get("/onboarding", response_class=HTMLResponse)
async def onboarding_page(request: Request):
    return templates.TemplateResponse("onboarding.html", {"request": request})



@app.get("/market", response_class=HTMLResponse)
async def market_page(request: Request):
    return templates.TemplateResponse("market-index.html", {"request": request})


@app.get("/simulator", response_class=HTMLResponse)
async def simulator_page(request: Request):
    return templates.TemplateResponse("simulator.html", {"request": request})


@app.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})


@app.get("/demo", response_class=HTMLResponse)
async def demo_page(request: Request):
    """3D Theme Feature Demo Page"""
    return templates.TemplateResponse("demo.html", {"request": request})
