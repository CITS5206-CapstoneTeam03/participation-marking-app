import os
import sys
from datetime import datetime

import bcrypt

# Add api directory to sys.path to allow importing from partimark_app.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from partimark_app.db.db import SessionLocal
from partimark_app.models import (
    AuditLog,
    EnabledWeek,
    ParticipationMark,
    Student,
    StudentStatus,
    StudentWorkshopMembership,
    SystemConfig,
    User,
    UserRole,
    Workshop,
)

PASSWORD = "password123"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed() -> None:
    db = SessionLocal()

    try:
        print("Clearing existing data...")
        db.query(AuditLog).delete()
        db.query(ParticipationMark).delete()
        db.query(StudentWorkshopMembership).delete()
        db.query(EnabledWeek).delete()
        db.query(Workshop).delete()
        db.query(SystemConfig).delete()
        db.query(Student).delete()
        db.query(User).delete()
        db.commit()

        print("Creating coordinator and tutor users...")
        coordinator = User(
            email="coordinator@test.com",
            hashed_password=hash_password(PASSWORD),
            first_name="Casey",
            last_name="Coordinator",
            display_name="Casey Coordinator",
            role=UserRole.UC,
            is_active=True,
        )
        tutor = User(
            email="tutor@test.com",
            hashed_password=hash_password(PASSWORD),
            first_name="Test",
            last_name="Tutor",
            display_name="Test Tutor",
            role=UserRole.TUTOR,
            is_active=True,
        )
        tutor_two = User(
            email="alex.tutor@test.com",
            hashed_password=hash_password(PASSWORD),
            first_name="Alex",
            last_name="Tutor",
            display_name="Alex Tutor",
            role=UserRole.TUTOR,
            is_active=True,
        )
        tutor_three = User(
            email="jamie.tutor@test.com",
            hashed_password=hash_password(PASSWORD),
            first_name="Jamie",
            last_name="Tutor",
            display_name="Jamie Tutor",
            role=UserRole.TUTOR,
            is_active=True,
        )
        db.add_all([coordinator, tutor, tutor_two, tutor_three])
        db.commit()

        print("Creating SystemConfig...")
        config = SystemConfig(
            coordinator_user_id=coordinator.user_id,
            max_weekly_score=3,
            total_participation_points=15,
            is_configured=True,
            updated_by_user_id=coordinator.user_id,
        )
        db.add(config)
        db.commit()

        print("Creating 5 EnabledWeeks...")
        weeks = []
        for week_number in [1, 3, 5, 7, 9]:
            week = EnabledWeek(week_number=week_number)
            weeks.append(week)
            db.add(week)
        db.commit()

        print("Creating 4 Workshops...")
        workshops = [
            Workshop(workshop_name="Workshop 1 - Monday 9am", tutor_user_id=tutor.user_id),
            Workshop(workshop_name="Workshop 2 - Tuesday 11am", tutor_user_id=tutor.user_id),
            Workshop(workshop_name="Workshop 3 - Wednesday 2pm", tutor_user_id=tutor_two.user_id),
            Workshop(workshop_name="Workshop 4 - Friday 10am", tutor_user_id=tutor_three.user_id),
        ]
        db.add_all(workshops)
        db.commit()

        print("Creating 32 Students...")
        first_names = [
            "Avery", "Blair", "Charlie", "Dakota", "Emerson", "Finley", "Gray",
            "Harper", "Indigo", "Jordan", "Kai", "Logan", "Morgan", "Noah",
            "Oakley", "Parker", "Quinn", "Riley", "Sage", "Taylor", "Uma",
            "Vale", "Winter", "Xander", "Yael", "Zara", "Arden", "Bailey",
            "Cameron", "Drew", "Elliot", "Frankie",
        ]
        last_names = [
            "Nguyen", "Smith", "Patel", "Brown", "Wilson", "Singh", "Taylor",
            "Chen", "Martin", "Anderson", "Thomas", "Lee", "Walker", "Hall",
            "Allen", "Young", "King", "Wright", "Scott", "Green", "Baker",
            "Adams", "Nelson", "Hill", "Campbell", "Mitchell", "Roberts",
            "Carter", "Phillips", "Evans", "Turner", "Parker",
        ]
        students = []
        for index, (first_name, last_name) in enumerate(zip(first_names, last_names), start=1):
            student = Student(
                student_id=f"111111{index:02d}",
                first_name=first_name,
                last_name=last_name,
                preferred_name=first_name if index % 5 == 0 else None,
                email=f"111111{index:02d}@student.uwa.edu.au",
                status=StudentStatus.ACTIVE if index not in {12, 27} else StudentStatus.WITHDRAWN,
            )
            students.append(student)
            db.add(student)
        db.commit()

        print("Assigning 8 students to each workshop...")
        for index, student in enumerate(students):
            workshop = workshops[index // 8]
            membership = StudentWorkshopMembership(
                student_id=student.student_id,
                workshop_id=workshop.workshop_id,
                start_date=datetime.now(),
                created_by_user_id=coordinator.user_id,
            )
            db.add(membership)
        db.commit()

        print("Generating participation marks...")
        for student_index, student in enumerate(students):
            workshop = workshops[student_index // 8]
            for week_index, week in enumerate(weeks):
                if student.status == StudentStatus.WITHDRAWN or (student_index + week_index) % 7 == 0:
                    continue

                mark = ParticipationMark(
                    student_id=student.student_id,
                    workshop_id=workshop.workshop_id,
                    week_number=week.week_number,
                    score=(student_index + week_index) % 4,
                    marked_by_user_id=workshop.tutor_user_id,
                )
                db.add(mark)
        db.commit()

        print("Test data seeded successfully!")
        print(f"Coordinator login: coordinator@test.com / {PASSWORD}")
        print(f"Tutor login: tutor@test.com / {PASSWORD}")
        print(f"Additional tutor logins: alex.tutor@test.com, jamie.tutor@test.com / {PASSWORD}")
    except Exception as exc:
        print(f"Error seeding data: {exc}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
