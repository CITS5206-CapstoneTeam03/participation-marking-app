from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory (the /api folder) containing .env
ROOT_DIR = Path(__file__).resolve().parent.parent.parent

# App directory (the /api/partimark_app folder) containing certs
APP_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # Database Settings
    db_user: str
    db_pass: str
    db_host: str
    db_name: str = "partimark-staging"
    ssl_ca: str = str(APP_DIR / "certs" / "DigiCertGlobalRootG2.crt.pem")

    # FastAPI Application Settings
    app_name: str = "PartiMark API"
    version: str = "1.0.0"

    # PASETO / Auth Settings
    # Generate a strong secret with: python -c "import secrets; print(secrets.token_hex(32))"
    # Add PASETO_SECRET_KEY=<value> to your .env file.
    paseto_secret_key: str
    access_token_expire_minutes: int = 60  # 1 hour default
    
    # Admin Bootstrapping (Optional)
    # Used by the startup routine to provision an initial admin account if it doesn't exist
    initial_admin_email: str | None = None
    initial_admin_password: str | None = None
    admin_url: str | None = None
    
    # You can map env variables regardless of case
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        # Case insensitive parsing so DB_USER from .env maps to db_user
        case_sensitive=False 
    )

    @property
    def database_url(self) -> str:
        # Build the SQLAlchemy URL dynamically
        return f"mysql+mysqlconnector://{self.db_user}:{self.db_pass}@{self.db_host}/{self.db_name}"

# Instantiate the settings so they can be imported and used globally
settings = Settings()
