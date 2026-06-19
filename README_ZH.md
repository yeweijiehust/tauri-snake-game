# Tauri 贪吃蛇

基于 Tauri v2 + React 19 + TypeScript + Canvas 的经典贪吃蛇游戏。

## 功能特性

- Canvas 渲染游戏网格
- 键盘控制（WASD / 方向键）
- 暂停 / 继续
- 游戏结束弹窗，一键重新开始
- 中英文语言切换
- 对局历史记录（最近 10 条，保存至 localStorage）
- 历史记录弹窗，含清除确认
- 按空格键开始 / 重来

## 快速开始

### 环境要求

- Node.js >= 18
- Rust（用于 Tauri）

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 打包

```bash
npm run tauri build
```

编译产物位于 `src-tauri/target/release/tauri-snake-game.exe`，可直接拷贝运行。

### 测试

```bash
npm run test
```

## 技术栈

- **Tauri v2** — 桌面框架
- **React 19** — UI
- **TypeScript** — 类型安全
- **Vite** — 打包工具
- **Canvas API** — 游戏渲染
- **Vitest** — 单元测试
