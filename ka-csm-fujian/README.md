# 福建区 KA 客户成功管理系统

基于深圳区系统的页面结构，快速搭建的福建区 KA 客户成功管理系统第一版。

## 已包含模块

- 登录页
- 仪表盘
- 客户管理：客户清单、关键人清单、项目清单、关键场景清单、导入导出入口
- 客户成功计划
- 关键项目管理 KCP
- 周执行工作
- 我的账号
- 执行推送配置
- 账号管理

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

当前演示登录支持任意账号和密码。

## 数据库设计

MySQL 地址默认配置为：

```text
192.200.15.177:3306
```

复制 `.env.example` 为 `.env.local`，填入数据库名、账号和密码：

```bash
cp .env.example .env.local
```

数据库脚本：

- `database/schema.sql`：建库建表
- `database/seed.sql`：福建区样例数据

建议执行顺序：

```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

也可以填好 `.env.local` 后直接运行：

```bash
npm run db:init
```

## 主要数据模型

- `managers`：大客户服务经理
- `users`：管理员、主管、客户经理账号
- `customers`：KA 客户主档
- `customer_branches`：客户分支单位
- `contacts`：关键人
- `success_plans`：客户成功计划 / 关键场景
- `success_plan_contacts`：计划与关键人关系
- `kcp_projects`：关键项目管理
- `weekly_tasks`：周执行事项
- `push_config` / `push_recipients`：企微推送配置
