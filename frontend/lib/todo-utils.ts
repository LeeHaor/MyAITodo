import type { HistoryItem, TodoItem } from "./todo-api";

export const CORRUPTED_TITLE_FALLBACK = "历史任务内容异常";

function looksLikeBrokenText(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  if (trimmed.includes("锟")) {
    return true;
  }

  if (/^\?+$/.test(trimmed)) {
    return true;
  }

  if (trimmed.includes("�")) {
    return true;
  }

  return /[Ã¤Ã¥Ã¦Ã§Ã©Ã¨Ã¬Ã±Ã¶Ã¼]/.test(trimmed);
}

export function getDisplayTitle(value: string) {
  return looksLikeBrokenText(value) ? CORRUPTED_TITLE_FALLBACK : value.trim();
}

export function getEditableTitle(value: string) {
  return looksLikeBrokenText(value) ? "" : value.trim();
}

export function hydrateTodos(todos: TodoItem[]) {
  return todos.map((todo) => ({
    ...todo,
    title: getDisplayTitle(todo.title),
  }));
}

export function hydrateHistory(items: HistoryItem[]) {
  return items.map((item) => ({
    ...item,
    title_snapshot: getDisplayTitle(item.title_snapshot),
  }));
}

export function formatTodoTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHistoryTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "早上好";
  }

  if (hour < 18) {
    return "下午好";
  }

  return "晚上好";
}

export function getHistoryActionLabel(action: HistoryItem["action"]) {
  switch (action) {
    case "created":
      return "创建任务";
    case "updated":
      return "修改标题";
    case "completed":
      return "标记完成";
    case "reopened":
      return "恢复待办";
    case "deleted":
      return "删除任务";
    default:
      return "任务操作";
  }
}
