# Next Apps Template

Monorepo 模板项目，用于开发 **微应用 (apps)** 和 **构件包 (bricks)**。

基于 **pnpm workspaces** + **Turborepo** + **Changesets** 构建。

## 前置要求

- **Node.js** >= 22（见 `.nvmrc`）
- **pnpm** >= 9

```bash
# 安装 pnpm（如果尚未安装）
npm install -g pnpm
```

## 快速开始

### 1. 从模板创建项目

在 GitHub 上点击 **"Use this template"** 创建新仓库，然后克隆到本地。

### 2. 初始化

```bash
# 复制开发配置
cp dev.config.example.mjs dev.config.mjs

# 安装依赖
pnpm install
```

### 3. 开发

```bash
# 启动示例应用的 watch 模式
pnpm --filter @apps/example run start

# 在另一个终端启动开发服务器
pnpm run serve -- --local-micro-apps=example --subdir --local-container --server=https://your-server.local

# 访问: https://localhost:8081/next/example
```

## 目录结构

```
.
├── apps/                  # 微应用目录
│   └── example/           # 示例应用（YAML 模式）
│       ├── package.json
│       └── src/
│           ├── app.yaml           # 应用元数据
│           ├── i18n.yaml          # 国际化
│           ├── contracts.yaml     # API 合约
│           ├── Menus/             # 菜单定义
│           └── Pages/             # 路由页面
├── bricks/                # 构件包目录
├── shared/                # 共享库目录
├── scripts/               # 构建和发布脚本
├── declarations/          # 全局 TypeScript 类型声明
├── __jest__/              # Jest 全局 setup
├── package.json           # 根配置
├── pnpm-workspace.yaml    # pnpm 工作区定义
├── turbo.json             # Turborepo 构建缓存配置
├── dev-config.yaml        # 部署主机配置
└── dev.config.example.mjs # 开发服务器配置示例
```

## 常用命令

### 构建

```bash
# 构建所有（bricks → apps）
pnpm run build

# 仅构建 apps
pnpm run build:apps

# 构建指定应用
pnpm turbo build --filter=@apps/example

# 构建 bricks
pnpm run build:bricks

# 构建 shared
pnpm run build:shared

# 构建生产制品
pnpm run build:apps:artifact
pnpm run build:apps:artifact:production
```

### 开发

```bash
# 启动所有包的 dev 模式
pnpm run start

# 启动开发服务器
pnpm run serve -- --local-micro-apps=YOUR_APP --subdir --local-container --server=https://your-server.local
```

### 测试

```bash
# 运行 bricks 测试
pnpm run test

# 运行 apps 测试（ESM 模式）
pnpm run test:apps
```

### Lint

```bash
# 手动运行 lint（通常由 pre-commit hook 自动触发）
pnpm run lint-staged
```

## 创建新应用

1. 复制 `apps/example/` 目录并重命名：

```bash
cp -r apps/example apps/my-app
```

2. 修改 `apps/my-app/package.json` 中的 `name` 为 `@apps/my-app`

3. 修改 `apps/my-app/src/app.yaml` 中的 `id`、`name`、`homepage`

4. 修改菜单和路由文件中的相关引用

5. 在 `dev-config.yaml` 中添加部署配置

6. 运行 `pnpm install` 更新工作区

## 创建新 Brick

使用脚手架工具：

```bash
pnpm run yo
```

按照交互提示创建新的 brick 包，文件将生成在 `bricks/` 目录下。

## 构建缓存（Turborepo）

项目使用 [Turborepo](https://turbo.build/) 进行增量构建缓存：

- 首次构建后，未变更的包在后续构建中会直接使用缓存
- 缓存存储在 `.turbo/` 目录（已被 `.gitignore` 忽略）
- CI 中可配置远程缓存进一步加速

```bash
# 查看哪些包会被构建（dry run）
pnpm turbo build --dry

# 强制跳过缓存重新构建
pnpm turbo build --force
```

## 版本管理（Changesets）

项目使用 [Changesets](https://github.com/changesets/changesets) 管理版本和 CHANGELOG。

### 自动模式

Git commit 后会自动根据 commit message 生成 changeset 文件（通过 post-commit hook）：

- `feat(xxx):` → minor 版本升级
- `fix(xxx):` / `refactor(xxx):` → patch 版本升级
- 包含 `BREAKING CHANGE` → major 版本升级

### 手动模式

```bash
pnpm run changeset
```

### 查看待发布状态

```bash
pnpm run changeset:status
```

## 发布流程

```bash
# 一键发布（更新版本号、生成 CHANGELOG、打 tag、推送）
pnpm run release
```

该命令会自动完成：

1. 基于 changeset 文件更新版本号和 CHANGELOG
2. Git commit
3. 创建 Git tags
4. 推送到远程仓库

## 开发配置

### `dev.config.mjs`

本地开发服务器配置

可配置：

- `brickFolders`：本地 brick 包路径
- `settings`：Feature flags
- `userConfigByApps`：应用级配置
- `mocks`：API mock

### `dev-config.yaml`

部署主机配置，用于生成 `deploy.txt`。构建后自动执行。
