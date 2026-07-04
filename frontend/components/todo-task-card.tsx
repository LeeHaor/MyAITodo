"use client";

import type { TodoItem } from "../lib/todo-api";

type TodoTaskCardProps = {
  todo: TodoItem;
  isBusy: boolean;
  isEditing: boolean;
  editingTitle: string;
  onEditingTitleChange: (value: string) => void;
  onToggle: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onDelete: () => void;
  formatTodoTime: (value: string) => string;
};

export function TodoTaskCard({
  todo,
  isBusy,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onToggle,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDelete,
  formatTodoTime,
}: TodoTaskCardProps) {
  return (
    <li className={`task-row ${todo.is_completed ? "task-row-done" : ""}`}>
      <button
        className={`task-check ${todo.is_completed ? "task-check-done" : ""}`}
        type="button"
        aria-label={todo.is_completed ? "将任务标记为待处理" : "将任务标记为已完成"}
        disabled={isBusy}
        onClick={onToggle}
      />

      <div className="task-content">
        {isEditing ? (
          <div className="task-edit-row">
            <input
              className="task-edit-input"
              value={editingTitle}
              onChange={(event) => onEditingTitleChange(event.target.value)}
              disabled={isBusy}
              placeholder="更新任务标题"
            />
            <div className="task-actions">
              <button
                className="task-action-button task-action-primary"
                type="button"
                disabled={isBusy}
                onClick={onSaveEditing}
              >
                保存
              </button>
              <button
                className="task-action-button"
                type="button"
                disabled={isBusy}
                onClick={onCancelEditing}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="task-module-head">
              <div className="task-title-block">
                <p className={`task-title ${todo.is_completed ? "task-title-done" : ""}`}>
                  {todo.title}
                </p>
                <div className="task-module-meta">
                  <span className="task-meta-chip">任务 #{todo.id}</span>
                  <span className="task-meta-chip">创建于 {formatTodoTime(todo.created_at)}</span>
                </div>
              </div>

              <span className={`task-state ${todo.is_completed ? "task-state-done" : ""}`}>
                {todo.is_completed ? "已完成" : "待处理"}
              </span>
            </div>

            <div className="task-actions">
              <button
                className="task-action-button"
                type="button"
                disabled={isBusy}
                onClick={onStartEditing}
              >
                编辑
              </button>
              <button
                className="task-action-button task-action-danger"
                type="button"
                disabled={isBusy}
                onClick={onDelete}
              >
                删除
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
