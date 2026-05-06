from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from partimark_app.core.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={
        "ssl_ca": settings.ssl_ca,
    },
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()



def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
