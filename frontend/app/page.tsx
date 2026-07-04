const features = [
  {
    title: "Todo CRUD",
    description: "创建、编辑、删除和完成任务的基础闭环。",
  },
  {
    title: "AI Rewrite",
    description: "把模糊输入重写成更清晰、可执行的任务描述。",
  },
  {
    title: "AI Decompose",
    description: "将复杂目标拆成可落地的执行步骤。",
  },
  {
    title: "AI Priority",
    description: "基于任务内容给出轻量优先级建议。",
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">MyAITodo / V1 Scaffold</p>
        <h1>AI Todo 全栈项目骨架已启动</h1>
        <p className="hero-copy">
          当前页面用于验证前端脚手架、样式系统和后端联通基础是否就绪。下一步会在这个骨架上继续叠加认证、任务系统和 AI 能力。
        </p>

        <div className="status-row">
          <div className="status-pill">Frontend: Next.js 15</div>
          <div className="status-pill">Backend: FastAPI</div>
          <div className="status-pill">Database: MySQL Config Ready</div>
        </div>
      </section>

      <section className="grid-section">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="bottom-panel">
        <div>
          <h3>当前阶段</h3>
          <p>完成前后端工程目录、基础配置、健康检查和数据库连接骨架。</p>
        </div>
        <div>
          <h3>下一阶段</h3>
          <p>接入认证、Todo CRUD、AI 接口，以及真实数据联调。</p>
        </div>
      </section>
    </main>
  );
}
