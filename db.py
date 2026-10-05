from pydantic import BaseModel
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Mapped, mapped_column
from sqlalchemy import create_engine

engine = create_engine("sqlite:///sql_lite.db")
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

class WindowORM(Base):
    __tablename__ = "windows"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] 
    body: Mapped[str]
    
class WindowGetSchema(BaseModel):
    title: str
    body: str | None
    
class WindowCreateSchema(BaseModel):
    title: str
    body: str | None
    
class WindowEditSchema(BaseModel):
    id: int
    title: str | None
    body: str | None
    
class WindowDeleteSchema(BaseModel):
    id: int