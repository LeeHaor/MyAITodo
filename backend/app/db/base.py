from sqlalchemy import inspect, text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for ORM models."""


def ensure_schema() -> None:
    from app.db.session import engine

    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = inspector.get_table_names()

        if "todos" in tables:
            todo_columns = {column["name"] for column in inspector.get_columns("todos")}
            if "user_id" not in todo_columns:
                connection.execute(text("ALTER TABLE todos ADD COLUMN user_id INT NULL"))

            todo_indexes = {index["name"] for index in inspector.get_indexes("todos")}
            if "ix_todos_user_id" not in todo_indexes:
                connection.execute(text("CREATE INDEX ix_todos_user_id ON todos (user_id)"))


def create_tables() -> None:
    from app.db.session import engine
    from app.models import Todo, TodoHistory, User

    Todo
    TodoHistory
    User
    Base.metadata.create_all(bind=engine)
    ensure_schema()
