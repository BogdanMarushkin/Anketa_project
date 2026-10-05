from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends
from lifespan import lifespan
from session_on_db import get_db
from db import WindowEditSchema, WindowGetSchema, WindowORM, WindowCreateSchema
from sqlalchemy.orm import Session
from sqlalchemy import select 

app = FastAPI(lifespan=lifespan)

app.add_middleware (
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/all_window")
def get_all_window(db: Session = Depends(get_db)) -> list[WindowGetSchema]:
    query = db.execute(select(WindowORM)).scalars().all()
    return query

@app.post("/create_window")
def create_window(payload: WindowCreateSchema, db: Session = Depends(get_db)):
    new_window = WindowORM(title=payload.title, body=payload.body)
    db.add(new_window)
    db.commit()
    db.refresh(new_window)
    return new_window

@app.patch("/edit_window/{id}")
def edit_window(id: int, payload: WindowEditSchema, db: Session = Depends(get_db)):
    edit_window = db.get(WindowORM, id)
    
    changes = payload.model_dump(exclude_unset=True)
    
    
    
    