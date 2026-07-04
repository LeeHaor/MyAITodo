"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { TodoTaskCard } from "../components/todo-task-card";
import {
  authStorageKey,
  createTodo,
  deleteTodo,
  fetchHistory,
  fetchMyProfile,
  fetchTodos,
  loginUser,
  registerUser,
  type HistoryItem,
  type TodoItem,
  type UserProfile,
  updateMyProfile,
  updateTodoStatus,
  updateTodoTitle,
} from "../lib/todo-api";
import {
  CORRUPTED_TITLE_FALLBACK,
  formatHistoryTime,
  formatTodoTime,
  getEditableTitle,
  getGreeting,
  getHistoryActionLabel,
  hydrateTodos,
} from "../lib/todo-utils";

type FilterKey = "all" | "active" | "completed";
type AuthMode = "login" | "register";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileTimezone, setProfileTimezone] = useState("Asia/Shanghai");
  const [profileSaving, setProfileSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyTodoId, setBusyTodoId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(authStorageKey);
    setToken(null);
    setCurrentUser(null);
    setTodos([]);
    setHistoryItems([]);
    setProfileName("");
    setProfileBio("");
    setProfileTimezone("Asia/Shanghai");
    setTitle("");
    setEditingTodoId(null);
    setEditingTitle("");
    setError("");
    setSuccessMessage("");
    setAuthLoading(false);
    setIsLoading(false);
  }, []);

  const loadAuthedData = useCallback(
    async (nextToken: string) => {
      setIsLoading(true);
      setError("");

      try {
        const [user, todoResponse, historyResponse] = await Promise.all([
          fetchMyProfile(nextToken),
          fetchTodos(nextToken),
          fetchHistory(nextToken),
        ]);

        setCurrentUser(user);
        setProfileName(user.display_name);
        setProfileBio(user.bio);
        setProfileTimezone(user.timezone);
        setTodos(todoResponse.items);
        setHistoryItems(historyResponse.items);
      } catch (loadError) {
        clearSession();
        setAuthError(getErrorMessage(loadError, "登录状态已失效，请重新登录。"));
      } finally {
        setIsLoading(false);
        setAuthLoading(false);
      }
    },
    [clearSession],
  );

  useEffect(() => {
    const savedToken = window.localStorage.getItem(authStorageKey);
    if (!savedToken) {
      setAuthLoading(false);
      setIsLoading(false);
      return;
    }

    setToken(savedToken);
    void loadAuthedData(savedToken);
  }, [loadAuthedData]);

  const normalizedTodos = useMemo(() => hydrateTodos(todos), [todos]);

  const filteredTodos = useMemo(() => {
    if (activeFilter === "active") {
      return normalizedTodos.filter((todo) => !todo.is_completed);
    }

    if (activeFilter === "completed") {
      return normalizedTodos.filter((todo) => todo.is_completed);
    }

    return normalizedTodos;
  }, [activeFilter, normalizedTodos]);

  const completedCount = normalizedTodos.filter((todo) => todo.is_completed).length;
  const pendingCount = normalizedTodos.length - completedCount;
  const latestTodo = normalizedTodos[0];
  const progress =
    normalizedTodos.length === 0
      ? 0
      : Math.round((completedCount / normalizedTodos.length) * 100);

  async function reloadHistory(nextToken: string) {
    const historyResponse = await fetchHistory(nextToken);
    setHistoryItems(historyResponse.items);
  }

  function persistSession(nextToken: string) {
    window.localStorage.setItem(authStorageKey, nextToken);
    setToken(nextToken);
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = authEmail.trim();
    const password = authPassword.trim();
    const displayName = authDisplayName.trim();

    if (!email || !password || (authMode === "register" && !displayName)) {
      setAuthError("请完整填写当前表单。");
      return;
    }

    setAuthSubmitting(true);
    setAuthError("");

    try {
      const response =
        authMode === "login"
          ? await loginUser({ email, password })
          : await registerUser({ email, password, display_name: displayName });

      persistSession(response.access_token);
      setCurrentUser(response.user);
      setProfileName(response.user.display_name);
      setProfileBio(response.user.bio);
      setProfileTimezone(response.user.timezone);
      setAuthPassword("");
      setAuthDisplayName("");
      await loadAuthedData(response.access_token);
      setSuccessMessage(authMode === "login" ? "登录成功。" : "注册成功。");
    } catch (submitError) {
      setAuthError(getErrorMessage(submitError, "认证失败，请稍后重试。"));
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const nextDisplayName = profileName.trim();
    const nextTimezone = profileTimezone.trim();

    if (!nextDisplayName || !nextTimezone) {
      setError("昵称和时区不能为空。");
      setSuccessMessage("");
      return;
    }

    setProfileSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const user = await updateMyProfile(token, {
        display_name: nextDisplayName,
        bio: profileBio.trim(),
        timezone: nextTimezone,
      });
      setCurrentUser(user);
      setSuccessMessage("个人资料已更新。");
    } catch (profileError) {
      setError(getErrorMessage(profileError, "个人资料更新失败，请稍后重试。"));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("请输入任务标题。");
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const createdTodo = await createTodo(token, trimmedTitle);
      setTodos((currentTodos) => [createdTodo, ...currentTodos]);
      setTitle("");
      await reloadHistory(token);
      setSuccessMessage("添加成功。");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "添加任务失败，请稍后重试。"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleTodo(todo: TodoItem) {
    if (!token) {
      return;
    }

    setBusyTodoId(todo.id);
    setError("");
    setSuccessMessage("");

    try {
      const updatedTodo = await updateTodoStatus(token, todo.id, !todo.is_completed);
      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
        ),
      );
      await reloadHistory(token);
      setSuccessMessage(updatedTodo.is_completed ? "已标记为完成。" : "已恢复为待处理。");
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "任务状态更新失败，请稍后重试。"));
    } finally {
      setBusyTodoId(null);
    }
  }

  function startEditing(todo: TodoItem) {
    setEditingTodoId(todo.id);
    setEditingTitle(getEditableTitle(todo.title));
    setError("");
    setSuccessMessage("");
  }

  function cancelEditing() {
    setEditingTodoId(null);
    setEditingTitle("");
  }

  async function handleSaveTodo(todoId: number) {
    if (!token) {
      return;
    }

    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) {
      setError("任务标题不能为空。");
      return;
    }

    setBusyTodoId(todoId);
    setError("");
    setSuccessMessage("");

    try {
      const updatedTodo = await updateTodoTitle(token, todoId, trimmedTitle);
      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
        ),
      );
      cancelEditing();
      await reloadHistory(token);
      setSuccessMessage("更新成功。");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "任务更新失败，请稍后重试。"));
    } finally {
      setBusyTodoId(null);
    }
  }

  async function handleDeleteTodo(todoId: number) {
    if (!token) {
      return;
    }

    setBusyTodoId(todoId);
    setError("");
    setSuccessMessage("");

    try {
      await deleteTodo(token, todoId);
      setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== todoId));
      if (editingTodoId === todoId) {
        cancelEditing();
      }
      await reloadHistory(token);
      setSuccessMessage("删除成功。");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "删除任务失败，请稍后重试。"));
    } finally {
      setBusyTodoId(null);
    }
  }

  function getSectionTitle() {
    if (activeFilter === "active") {
      return "待处理任务";
    }

    if (activeFilter === "completed") {
      return "已完成任务";
    }

    return "全部任务";
  }

  function getEmptyStateTitle() {
    return activeFilter === "all" ? "当前还没有任务" : "当前分类为空";
  }

  function getEmptyStateDescription() {
    return activeFilter === "all"
      ? "从上方输入框开始，把今天第一件要做的事情加进来。"
      : "切换到其他分类查看任务，或者继续添加新的待办。";
  }

  const latestTitle = latestTodo?.title ?? "还没有任务";
  const latestTitleHint =
    latestTodo?.title === CORRUPTED_TITLE_FALLBACK
      ? "旧测试数据存在异常，请编辑后重新保存。"
      : latestTitle;

  if (authLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="auth-eyebrow">MyAITodo</p>
          <h1>正在恢复你的工作台</h1>
          <p className="auth-copy">请稍候，我们正在检查登录状态并同步你的任务数据。</p>
        </section>
      </main>
    );
  }

  if (!token || !currentUser) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark">AI</div>
            <div>
              <p className="brand-name">MyAITodo</p>
              <p className="brand-subtitle">个人开发者的 AI Todo 工作台</p>
            </div>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="认证模式">
            <button
              className={`auth-tab ${authMode === "login" ? "auth-tab-active" : ""}`}
              type="button"
              onClick={() => setAuthMode("login")}
            >
              登录
            </button>
            <button
              className={`auth-tab ${authMode === "register" ? "auth-tab-active" : ""}`}
              type="button"
              onClick={() => setAuthMode("register")}
            >
              注册
            </button>
          </div>

          <div className="auth-headline">
            <h1>{authMode === "login" ? "登录你的任务空间" : "创建你的个人任务空间"}</h1>
            <p className="auth-copy">
              {authMode === "login"
                ? "继续管理今天的待办、个人资料和任务历史。"
                : "注册后即可保存任务、编辑资料，并自动记录任务操作历史。"}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === "register" ? (
              <label className="auth-field">
                <span>昵称</span>
                <input
                  value={authDisplayName}
                  onChange={(event) => setAuthDisplayName(event.target.value)}
                  placeholder="输入你的显示名称"
                  disabled={authSubmitting}
                />
              </label>
            ) : null}

            <label className="auth-field">
              <span>邮箱</span>
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="name@example.com"
                disabled={authSubmitting}
              />
            </label>

            <label className="auth-field">
              <span>密码</span>
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="至少 6 位"
                disabled={authSubmitting}
              />
            </label>

            {authError ? <p className="auth-error">{authError}</p> : null}

            <button className="auth-submit" type="submit" disabled={authSubmitting}>
              {authSubmitting
                ? authMode === "login"
                  ? "登录中..."
                  : "注册中..."
                : authMode === "login"
                  ? "登录"
                  : "创建账户"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="todo-app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">AI</div>
          <div>
            <p className="brand-name">MyAITodo</p>
            <p className="brand-subtitle">个人任务与 AI 助手的简洁工作台</p>
          </div>
        </div>

        <section className="sidebar-card profile-card">
          <p className="sidebar-card-title">当前账户</p>
          <strong className="profile-name">{currentUser.display_name}</strong>
          <p className="profile-email">{currentUser.email}</p>
          <div className="profile-meta">
            <span>{currentUser.timezone}</span>
            <button className="logout-button" type="button" onClick={clearSession}>
              退出登录
            </button>
          </div>
        </section>

        <nav className="list-nav" aria-label="任务分类">
          <button
            className={`nav-item ${activeFilter === "all" ? "nav-item-active" : ""}`}
            type="button"
            onClick={() => setActiveFilter("all")}
          >
            <span className="nav-dot" />
            <span className="nav-label">我的一天</span>
            <span className="nav-count">{normalizedTodos.length}</span>
          </button>
          <button
            className={`nav-item ${activeFilter === "active" ? "nav-item-active" : ""}`}
            type="button"
            onClick={() => setActiveFilter("active")}
          >
            <span className="nav-dot nav-dot-muted" />
            <span className="nav-label">待处理</span>
            <span className="nav-count">{pendingCount}</span>
          </button>
          <button
            className={`nav-item ${activeFilter === "completed" ? "nav-item-active" : ""}`}
            type="button"
            onClick={() => setActiveFilter("completed")}
          >
            <span className="nav-dot nav-dot-muted" />
            <span className="nav-label">已完成</span>
            <span className="nav-count">{completedCount}</span>
          </button>
        </nav>

        <section className="sidebar-card">
          <p className="sidebar-card-title">今日概览</p>
          <div className="overview-row">
            <span>当前重点</span>
            <strong title={latestTitleHint}>{latestTitle}</strong>
          </div>
          <div className="overview-row">
            <span>待处理</span>
            <strong>{pendingCount} 项</strong>
          </div>
          <div className="overview-row">
            <span>完成进度</span>
            <strong>{progress}%</strong>
          </div>
        </section>
      </aside>

      <section className="main-panel">
        <header className="main-header">
          <div className="main-heading">
            <p className="greeting">{getGreeting()}</p>
            <h1>我的一天</h1>
            <p className="date-caption">
              先把今天要做的事情收进来，再一件件完成。现在这套工作台已经支持登录鉴权、个人资料和任务历史记录。
            </p>
          </div>

          <div className="header-meta" aria-label="任务概览">
            <div className="header-stat">
              <span>总任务</span>
              <strong>{normalizedTodos.length}</strong>
            </div>
            <div className="header-stat">
              <span>待处理</span>
              <strong>{pendingCount}</strong>
            </div>
          </div>
        </header>

        <section className="profile-panel">
          <div className="panel-head">
            <div>
              <p className="focus-label">个人资料</p>
              <h2>完善你的账户信息</h2>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleProfileSave}>
            <label className="auth-field">
              <span>昵称</span>
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                disabled={profileSaving}
              />
            </label>
            <label className="auth-field">
              <span>时区</span>
              <input
                value={profileTimezone}
                onChange={(event) => setProfileTimezone(event.target.value)}
                disabled={profileSaving}
              />
            </label>
            <label className="auth-field auth-field-wide">
              <span>简介</span>
              <textarea
                value={profileBio}
                onChange={(event) => setProfileBio(event.target.value)}
                disabled={profileSaving}
                placeholder="简单写下你的使用场景或近期目标"
              />
            </label>
            <button className="profile-save-button" type="submit" disabled={profileSaving}>
              {profileSaving ? "保存中..." : "保存资料"}
            </button>
          </form>
        </section>

        <section className="entry-panel">
          <form className="quick-entry-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="todo-title">
              添加任务
            </label>
            <input
              id="todo-title"
              className="quick-entry-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="添加任务"
              disabled={isSubmitting}
            />
            <button className="quick-entry-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "添加中..." : "添加"}
            </button>
          </form>

          <div className="feedback-row" aria-live="polite">
            {successMessage ? <p className="feedback success">{successMessage}</p> : null}
            {error ? <p className="feedback error">{error}</p> : null}
          </div>
        </section>

        <section className="focus-panel">
          <div className="focus-block">
            <p className="focus-label">当前焦点</p>
            <strong title={latestTitleHint}>{latestTitle}</strong>
          </div>
          <p className="focus-copy">
            {latestTodo
              ? `最近一条任务创建于 ${formatTodoTime(latestTodo.created_at)}`
              : "添加一条任务后，这里会显示你最新记录的事项。"}
          </p>
        </section>

        <section className="todo-section">
          <div className="todo-section-head">
            <h2>{getSectionTitle()}</h2>
            <span className="task-total">{isLoading ? "加载中" : `${filteredTodos.length} 条`}</span>
          </div>

          {isLoading ? (
            <div className="state-panel">
              <strong>正在读取任务</strong>
              <p>请稍候，今天的待办正在加载。</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="state-panel">
              <strong>{getEmptyStateTitle()}</strong>
              <p>{getEmptyStateDescription()}</p>
            </div>
          ) : (
            <ul className="task-list">
              {filteredTodos.map((todo) => (
                <TodoTaskCard
                  key={todo.id}
                  todo={todo}
                  isBusy={busyTodoId === todo.id}
                  isEditing={editingTodoId === todo.id}
                  editingTitle={editingTodoId === todo.id ? editingTitle : todo.title}
                  onEditingTitleChange={setEditingTitle}
                  onToggle={() => void handleToggleTodo(todo)}
                  onStartEditing={() => startEditing(todo)}
                  onCancelEditing={cancelEditing}
                  onSaveEditing={() => void handleSaveTodo(todo.id)}
                  onDelete={() => void handleDeleteTodo(todo.id)}
                  formatTodoTime={formatTodoTime}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="history-panel">
          <div className="panel-head">
            <div>
              <p className="focus-label">历史记录</p>
              <h2>最近 50 条操作</h2>
            </div>
          </div>

          {historyItems.length === 0 ? (
            <div className="state-panel">
              <strong>还没有历史记录</strong>
              <p>当你创建、编辑、完成或删除任务时，这里会自动留下记录。</p>
            </div>
          ) : (
            <ul className="history-list">
              {historyItems.map((item) => (
                <li key={item.id} className="history-row">
                  <div className="history-row-head">
                    <strong>{getHistoryActionLabel(item.action)}</strong>
                    <span>{formatHistoryTime(item.created_at)}</span>
                  </div>
                  <p className="history-title">{item.title_snapshot}</p>
                  <p className="history-detail">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
