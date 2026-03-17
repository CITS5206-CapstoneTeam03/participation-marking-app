import os
import sys

from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Get absolute path of the directory that contains db.py (the /api folder)
BASE_DIR = Path(__file__).resolve().parent

# Explicitly point to the .env file inside the /api directory
load_dotenv(dotenv_path=BASE_DIR / ".env")

DB_USER = os.getenv("DB_USER", "")
DB_PASS = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "")
DB_NAME = "partimark-staging" if "--reload" in sys.argv else os.getenv("DB_NAME", "")

# Normalize SSL_CA path so it works even when running from project root
# Assumes certs are located in /api/certs
SSL_CA_DEFAULT = str(BASE_DIR / "certs" / "DigiCertGlobalRootG2.crt.pem")
SSL_CA = os.getenv("SSL_CA", SSL_CA_DEFAULT)

DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "ssl_ca": SSL_CA,
    },
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


class User(Base):
    __tablename__ = "test_users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(100))


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
