# AI Todo 项目技术栈定稿

## 技术栈结论

- 前端：Next.js + TypeScript + Tailwind CSS
- 后端：FastAPI + SQLAlchemy + Pydantic
- 数据库：MySQL
- 认证：邮箱密码登录 + JWT
- 部署：Vercel（前端）+ Railway（后端 / MySQL）
- AI 接入：由后端统一调用 OpenAI 兼容接口

## 选型原则

1. 优先考虑个人开发效率
2. 保留完整前后端职责边界
3. 方便后续部署与作品展示
4. 让 AI 接入路径自然且安全

## 说明

这套技术栈能够以较低的工程复杂度完成一个标准的 AI 全栈项目闭环，同时保留较强的可展示性与后续扩展空间。
