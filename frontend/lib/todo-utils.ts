import type { HistoryItem, TodoItem } from "./todo-api";

export const CORRUPTED_TITLE_FALLBACK = "历史任务内容异常";

export function normalizeTitle(value: string) {
  if (!value) {
    return "";
  }

  try {
    const bytes = Uint8Array.from([...value].map((char) => char.charCodeAt(0)));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    if (/\p{Script=Han}/u.test(decoded)) {
      return decoded;
    }
  } catch {
    return value;
  }

  return value;
}

export function isCorruptedTitle(value: string) {
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

  if ((trimmed.match(/\?/g) ?? []).length >= 3) {
    return true;
  }

  return false;
}

export function getDisplayTitle(value: string) {
  const normalized = normalizeTitle(value);
  return isCorruptedTitle(normalized) ? CORRUPTED_TITLE_FALLBACK : normalized;
}

export function getEditableTitle(value: string) {
  const normalized = normalizeTitle(value);
  return isCorruptedTitle(normalized) ? "" : normalized;
}

export function hydrateTodos(todos: TodoItem[]) {
  return todos.map((todo) => ({
    ...todo,
    title: getDisplayTitle(todo.title),
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
