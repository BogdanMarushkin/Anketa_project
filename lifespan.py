from contextlib import asynccontextmanager
from db import Base, engine
from main import FastAPI

@asynccontextmanager
async def lifespan(_: FastAPI):
    print("Полетели масса")
    Base.metadata.create_all(bind=engine)
    yield
    print("Финиш")