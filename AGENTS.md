# 哄哄模拟器 - 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **AI能力**: coze-coding-dev-sdk (LLM对话 + TTS语音)
- **额外依赖**: html2canvas (分享卡片生成)

## 项目概述

哄哄模拟器是一个AI驱动的互动游戏，帮助恋爱经验不足的年轻人学习如何哄好生气的伴侣。用户通过选择题的方式回答，AI动态生成对话和选项，10轮内将好感度提升到80分即可通关。

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/
│   │   ├── page.tsx        # 主页面（首页/游戏/结局三屏切换）
│   │   ├── layout.tsx      # 根布局
│   │   ├── globals.css     # 全局样式+自定义动画
│   │   └── api/
│   │       ├── chat/route.ts   # LLM对话API（返回下一轮对话+选项）
│   │       └── tts/route.ts    # TTS语音合成API
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   └── lib/
│       ├── game-data.ts    # 游戏数据类型、常量、工具函数
│       └── utils.ts        # 通用工具函数 (cn)
├── SPEC.md                 # 产品需求文档
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 核心业务逻辑

### 游戏流程
1. 首页选择对象性别（男/女）+ 场景（5个预设场景）
2. 进入对话界面，AI生成对方的话+6个选项（2好4坏）
3. 选择后：
   - 选好→好感度上升动画→下一轮
   - 选坏→好感度下降动画→学习弹窗（解释为什么不对+更好做法）→下一轮
4. 10轮内好感度>=80通关，好感度<=-50或10轮结束未达80则失败

### 好感度系统
- 初始0分，范围[-50, 100]，胜利>=80，失败<=-50
- 好感度影响：对方语气、TTS声音选择、情绪标签

### LLM Prompt设计
- 严格system prompt + few-shot示例约束输出
- 返回JSON格式：reply + 6个options（含scoreChange/isGood/learningTip）
- 前端做数值钳制确保安全

### TTS声音映射
- 按好感度区间切换不同声音类型，替代情绪参数
- 同时调整语速体现情绪变化

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- 所有API调用使用 coze-coding-dev-sdk，后端调用，严禁前端直调

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用动态拼接

### Hydration 问题防范

- 使用 'use client' + useEffect + useState 确保动态内容仅在客户端渲染
- 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random()

## 构建和测试命令

- 静态类型检查：`pnpm ts-check`
- 代码lint：`pnpm lint:build`
- 完整验证：`pnpm validate`
- 开发启动：`pnpm dev`（端口5000）
