"""align schema to v3

Revision ID: c704da00c07c
Revises: ec77c976dae9
Create Date: 2026-04-21 17:26:25.749828

"""
from typing import Sequence, Union

from alembic import op

import sqlalchemy as sa

# revision identifiers, used by Alembic.

revision: str = "c704da00c07c"

down_revision: Union[str, None] = "ec77c976dae9"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:

    # ------------------------------------------------------------------

    # 1. USERS: align role enum and password column name

    # ------------------------------------------------------------------

    # rename hashed_password column only if your old column was different.

    # Since you already decided to KEEP Karl's hashed_password name,

    # we do NOT rename it here.

    # Replace role enum/constraint by recreating the column type as String first,

    # then back to Enum('UC', 'tutor').

    # This approach is safer across SQLite/MySQL/Postgres differences.

    with op.batch_alter_table("users", schema=None) as batch_op:

        batch_op.alter_column(

            "role",

            existing_type=sa.String(length=50),

            type_=sa.String(length=20),

            existing_nullable=False,

        )

    # ------------------------------------------------------------------

    # 2. STUDENTS: align status enum to active / withdrawn

    # ------------------------------------------------------------------

    # First convert any old values if they exist in the DB.

    # Safe mappings from older Karl values:

    # enrolled -> active

    # dropped -> withdrawn

    # exempted -> withdrawn

    op.execute(

        """

        UPDATE students

        SET status = 'active'

        WHERE status IN ('enrolled', 'ENROLLED')

        """

    )

    op.execute(

        """

        UPDATE students

        SET status = 'withdrawn'

        WHERE status IN ('dropped', 'DROPPED', 'exempted', 'EXEMPTED')

        """

    )

    with op.batch_alter_table("students", schema=None) as batch_op:

        batch_op.alter_column(

            "preferred_name",

            existing_type=sa.String(length=100),

            nullable=True,

        )

        batch_op.alter_column(

            "image_url",

            existing_type=sa.String(length=500),

            nullable=True,

        )

        batch_op.alter_column(

            "status",

            existing_type=sa.String(length=50),

            type_=sa.Enum("active", "withdrawn", name="student_status"),

            existing_nullable=False,

            nullable=False,

        )

    # ------------------------------------------------------------------

    # 3. WORKSHOPS: tutor_user_id becomes nullable

    # ------------------------------------------------------------------

    with op.batch_alter_table("workshops", schema=None) as batch_op:

        batch_op.alter_column(

            "tutor_user_id",

            existing_type=sa.String(length=50),

            nullable=True,

        )

    # ------------------------------------------------------------------

    # 4. CREATE NEW TABLE: system_config

    # ------------------------------------------------------------------

    op.create_table(

        "system_config",

        sa.Column("config_id", sa.Integer(), autoincrement=True, nullable=False),

        sa.Column("coordinator_user_id", sa.String(length=50), nullable=False),

        sa.Column("max_weekly_score", sa.Integer(), nullable=False, server_default="3"),

        sa.Column("total_participation_points", sa.Integer(), nullable=False, server_default="0"),

        sa.Column("is_configured", sa.Boolean(), nullable=False, server_default=sa.false()),

        sa.Column("week6_lock_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),

        sa.Column("week6_locked_at", sa.DateTime(timezone=True), nullable=True),

        sa.Column("week12_lock_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),

        sa.Column("week12_locked_at", sa.DateTime(timezone=True), nullable=True),

        sa.Column("updated_by_user_id", sa.String(length=50), nullable=True),

        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),

        sa.ForeignKeyConstraint(["coordinator_user_id"], ["users.user_id"], ondelete="RESTRICT"),

        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.user_id"], ondelete="RESTRICT"),

        sa.PrimaryKeyConstraint("config_id"),

    )

    op.create_index(op.f("ix_system_config_coordinator_user_id"), "system_config", ["coordinator_user_id"], unique=False)

    op.create_index(op.f("ix_system_config_updated_by_user_id"), "system_config", ["updated_by_user_id"], unique=False)

    # ------------------------------------------------------------------

    # 5. CREATE NEW TABLE: enabled_weeks

    # ------------------------------------------------------------------

    op.create_table(

        "enabled_weeks",

        sa.Column("week_number", sa.Integer(), nullable=False),

        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),

        sa.PrimaryKeyConstraint("week_number"),

    )

    # ------------------------------------------------------------------

    # 6. CREATE NEW TABLE: student_workshop_memberships

    # ------------------------------------------------------------------

    op.create_table(

        "student_workshop_memberships",

        sa.Column("membership_id", sa.Integer(), autoincrement=True, nullable=False),

        sa.Column("student_id", sa.String(length=20), nullable=False),

        sa.Column("workshop_id", sa.Integer(), nullable=False),

        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.true()),

        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),

        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),

        sa.Column("created_by_user_id", sa.String(length=50), nullable=True),

        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),

        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="RESTRICT"),

        sa.ForeignKeyConstraint(["workshop_id"], ["workshops.workshop_id"], ondelete="RESTRICT"),

        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.user_id"], ondelete="RESTRICT"),

        sa.PrimaryKeyConstraint("membership_id"),

    )

    op.create_index(op.f("ix_student_workshop_memberships_student_id"), "student_workshop_memberships", ["student_id"], unique=False)

    op.create_index(op.f("ix_student_workshop_memberships_workshop_id"), "student_workshop_memberships", ["workshop_id"], unique=False)

    op.create_index(op.f("ix_student_workshop_memberships_created_by_user_id"), "student_workshop_memberships", ["created_by_user_id"], unique=False)

    # ------------------------------------------------------------------

    # 7. CREATE NEW TABLE: audit_logs

    # ------------------------------------------------------------------

    op.create_table(

        "audit_logs",

        sa.Column("audit_log_id", sa.Integer(), autoincrement=True, nullable=False),

        sa.Column("user_id", sa.String(length=50), nullable=False),

        sa.Column("student_id", sa.String(length=20), nullable=True),

        sa.Column("workshop_id", sa.Integer(), nullable=True),

        sa.Column("week_number", sa.Integer(), nullable=True),

        sa.Column("action_type", sa.String(length=50), nullable=False),

        sa.Column("old_value", sa.Text(), nullable=True),

        sa.Column("new_value", sa.Text(), nullable=True),

        sa.Column("description", sa.Text(), nullable=False),

        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),

        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="RESTRICT"),

        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="RESTRICT"),

        sa.ForeignKeyConstraint(["workshop_id"], ["workshops.workshop_id"], ondelete="RESTRICT"),

        sa.PrimaryKeyConstraint("audit_log_id"),

    )

    op.create_index(op.f("ix_audit_logs_user_id"), "audit_logs", ["user_id"], unique=False)

    op.create_index(op.f("ix_audit_logs_student_id"), "audit_logs", ["student_id"], unique=False)

    op.create_index(op.f("ix_audit_logs_workshop_id"), "audit_logs", ["workshop_id"], unique=False)

    # ------------------------------------------------------------------

    # 8. PARTICIPATION_MARKS: align to V3

    # ------------------------------------------------------------------

    with op.batch_alter_table("participation_marks", schema=None) as batch_op:

        # If an old unique constraint exists on a different combination,

        # you may need to drop it manually depending on the actual DB state.

        # Leave as-is if none exists.

        pass

    # Add FK to enabled_weeks.week_number + constraints

    with op.batch_alter_table("participation_marks", schema=None) as batch_op:

        batch_op.create_foreign_key(

            "fk_participation_marks_week_number_enabled_weeks",

            "enabled_weeks",

            ["week_number"],

            ["week_number"],

            ondelete="RESTRICT",

        )

        batch_op.create_unique_constraint(

            "uq_student_week",

            ["student_id", "week_number"],

        )

        batch_op.create_check_constraint(

            "ck_participation_marks_score_range",

            "score >= 0 AND score <= 3",

        )



    # ------------------------------------------------------------------

    # 9. OPTIONAL seed: create one default current config row if table empty

    # ------------------------------------------------------------------

    # Only do this if you already have one UC user in users.

    # This keeps the app closer to V3 expectation (single current config row).

    # If you don't want seed data in migration, remove this block.

    op.execute(

        """

        INSERT INTO system_config (

            coordinator_user_id,

            max_weekly_score,

            total_participation_points,

            is_configured,

            week6_lock_enabled,

            week12_lock_enabled,

            updated_at

        )

        SELECT

            user_id,

            3,

            0,

            0,

            0,

            0,

            CURRENT_TIMESTAMP

        FROM users

        WHERE role = 'UC'

        ORDER BY created_at

        LIMIT 1

        """

    )

def downgrade() -> None:

    # ------------------------------------------------------------------

    # Reverse 9. optional seed row

    # ------------------------------------------------------------------

    op.execute("DELETE FROM system_config")

    # ------------------------------------------------------------------

    # Reverse 8. participation_marks changes

    # ------------------------------------------------------------------

    with op.batch_alter_table("participation_marks", schema=None) as batch_op:

        batch_op.drop_constraint("ck_participation_marks_score_range", type_="check")

        batch_op.drop_constraint("uq_student_week", type_="unique")

        batch_op.drop_constraint("fk_participation_marks_week_number_enabled_weeks", type_="foreignkey")

    # ------------------------------------------------------------------

    # Reverse 7. audit_logs

    # ------------------------------------------------------------------

    op.drop_index(op.f("ix_audit_logs_workshop_id"), table_name="audit_logs")

    op.drop_index(op.f("ix_audit_logs_student_id"), table_name="audit_logs")

    op.drop_index(op.f("ix_audit_logs_user_id"), table_name="audit_logs")

    op.drop_table("audit_logs")

    # ------------------------------------------------------------------

    # Reverse 6. student_workshop_memberships

    # ------------------------------------------------------------------

    op.drop_index(op.f("ix_student_workshop_memberships_created_by_user_id"), table_name="student_workshop_memberships")

    op.drop_index(op.f("ix_student_workshop_memberships_workshop_id"), table_name="student_workshop_memberships")

    op.drop_index(op.f("ix_student_workshop_memberships_student_id"), table_name="student_workshop_memberships")

    op.drop_table("student_workshop_memberships")

    # ------------------------------------------------------------------

    # Reverse 5. enabled_weeks

    # ------------------------------------------------------------------

    op.drop_table("enabled_weeks")

    # ------------------------------------------------------------------

    # Reverse 4. system_config

    # ------------------------------------------------------------------

    op.drop_index(op.f("ix_system_config_updated_by_user_id"), table_name="system_config")

    op.drop_index(op.f("ix_system_config_coordinator_user_id"), table_name="system_config")

    op.drop_table("system_config")

    # ------------------------------------------------------------------

    # Reverse 3. workshops tutor_user_id nullable change

    # ------------------------------------------------------------------

    with op.batch_alter_table("workshops", schema=None) as batch_op:

        batch_op.alter_column(

            "tutor_user_id",

            existing_type=sa.String(length=50),

            nullable=False,

        )

    # ------------------------------------------------------------------

    # Reverse 2. students status back to old looser string

    # ------------------------------------------------------------------

    with op.batch_alter_table("students", schema=None) as batch_op:

        batch_op.alter_column(

            "status",

            existing_type=sa.Enum("active", "withdrawn", name="student_status"),

            type_=sa.String(length=50),

            existing_nullable=False,

            nullable=False,

        )

    # Convert values back to the older likely defaults if needed

    op.execute(

        """

        UPDATE students

        SET status = 'enrolled'

        WHERE status = 'active'

        """

    )

    op.execute(

        """

        UPDATE students

        SET status = 'dropped'

        WHERE status = 'withdrawn'

        """

    )

    # Keep preferred_name / image_url nullable on downgrade too unless you

    # know the old schema strictly required non-null.

    # That is safer than forcing old constraints that may fail on existing rows.

    # ------------------------------------------------------------------

    # Reverse 1. users role back to generic string

    # ------------------------------------------------------------------

    with op.batch_alter_table("users", schema=None) as batch_op:

        batch_op.alter_column(

            "role",

            existing_type=sa.String(length=20),

            type_=sa.String(length=50),

            existing_nullable=False,

        )