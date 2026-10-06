import os

from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Mapped, mapped_column, relationship
from sqlalchemy import create_engine, ForeignKey

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///sql_lite.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

class AnketaORM(Base):
    __tablename__ = "anketas"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    windows: Mapped[list["WindowORM"]] = relationship(
        back_populates="anketa",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

class WindowORM(Base):
    __tablename__ = "windows"

    id: Mapped[int] = mapped_column(primary_key=True)
    anketa_id: Mapped[int] = mapped_column(ForeignKey("anketas.id"))
    title: Mapped[str]
    body: Mapped[str | None]
    anketa: Mapped["AnketaORM"] = relationship(back_populates="windows")

# --- Схемы анкет ---

class AnketaGetSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    windows: list["WindowGetSchema"] = []

class AnketaCreateSchema(BaseModel):
    title: str

# --- Схемы окон ---

class WindowGetSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str | None

class WindowCreateSchema(BaseModel):
    anketa_id: int
    title: str
    body: str | None

class WindowEditSchema(BaseModel):
    title: str | None
    body: str | None

# --- Схемы импорта из файла ---

class ImportWindowSchema(BaseModel):
    title: str
    body: str | None = None

class ImportAnketaSchema(BaseModel):
    title: str
    windows: list[ImportWindowSchema] = []