# 🤝 贡献指南

感谢你对 AI Chat Studio 的关注！我们非常欢迎各种形式的贡献。

---

## 📋 目录

- [行为准则](#行为准则)
- [我能做什么贡献？](#我能做什么贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交指南](#提交指南)
- [Pull Request 流程](#pull-request-流程)
- [问题报告](#问题报告)

---

## 行为准则

本项目遵循 [行为准则](CODE_OF_CONDUCT.md)。参与本项目即表示你同意遵守该准则。

---

## 我能做什么贡献？

### 🐛 报告 Bug
- 在 [Issues](https://github.com/your-username/ai-chat-studio/issues) 页面创建新的 issue
- 使用 Bug 报告模板
- 提供详细的复现步骤

### ✨ 提出新功能
- 在 [Issues](https://github.com/your-username/ai-chat-studio/issues) 页面创建功能请求
- 使用功能请求模板
- 清楚地描述功能的用途和预期行为

### 📝 改进文档
- 修复文档中的错误
- 添加更多示例
- 翻译文档到其他语言

### 💻 贡献代码
- 修复 Bug
- 实现新功能
- 优化性能
- 编写测试

### 🎨 设计贡献
- UI/UX 改进建议
- 图标和插图
- 主题设计

---

## 开发流程

### 1. Fork 项目

点击 GitHub 页面右上角的 "Fork" 按钮。

### 2. 克隆你的 Fork

```bash
git clone https://github.com/YOUR_USERNAME/ai-chat-studio.git
cd ai-chat-studio
```

### 3. 添加上游仓库

```bash
git remote add upstream https://github.com/your-username/ai-chat-studio.git
```

### 4. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `style/` - 代码格式化（不影响功能）
- `refactor/` - 重构
- `test/` - 测试相关
- `chore/` - 构建工具或辅助工具的变动

### 5. 安装依赖

```bash
npm install
```

### 6. 启动开发服务器

```bash
npm run dev
```

### 7. 进行开发

- 编写代码
- 遵循代码规范
- 添加必要的测试
- 更新相关文档

### 8. 运行测试

```bash
npm run test
npm run lint
npm run type-check
```

### 9. 提交更改

```bash
git add .
git commit -m "type: description"
```

参考 [提交指南](#提交指南)

### 10. 同步上游更改

```bash
git fetch upstream
git rebase upstream/main
```

### 11. 推送到你的 Fork

```bash
git push origin feature/your-feature-name
```

### 12. 创建 Pull Request

在 GitHub 上创建 Pull Request，详见 [Pull Request 流程](#pull-request-流程)

---

## 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 避免使用 `any` 类型
- 为函数和变量提供明确的类型注解

**示例：**
```typescript
// ✅ 好
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ 差
function getUser(id: any): any {
  // ...
}
```

### React

- 使用函数组件和 Hooks
- 组件使用 PascalCase 命名
- Props 接口命名为 `ComponentNameProps`

**示例：**
```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
```

### 样式

- 使用 Tailwind CSS
- 避免内联样式
- 使用 `cn()` 工具函数合并 className

**示例：**
```typescript
import { cn } from '@/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)}>
  ...
</div>
```

### 命名规范

- **变量和函数**: camelCase
  ```typescript
  const userName = 'John'
  function fetchUserData() { }
  ```

- **类型和接口**: PascalCase
  ```typescript
  interface UserProfile { }
  type MessageType = 'user' | 'assistant'
  ```

- **常量**: UPPER_SNAKE_CASE
  ```typescript
  const MAX_RETRY_COUNT = 3
  const API_BASE_URL = 'https://api.example.com'
  ```

- **文件名**:
  - 组件: PascalCase.tsx (`Button.tsx`)
  - 工具: camelCase.ts (`formatDate.ts`)
  - Hooks: camelCase.ts (`useUser.ts`)

### 代码组织

**组件文件结构：**
```typescript
// 1. 导入
import React, { useState } from 'react'
import { Button } from './ui'

// 2. 类型定义
interface ComponentProps {
  // ...
}

// 3. 常量
const DEFAULT_VALUE = 10

// 4. 组件
const Component: React.FC<ComponentProps> = (props) => {
  // 4.1 State
  const [state, setState] = useState()

  // 4.2 Refs
  const ref = useRef()

  // 4.3 Effects
  useEffect(() => {
    // ...
  }, [])

  // 4.4 Handlers
  const handleClick = () => {
    // ...
  }

  // 4.5 Render helpers
  const renderItem = () => {
    // ...
  }

  // 4.6 JSX
  return (
    <div>
      ...
    </div>
  )
}

// 5. 导出
export default Component
```

### 注释

- 为复杂逻辑添加注释
- 使用 JSDoc 注释公共 API

**示例：**
```typescript
/**
 * 计算两个日期之间的天数差
 * @param start 开始日期
 * @param end 结束日期
 * @returns 天数差
 */
function daysBetween(start: Date, end: Date): number {
  // ...
}
```

---

## 提交指南

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动
- `ci`: CI 配置文件和脚本的变动

### Scope（可选）

受影响的模块，如：
- `components`
- `store`
- `api`
- `ui`
- `docs`

### Subject

- 使用祈使句，现在时（"change" 而非 "changed" 或 "changes"）
- 不要大写首字母
- 结尾不要句号

### Body（可选）

- 解释为什么做出这个更改
- 如何解决问题
- 有什么副作用

### Footer（可选）

- 引用相关 Issue: `Closes #123`
- Breaking Changes: `BREAKING CHANGE: description`

### 示例

```
feat(components): add voice chat mode component

- Add speech recognition support
- Add speech synthesis support
- Add audio visualizer
- Support 9+ languages

Closes #45
```

```
fix(api): handle timeout errors correctly

Previously, timeout errors were not handled properly, causing the app to crash.
Now, timeout errors are caught and displayed to the user with a helpful message.

Fixes #123
```

---

## Pull Request 流程

### 1. 确保你的代码

- ✅ 遵循代码规范
- ✅ 通过所有测试
- ✅ 没有 lint 错误
- ✅ 更新了相关文档
- ✅ 添加了必要的测试

### 2. 填写 PR 模板

使用 Pull Request 模板填写以下信息：

- **描述**: 清楚地描述你做了什么更改
- **动机**: 为什么需要这个更改
- **测试**: 如何测试这些更改
- **截图**: 如果是 UI 相关，附上截图
- **相关 Issue**: 引用相关的 Issue

### 3. PR 标题格式

```
<type>: <description>
```

示例：
- `feat: add voice chat mode`
- `fix: resolve timeout error in API calls`
- `docs: update contribution guidelines`

### 4. 等待审查

- 维护者会尽快审查你的 PR
- 可能会要求你进行一些修改
- 请及时响应评论和反馈

### 5. 合并后

- 删除你的分支（如果不再需要）
- 更新你的 Fork

```bash
git checkout main
git pull upstream main
git push origin main
```

---

## 问题报告

### Bug 报告

使用 Bug 报告模板，包括：

1. **Bug 描述**: 简洁清晰地描述问题
2. **复现步骤**: 详细列出复现步骤
3. **预期行为**: 应该发生什么
4. **实际行为**: 实际发生了什么
5. **环境信息**:
   - 操作系统
   - 浏览器版本
   - Node.js 版本
6. **截图**: 如果适用
7. **额外信息**: 任何其他相关信息

### 功能请求

使用功能请求模板，包括：

1. **问题描述**: 你遇到了什么问题？
2. **建议解决方案**: 你希望如何解决？
3. **替代方案**: 考虑过哪些其他方案？
4. **额外信息**: 任何其他相关信息

---

## 开发环境设置

### 推荐的 VSCode 扩展

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- GitLens

### VSCode 设置

创建 `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^'\"`]*)(?:'|\"|`)"]
  ]
}
```

---

## 测试指南

### 单元测试

```bash
npm run test
```

### E2E 测试

```bash
npm run test:e2e
```

### 代码覆盖率

```bash
npm run test:coverage
```

### 编写测试

- 为新功能添加测试
- 确保测试覆盖率不降低
- 测试文件与源文件同名，后缀为 `.test.ts` 或 `.test.tsx`

**示例：**
```typescript
// Button.test.tsx
import { render, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('should render with label', () => {
    const { getByText } = render(<Button label="Click me" onClick={() => {}} />)
    expect(getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    const { getByText } = render(<Button label="Click me" onClick={handleClick} />)
    fireEvent.click(getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

---

## 发布流程

（仅限维护者）

### 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **Major** (X.0.0): 不兼容的 API 修改
- **Minor** (0.X.0): 向下兼容的功能性新增
- **Patch** (0.0.X): 向下兼容的问题修正

### 发布步骤

1. 更新版本号
   ```bash
   npm version [major|minor|patch]
   ```

2. 更新 CHANGELOG.md

3. 创建 Git tag
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. 发布到 GitHub Releases

---

## 获取帮助

如果你有任何问题：

- 📖 阅读 [文档](docs/)
- 💬 在 [Discussions](https://github.com/your-username/ai-chat-studio/discussions) 提问
- 🐛 在 [Issues](https://github.com/your-username/ai-chat-studio/issues) 报告问题

---

## 致谢

感谢所有为 AI Chat Studio 做出贡献的开发者！

你的贡献让这个项目变得更好！🎉

---

**Happy Coding! 🚀**