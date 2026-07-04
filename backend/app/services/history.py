from app.models.todo import Todo
from app.models.todo_history import TodoHistory
from app.models.user import User


def build_history_detail(action: str, todo: Todo) -> str:
    if action == "created":
        return "创建了任务"
    if action == "updated":
        return "更新了任务标题"
    if action == "completed":
        return "将任务标记为已完成"
    if action == "reopened":
        return "将任务恢复为待处理"
    if action == "deleted":
        return "删除了任务"
    return "执行了任务操作"


def create_history_record(user: User, todo: Todo, action: str) -> TodoHistory:
    return TodoHistory(
        user_id=user.id,
        todo_id=todo.id,
        action=action,
        title_snapshot=todo.title,
        detail=build_history_detail(action, todo),
    )
