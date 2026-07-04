# AI Todo 项目 V1 API 设计文档

## 1. 文档说明

本文档用于定义 AI Todo 项目 V1 的后端 RESTful API 规范，作为前后端联调、数据库建模、接口实现和测试编写的统一依据。

本文档遵循以下原则：

1. 按功能模块拆分接口
2. 保持 RESTful 风格
3. 优先服务 V1 MVP 开发
4. 优先保证个人开发可执行性

## 2. 基础约定

### 2.1 Base URL

开发环境建议：

```text
http://localhost:8000/api/v1
```

生产环境建议：

```text
https://your-domain.com/api/v1
```

### 2.2 数据格式

- 请求体格式：`application/json`
- 响应体格式：`application/json`
- 字符编码：`UTF-8`

### 2.3 鉴权方式

除登录、注册等公开接口外，其余接口都需要携带 JWT。

请求头格式：

```http
Authorization: Bearer <access_token>
```

### 2.4 时间格式

所有时间字段统一使用 ISO 8601 字符串，例如：

```json
"2026-07-04T18:30:00Z"
```

### 2.5 通用响应结构

成功响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {}
}
```

失败响应：

```json
{
  "success": false,
  "message": "请求失败",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {}
  }
}
```

### 2.6 通用状态码

| 状态码 | 含义 | 使用场景 |
|---|---|---|
| `200` | 请求成功 | 查询、更新、AI 建议返回 |
| `201` | 创建成功 | 注册、创建 Todo |
| `400` | 请求参数错误 | 表单校验失败、非法参数 |
| `401` | 未认证 | Token 缺失或无效 |
| `403` | 无权限 | 访问他人资源 |
| `404` | 资源不存在 | Todo 不存在 |
| `409` | 资源冲突 | 邮箱已注册 |
| `422` | 语义校验失败 | AI 输入不符合要求 |
| `500` | 服务器错误 | 未处理异常 |
| `502` | AI 服务异常 | 模型调用失败 |
| `504` | AI 服务超时 | 模型响应超时 |

### 2.7 通用错误码

| 错误码 | 含义 |
|---|---|
| `VALIDATION_ERROR` | 参数校验失败 |
| `UNAUTHORIZED` | 未登录或 Token 无效 |
| `FORBIDDEN` | 无权限访问 |
| `RESOURCE_NOT_FOUND` | 资源不存在 |
| `EMAIL_ALREADY_EXISTS` | 邮箱已注册 |
| `LOGIN_FAILED` | 登录失败 |
| `AI_REQUEST_INVALID` | AI 请求输入不合法 |
| `AI_PROVIDER_ERROR` | AI 提供方返回错误 |
| `AI_PROVIDER_TIMEOUT` | AI 请求超时 |
| `INTERNAL_SERVER_ERROR` | 服务内部错误 |

## 3. 认证模块

### 3.1 用户注册

- 方法：`POST`
- 路径：`/auth/register`
- 是否鉴权：否

请求体：

```json
{
  "email": "user@example.com",
  "password": "12345678",
  "nickname": "Lee"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | string | 是 | 用户邮箱，需唯一 |
| `password` | string | 是 | 登录密码，建议最少 8 位 |
| `nickname` | string | 是 | 用户昵称 |

成功响应：

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "Lee",
      "created_at": "2026-07-04T18:30:00Z"
    }
  }
}
```

可能错误：

- `409 EMAIL_ALREADY_EXISTS`
- `400 VALIDATION_ERROR`

### 3.2 用户登录

- 方法：`POST`
- 路径：`/auth/login`
- 是否鉴权：否

请求体：

```json
{
  "email": "user@example.com",
  "password": "12345678"
}
```

成功响应：

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "access_token": "jwt-token",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "Lee"
    }
  }
}
```

可能错误：

- `401 LOGIN_FAILED`
- `400 VALIDATION_ERROR`

### 3.3 获取当前登录用户

- 方法：`GET`
- 路径：`/auth/me`
- 是否鉴权：是

成功响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "Lee",
    "created_at": "2026-07-04T18:30:00Z"
  }
}
```

## 4. 用户资料模块

### 4.1 获取个人资料

- 方法：`GET`
- 路径：`/profile`
- 是否鉴权：是

成功响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "Lee",
    "created_at": "2026-07-04T18:30:00Z",
    "updated_at": "2026-07-04T18:30:00Z"
  }
}
```

### 4.2 更新个人资料

- 方法：`PUT`
- 路径：`/profile`
- 是否鉴权：是

请求体：

```json
{
  "nickname": "LeeHaor"
}
```

成功响应：

```json
{
  "success": true,
  "message": "个人资料更新成功",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "LeeHaor",
    "updated_at": "2026-07-04T19:10:00Z"
  }
}
```

## 5. Todo 模块

### 5.1 获取任务列表

- 方法：`GET`
- 路径：`/todos`
- 是否鉴权：是

查询参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `status` | string | 否 | `todo` / `completed` |
| `priority` | string | 否 | `low` / `medium` / `high` |
| `keyword` | string | 否 | 标题或描述关键词 |
| `page` | integer | 否 | 页码，默认 1 |
| `page_size` | integer | 否 | 每页条数，默认 20 |

成功响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 101,
        "title": "完成 AI Todo 项目 API 文档",
        "description": "按模块整理 V1 RESTful API 规范",
        "status": "todo",
        "priority": "high",
        "created_at": "2026-07-04T19:10:00Z",
        "updated_at": "2026-07-04T19:10:00Z",
        "completed_at": null
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 1
    }
  }
}
```

### 5.2 创建任务

- 方法：`POST`
- 路径：`/todos`
- 是否鉴权：是

请求体：

```json
{
  "title": "完成 AI Todo 项目 API 文档",
  "description": "按模块整理 V1 RESTful API 规范",
  "priority": "high"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | 任务标题 |
| `description` | string | 否 | 任务描述 |
| `priority` | string | 否 | `low` / `medium` / `high` |

成功响应：

```json
{
  "success": true,
  "message": "任务创建成功",
  "data": {
    "id": 101,
    "title": "完成 AI Todo 项目 API 文档",
    "description": "按模块整理 V1 RESTful API 规范",
    "status": "todo",
    "priority": "high",
    "created_at": "2026-07-04T19:10:00Z",
    "updated_at": "2026-07-04T19:10:00Z",
    "completed_at": null
  }
}
```

### 5.3 获取任务详情

- 方法：`GET`
- 路径：`/todos/{todo_id}`
- 是否鉴权：是

成功响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": 101,
    "title": "完成 AI Todo 项目 API 文档",
    "description": "按模块整理 V1 RESTful API 规范",
    "status": "todo",
    "priority": "high",
    "ai_rewrite_result": null,
    "ai_decompose_result": null,
    "ai_priority_suggestion": null,
    "created_at": "2026-07-04T19:10:00Z",
    "updated_at": "2026-07-04T19:10:00Z",
    "completed_at": null
  }
}
```

### 5.4 更新任务

- 方法：`PUT`
- 路径：`/todos/{todo_id}`
- 是否鉴权：是

请求体：

```json
{
  "title": "完成 AI Todo 项目 V1 API 文档",
  "description": "补充认证、Todo、AI、历史记录模块",
  "priority": "high"
}
```

成功响应：

```json
{
  "success": true,
  "message": "任务更新成功",
  "data": {
    "id": 101,
    "title": "完成 AI Todo 项目 V1 API 文档",
    "description": "补充认证、Todo、AI、历史记录模块",
    "status": "todo",
    "priority": "high",
    "updated_at": "2026-07-04T19:20:00Z"
  }
}
```

### 5.5 删除任务

- 方法：`DELETE`
- 路径：`/todos/{todo_id}`
- 是否鉴权：是

成功响应：

```json
{
  "success": true,
  "message": "任务删除成功",
  "data": {
    "id": 101
  }
}
```

### 5.6 更新任务完成状态

- 方法：`PATCH`
- 路径：`/todos/{todo_id}/complete`
- 是否鉴权：是

请求体：

```json
{
  "completed": true
}
```

成功响应：

```json
{
  "success": true,
  "message": "任务状态更新成功",
  "data": {
    "id": 101,
    "status": "completed",
    "completed_at": "2026-07-04T19:30:00Z"
  }
}
```

## 6. AI 模块

说明：V1 所有 AI 接口均只返回建议结果，不直接强制修改 Todo 数据。是否落库由前端显式确认后，再通过 Todo 更新接口写入。

### 6.1 AI 重写任务描述

- 方法：`POST`
- 路径：`/ai/rewrite`
- 是否鉴权：是

请求体：

```json
{
  "input_text": "下周把项目上线的事情理一下"
}
```

成功响应：

```json
{
  "success": true,
  "message": "AI 重写成功",
  "data": {
    "original_text": "下周把项目上线的事情理一下",
    "rewritten_title": "整理项目上线准备事项",
    "rewritten_description": "梳理项目上线前需要完成的部署、配置检查和发布准备工作。"
  }
}
```

可能错误：

- `422 AI_REQUEST_INVALID`
- `502 AI_PROVIDER_ERROR`
- `504 AI_PROVIDER_TIMEOUT`

### 6.2 AI 拆解任务

- 方法：`POST`
- 路径：`/ai/decompose`
- 是否鉴权：是

请求体：

```json
{
  "input_text": "做一个 AI Todo 项目"
}
```

成功响应：

```json
{
  "success": true,
  "message": "AI 拆解成功",
  "data": {
    "original_text": "做一个 AI Todo 项目",
    "steps": [
      "明确 V1 MVP 范围",
      "确定技术栈与系统架构",
      "初始化前后端项目结构",
      "完成用户认证与 Todo CRUD",
      "接入 AI 重写、拆解和优先级建议"
    ]
  }
}
```

### 6.3 AI 优先级建议

- 方法：`POST`
- 路径：`/ai/priority`
- 是否鉴权：是

请求体：

```json
{
  "title": "完成 AI Todo 项目 API 文档",
  "description": "用于后续前后端联调开发"
}
```

成功响应：

```json
{
  "success": true,
  "message": "AI 优先级建议生成成功",
  "data": {
    "suggested_priority": "high",
    "reason": "该任务直接影响后续接口开发与联调推进，属于当前阶段关键支撑项。"
  }
}
```

## 7. 历史记录模块

### 7.1 获取历史记录列表

- 方法：`GET`
- 路径：`/histories`
- 是否鉴权：是

查询参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `todo_id` | integer | 否 | 按任务过滤 |
| `page` | integer | 否 | 页码 |
| `page_size` | integer | 否 | 每页条数 |

成功响应：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 1,
        "todo_id": 101,
        "action_type": "todo_created",
        "action_detail": "创建任务：完成 AI Todo 项目 API 文档",
        "created_at": "2026-07-04T19:10:00Z"
      },
      {
        "id": 2,
        "todo_id": 101,
        "action_type": "ai_rewrite_requested",
        "action_detail": "调用 AI 重写任务描述",
        "created_at": "2026-07-04T19:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 2
    }
  }
}
```

## 8. 资源字段规范

### 8.1 User 对象

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "Lee",
  "created_at": "2026-07-04T18:30:00Z",
  "updated_at": "2026-07-04T18:30:00Z"
}
```

### 8.2 Todo 对象

```json
{
  "id": 101,
  "title": "完成 AI Todo 项目 API 文档",
  "description": "按模块整理 V1 RESTful API 规范",
  "status": "todo",
  "priority": "high",
  "ai_rewrite_result": null,
  "ai_decompose_result": null,
  "ai_priority_suggestion": null,
  "created_at": "2026-07-04T19:10:00Z",
  "updated_at": "2026-07-04T19:10:00Z",
  "completed_at": null
}
```

### 8.3 History 对象

```json
{
  "id": 1,
  "todo_id": 101,
  "action_type": "todo_created",
  "action_detail": "创建任务：完成 AI Todo 项目 API 文档",
  "created_at": "2026-07-04T19:10:00Z"
}
```

## 9. V1 简化实现约束

为保证开发效率，V1 API 先采用以下简化策略：

1. 不做刷新 Token 机制，先只保留 Access Token
2. 不做复杂排序、组合筛选和批量操作
3. 不做标签、提醒、截止时间等扩展字段
4. AI 接口先做同步调用
5. AI 结果先返回纯结构化文本，不做复杂流式输出
6. 历史记录只做关键事件记录，不做 diff 审计

## 10. 后续扩展建议

V2 可考虑扩展：

1. `POST /todos/{todo_id}/subtasks`
2. `PATCH /todos/{todo_id}/priority`
3. `GET /todos/summary`
4. `POST /ai/organize-backlog`
5. `POST /auth/refresh`

## 11. 结论

本 API 文档以 V1 MVP 为中心，覆盖了认证、用户资料、任务管理、AI 建议和历史记录五类核心能力，能够直接支撑后续后端接口开发、前后端联调和测试用例编写。
