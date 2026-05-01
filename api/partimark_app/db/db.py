from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from ..core.config import settings

# For local development, don't use SSL
connect_args = {}
if settings.db_host != "localhost":
    connect_args = {"ssl_ca": settings.ssl_ca}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()



def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
