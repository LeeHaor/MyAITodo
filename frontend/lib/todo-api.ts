const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export const authStorageKey = "myaitodo.access_token";

export type TodoItem = {
  id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
};

export type UserProfile = {
  id: number;
  email: string;
  display_name: string;
  bio: string;
  timezone: string;
  created_at: string;
};

export type HistoryItem = {
  id: number;
  todo_id: number | null;
  action: string;
  title_snapshot: string;
  detail: string;
  created_at: string;
};

type TodoListResponse = {
  items: TodoItem[];
};

type HistoryListResponse = {
  items: HistoryItem[];
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  user: UserProfile;
};

type ApiErrorPayload = {
  detail?: string;
  message?: string;
};

type RequestOptions = {
  token?: string | null;
  fallbackMessage: string;
} & RequestInit;

async function readErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data = (await response.json()) as ApiErrorPayload;
    return data.detail || data.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function requestJson<T>(path: string, options: RequestOptions): Promise<T> {
  const { token, fallbackMessage, headers, ...init } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackMessage));
  }

  return (await response.json()) as T;
}

async function requestNoContent(path: string, options: RequestOptions) {
  const { token, fallbackMessage, headers, ...init } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackMessage));
  }
}

export async function registerUser(payload: {
  email: string;
  password: string;
  display_name: string;
}) {
  return requestJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    fallbackMessage: "注册失败，请稍后重试。",
  });
}

export async function loginUser(payload: { email: string; password: string }) {
  return requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    fallbackMessage: "登录失败，请稍后重试。",
  });
}

export async function fetchMyProfile(token: string) {
  return requestJson<UserProfile>("/users/me", {
    method: "GET",
    token,
    fallbackMessage: "个人资料加载失败，请稍后重试。",
  });
}

export async function updateMyProfile(
  token: string,
  payload: { display_name: string; bio: string; timezone: string },
) {
  return requestJson<UserProfile>("/users/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
    fallbackMessage: "个人资料更新失败，请稍后重试。",
  });
}

export async function fetchTodos(token: string) {
  return requestJson<TodoListResponse>("/todos", {
    method: "GET",
    token,
    fallbackMessage: "任务加载失败，请刷新重试。",
  });
}

export async function createTodo(token: string, title: string) {
  return requestJson<TodoItem>("/todos", {
    method: "POST",
    token,
    body: JSON.stringify({ title }),
    fallbackMessage: "添加任务失败，请稍后重试。",
  });
}

export async function updateTodoStatus(token: string, todoId: number, isCompleted: boolean) {
  return requestJson<TodoItem>(`/todos/${todoId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ is_completed: isCompleted }),
    fallbackMessage: "任务状态更新失败，请稍后重试。",
  });
}

export async function updateTodoTitle(token: string, todoId: number, title: string) {
  return requestJson<TodoItem>(`/todos/${todoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ title }),
    fallbackMessage: "任务更新失败，请稍后重试。",
  });
}

export async function deleteTodo(token: string, todoId: number) {
  return requestNoContent(`/todos/${todoId}`, {
    method: "DELETE",
    token,
    fallbackMessage: "删除任务失败，请稍后重试。",
  });
}

export async function fetchHistory(token: string) {
  return requestJson<HistoryListResponse>("/history", {
    method: "GET",
    token,
    fallbackMessage: "历史记录加载失败，请刷新重试。",
  });
}
