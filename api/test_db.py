import os
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Load environment variables from .env
load_dotenv()

# 2. Configure database connection settings (read from environment)
DB_USER = os.getenv("DB_USER", "")
DB_PASS = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "")
DB_NAME = os.getenv("DB_NAME", "")  # Example: partimark_db
SSL_CA = os.getenv("SSL_CA", "./certs/DigiCertGlobalRootG2.crt.pem")

# 3. Create connection string
# Note: Use mysql+mysqlconnector for better SSL compatibility
DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

# 4. Initialize engine with SSL configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "ssl_ca": SSL_CA
    }
)

# 5. Define ORM model mapped to the test_users table
Base = declarative_base()

class User(Base):
    __tablename__ = 'test_users'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(100))

# 6. Test connection and fetch data
Session = sessionmaker(bind=engine)
session = Session()

try:
    print("--- Connecting to Azure MySQL... ---")
    users = session.query(User).all()
    
    print(f"Success! Found {len(users)} users:")
    for user in users:
        print(f"ID: {user.id} | Name: {user.name} | Email: {user.email}")
        
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    session.close()