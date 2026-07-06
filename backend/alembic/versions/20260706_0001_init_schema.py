"""init schema

Revision ID: 20260706_0001
Revises:
Create Date: 2026-07-06 00:00:01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260706_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("bio", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Asia/Shanghai"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "todo_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("todo_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("title_snapshot", sa.String(length=255), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_todo_history_id"), "todo_history", ["id"], unique=False)
    op.create_index(op.f("ix_todo_history_todo_id"), "todo_history", ["todo_id"], unique=False)
    op.create_index(op.f("ix_todo_history_user_id"), "todo_history", ["user_id"], unique=False)

    op.create_table(
        "todos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_todos_id"), "todos", ["id"], unique=False)
    op.create_index(op.f("ix_todos_user_id"), "todos", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_todos_user_id"), table_name="todos")
    op.drop_index(op.f("ix_todos_id"), table_name="todos")
    op.drop_table("todos")

    op.drop_index(op.f("ix_todo_history_user_id"), table_name="todo_history")
    op.drop_index(op.f("ix_todo_history_todo_id"), table_name="todo_history")
    op.drop_index(op.f("ix_todo_history_id"), table_name="todo_history")
    op.drop_table("todo_history")

    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
