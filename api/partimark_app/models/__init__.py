from .users import User
from .marks import ParticipationMark
from .students import Student
from .workshops import Workshop

# Eagerly load all models so that SQLAlchemy can establish relationships correctly
__all__ = [
    "User",
    "ParticipationMark",
    "Student",
    "Workshop"
]
