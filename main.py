from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, status
from lifespan import lifespan
from session_on_db import get_db
from db import (
    AnketaORM,
    WindowORM,
    AnketaGetSchema,
    AnketaCreateSchema,
    WindowGetSchema,
    WindowCreateSchema,
    WindowEditSchema,
    ImportAnketaSchema,
)
from sqlalchemy.orm import Session
from sqlalchemy import select 

app = FastAPI(lifespan=lifespan)

app.add_middleware (
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"]
)

def get_anketa_or_404(db: Session, anketa_id: int) -> AnketaORM:
    anketa = db.get(AnketaORM, anketa_id)
    if anketa is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anketa not found")
    return anketa

def get_window_or_404(db: Session, window_id: int) -> WindowORM:
    window = db.get(WindowORM, window_id)
    if window is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Window not found")
    return window

# --- Анкеты ---

@app.get("/all_anketa")
def get_all_anketa(db: Session = Depends(get_db)) -> list[AnketaGetSchema]:
    return db.execute(select(AnketaORM)).scalars().all()

@app.post("/create_anketa")
def create_anketa(payload: AnketaCreateSchema, db: Session = Depends(get_db)) -> AnketaGetSchema:
    anketa = AnketaORM(title=payload.title)
    db.add(anketa)
    db.commit()
    db.refresh(anketa)
    return anketa

@app.delete("/delete_anketa/{anketa_id}")
def delete_anketa(anketa_id: int, db: Session = Depends(get_db)):
    anketa = get_anketa_or_404(db, anketa_id)
    db.delete(anketa)
    db.commit()
    return {"message": "Anketa deleted successfully"}

@app.post("/import_anketas")
def import_anketas(payload: list[ImportAnketaSchema], db: Session = Depends(get_db)) -> list[AnketaGetSchema]:
    created = []
    for item in payload:
        anketa = AnketaORM(title=item.title)
        for window in item.windows:
            anketa.windows.append(WindowORM(title=window.title, body=window.body))
        db.add(anketa)
        created.append(anketa)
    db.commit()
    for anketa in created:
        db.refresh(anketa)
    return created

# --- Окна ---

@app.post("/create_window")
def create_window(payload: WindowCreateSchema, db: Session = Depends(get_db)) -> WindowGetSchema:
    get_anketa_or_404(db, payload.anketa_id)
    new_window = WindowORM(anketa_id=payload.anketa_id, title=payload.title, body=payload.body)
    db.add(new_window)
    db.commit()
    db.refresh(new_window)
    return new_window

@app.patch("/edit_window/{window_id}")
def edit_window(window_id: int, payload: WindowEditSchema, db: Session = Depends(get_db)) -> WindowGetSchema:
    window = get_window_or_404(db, window_id)

    changes = payload.model_dump(exclude_unset=True)
    if changes.get("title") is not None:
        window.title = changes["title"]

    if changes.get("body") is not None:
        window.body = changes["body"]

    db.commit()
    db.refresh(window)
    return window

@app.delete("/delete_window/{window_id}")
def delete_window(window_id: int, db: Session = Depends(get_db)):
    window = get_window_or_404(db, window_id)
    db.delete(window)
    db.commit()
    return {"message": "Window deleted successfully"}