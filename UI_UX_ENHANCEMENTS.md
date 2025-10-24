# UI/UX 增强功能文档

## 📚 概述

本文档详细介绍了 AI Chat Studio 项目中新增的 UI/UX 增强功能,旨在提供更好的用户体验、可访问性和视觉反馈。

---

## 🎨 新增组件清单

### 1. 加载状态组件 (`LoadingSpinner.tsx`)

提供多种加载指示器,提升感知性能和用户体验。

#### 组件列表:

**LoadingSpinner** - 旋转加载器
```tsx
import { LoadingSpinner } from '@/components/ui'

<LoadingSpinner
  size="md"
  color="primary"
  label="Loading..."
/>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'primary' | 'secondary' | 'white'
- `label`: string (可选)
- `className`: string (可选)

**PulseLoader** - 脉冲动画加载器
```tsx
<PulseLoader className="w-full h-4 rounded" />
```

**DotsLoader** - 点状加载器
```tsx
<DotsLoader size="md" />
```

**Skeleton** - 骨架屏组件
```tsx
<Skeleton variant="text" width="200px" />
<Skeleton variant="rect" width="100%" height="100px" />
<Skeleton variant="circle" width="40px" height="40px" />
```

---

### 2. 进度指示器 (`ProgressBar.tsx`)

多种进度条样式,用于显示上传、下载或处理进度。

**ProgressBar** - 线性进度条
```tsx
<ProgressBar
  value={65}
  variant="success"
  showLabel
  label="Uploading..."
/>
```

**Props:**
- `value`: number (0-100)
- `variant`: 'default' | 'success' | 'warning' | 'error'
- `size`: 'sm' | 'md' | 'lg'
- `showLabel`: boolean
- `animated`: boolean

**CircularProgress** - 圆形进度条
```tsx
<CircularProgress
  value={75}
  size={100}
  variant="success"
/>
```

**IndeterminateProgress** - 不确定进度
```tsx
<IndeterminateProgress variant="default" />
```

---

### 3. 错误边界 (`ErrorBoundary.tsx`)

React 错误边界组件,捕获并优雅地处理组件错误。

```tsx
import { ErrorBoundary } from '@/components/ui'

<ErrorBoundary onError={(error, errorInfo) => console.log(error)}>
  <YourComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(YourComponent)
```

**特性:**
- ✅ 捕获 React 组件树中的错误
- ✅ 显示友好的错误UI
- ✅ 开发模式下显示详细错误信息
- ✅ 集成 Sentry 错误报告
- ✅ 提供重试、回到首页、重新加载选项

---

### 4. Toast 通知系统 (`Toast.tsx`)

轻量级通知组件,提供即时反馈。

```tsx
import { useToast, ToastContainer } from '@/components/ui'

function MyComponent() {
  const { toasts, success, error, warning, info, closeToast } = useToast()

  const handleAction = () => {
    success('操作成功!', {
      description: '您的更改已保存',
      duration: 5000,
      action: {
        label: '撤销',
        onClick: () => console.log('Undo')
      }
    })
  }

  return (
    <>
      <button onClick={handleAction}>执行操作</button>
      <ToastContainer toasts={toasts} onClose={closeToast} position="top-right" />
    </>
  )
}
```

**Toast 类型:**
- ✅ Success (成功)
- ✅ Error (错误)
- ✅ Warning (警告)
- ✅ Info (信息)

**支持的位置:**
- `top-right`, `top-left`, `top-center`
- `bottom-right`, `bottom-left`, `bottom-center`

---

### 5. 空状态组件 (`EmptyState.tsx`)

当没有数据时显示友好的空状态界面。

```tsx
import { EmptyState, NoConversationsEmpty } from '@/components/ui'

// 通用空状态
<EmptyState
  icon={MessageSquare}
  title="No conversations yet"
  description="Start a new conversation to begin"
  action={{
    label: 'New Conversation',
    onClick: handleCreate,
    icon: Sparkles
  }}
  variant="default"
/>

// 预设空状态
<NoConversationsEmpty onCreate={handleCreate} />
<NoSearchResultsEmpty query="search term" />
<NoMessagesEmpty />
<ErrorEmpty message="Failed to load" onRetry={handleRetry} />
```

**Variants:**
- `default` - 默认样式
- `search` - 搜索结果为空
- `error` - 错误状态

---

### 6. 表单字段和验证 (`FormField.tsx`)

增强的表单组件,支持实时验证和错误提示。

```tsx
import { FormField, Input, useFormValidation } from '@/components/ui'

function MyForm() {
  const { values, errors, handleChange, handleBlur, validate } = useFormValidation({
    email: '',
    password: ''
  })

  const validationRules = {
    email: {
      required: { value: true, message: '邮箱是必填项' },
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '请输入有效的邮箱地址'
      }
    },
    password: {
      required: { value: true, message: '密码是必填项' },
      minLength: { value: 8, message: '密码至少8个字符' }
    }
  }

  return (
    <form>
      <FormField
        label="Email"
        error={errors.email}
        required
        helperText="We'll never share your email"
      >
        <Input
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value, validationRules.email)}
          onBlur={() => handleBlur('email', validationRules.email)}
          error={!!errors.email}
        />
      </FormField>
    </form>
  )
}
```

**验证规则:**
- `required` - 必填字段
- `minLength` / `maxLength` - 长度限制
- `pattern` - 正则表达式验证
- `validate` - 自定义验证函数

---

### 7. 键盘导航 Hooks (`useKeyboardNavigation.ts`)

提供键盘导航和焦点管理功能。

```tsx
import { useKeyboardNavigation, useFocusTrap, useListNavigation } from '@/components/ui'

// 基础键盘导航
useKeyboardNavigation({
  onEnter: () => console.log('Enter pressed'),
  onEscape: () => closeModal(),
  onArrowUp: () => selectPrevious(),
  onArrowDown: () => selectNext()
})

// 焦点陷阱 (用于模态框)
const containerRef = useFocusTrap(true)

// 列表导航
const { selectedIndex, handleKeyDown, selectedItem } = useListNavigation(items, {
  onSelect: (item) => console.log(item),
  loop: true
})
```

---

### 8. 无障碍模态框 (`AccessibleModal.tsx`)

符合 WCAG 标准的模态框组件。

```tsx
import { AccessibleModal, ConfirmDialog } from '@/components/ui'

<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  description="Modal description for screen readers"
  size="md"
  closeOnEscape
  closeOnOverlayClick
>
  <p>Modal content</p>
</AccessibleModal>

// 确认对话框
<ConfirmDialog
  isOpen={isOpen}
  onClose={handleClose}
  onConfirm={handleConfirm}
  title="Delete conversation?"
  message="This action cannot be undone."
  variant="danger"
  confirmText="Delete"
  cancelText="Cancel"
/>
```

**特性:**
- ✅ 焦点陷阱 (Tab键循环)
- ✅ ESC 键关闭
- ✅ 锁定背景滚动
- ✅ ARIA 标签支持
- ✅ 键盘导航

---

### 9. Tooltip 提示组件 (`Tooltip.tsx`)

鼠标悬停提示信息。

```tsx
import { Tooltip, SimpleTooltip } from '@/components/ui'

// 使用 Popper.js 的完整版本
<Tooltip content="This is a tooltip" placement="top" delay={300}>
  <button>Hover me</button>
</Tooltip>

// 轻量级版本
<SimpleTooltip content="Simple tooltip" position="right">
  <button>Hover me</button>
</SimpleTooltip>
```

---

### 10. 涟漪效果 (`Ripple.tsx`)

Material Design 风格的点击涟漪效果。

```tsx
import { RippleButton, useRipple } from '@/components/ui'

// 使用 RippleButton
<RippleButton onClick={handleClick} className="...">
  Click me
</RippleButton>

// 自定义使用
function CustomButton() {
  const { addRipple, RippleContainer } = useRipple()

  return (
    <button onClick={addRipple} className="relative overflow-hidden">
      <RippleContainer />
      Click me
    </button>
  )
}
```

---

## 🎯 使用场景

### 场景 1: 提交表单时的用户反馈

```tsx
import { useToast, LoadingSpinner } from '@/components/ui'

function SubmitForm() {
  const { success, error } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await submitData()
      success('提交成功!', { description: '您的数据已保存' })
    } catch (err) {
      error('提交失败', { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button onClick={handleSubmit} disabled={isSubmitting}>
      {isSubmitting ? <LoadingSpinner size="sm" /> : '提交'}
    </button>
  )
}
```

### 场景 2: 文件上传进度

```tsx
import { ProgressBar } from '@/components/ui'

function FileUpload() {
  const [progress, setProgress] = useState(0)

  return (
    <div>
      <ProgressBar
        value={progress}
        variant={progress === 100 ? 'success' : 'default'}
        showLabel
        label="Uploading file..."
      />
    </div>
  )
}
```

### 场景 3: 空状态引导

```tsx
import { NoConversationsEmpty } from '@/components/ui'

function ConversationList({ conversations }) {
  if (conversations.length === 0) {
    return <NoConversationsEmpty onCreate={handleCreateNew} />
  }

  return <div>{/* 会话列表 */}</div>
}
```

### 场景 4: 键盘快捷键

```tsx
import { useKeyboardNavigation } from '@/components/ui'

function ChatInterface() {
  useKeyboardNavigation({
    onEnter: handleSendMessage,
    onEscape: handleClearInput,
    enabled: isInputFocused
  })

  return <div>{/* Chat UI */}</div>
}
```

---

## 🎨 设计原则

### 1. 一致性
所有组件遵循统一的设计语言:
- 统一的颜色系统
- 一致的动画时长 (0.2-0.3s)
- 统一的圆角 (rounded-lg: 0.5rem)
- 统一的阴影层级

### 2. 可访问性
- 所有交互元素支持键盘操作
- 使用语义化 HTML 和 ARIA 标签
- 支持屏幕阅读器
- 符合 WCAG 2.1 AA 标准

### 3. 性能优化
- 使用 Framer Motion 的硬件加速
- 懒加载和代码分割
- 避免不必要的重渲染
- 优化动画性能 (transform + opacity)

### 4. 响应式设计
- 所有组件支持移动端
- 触摸友好的交互目标 (最小 44x44px)
- 自适应布局

---

## 📊 组件对比

| 组件 | 文件大小 | 依赖 | 无障碍 | 动画 | 移动端 |
|------|---------|------|--------|------|--------|
| LoadingSpinner | ~1.5KB | Framer Motion | ✅ | ✅ | ✅ |
| ProgressBar | ~1.8KB | Framer Motion | ✅ | ✅ | ✅ |
| ErrorBoundary | ~2.5KB | Framer Motion | ✅ | ✅ | ✅ |
| Toast | ~2.2KB | Framer Motion | ✅ | ✅ | ✅ |
| EmptyState | ~1.5KB | Framer Motion, Lucide | ✅ | ✅ | ✅ |
| FormField | ~2.0KB | Framer Motion | ✅ | ✅ | ✅ |
| AccessibleModal | ~2.5KB | Framer Motion | ✅ | ✅ | ✅ |
| Tooltip | ~1.2KB | Popper.js | ✅ | ✅ | ✅ |
| Ripple | ~1.0KB | Framer Motion | ✅ | ✅ | ✅ |

---

## 🚀 最佳实践

### 1. 错误处理
```tsx
// ✅ Good: 使用 ErrorBoundary 包裹关键组件
<ErrorBoundary onError={reportToSentry}>
  <CriticalFeature />
</ErrorBoundary>

// ❌ Bad: 没有错误处理
<CriticalFeature />
```

### 2. 用户反馈
```tsx
// ✅ Good: 提供即时反馈
const handleSave = async () => {
  toast.info('Saving...')
  try {
    await save()
    toast.success('Saved!')
  } catch {
    toast.error('Failed to save')
  }
}

// ❌ Bad: 没有反馈
const handleSave = async () => {
  await save()
}
```

### 3. 加载状态
```tsx
// ✅ Good: 显示加载状态
{isLoading ? <LoadingSpinner /> : <Content />}

// ❌ Bad: 没有加载指示
<Content />
```

### 4. 空状态
```tsx
// ✅ Good: 提供引导操作
{items.length === 0 && <EmptyState action={{ label: 'Create', onClick: create }} />}

// ❌ Bad: 空白页面
{items.length === 0 && null}
```

---

## 📦 安装依赖

所有新组件使用的依赖已在项目中:

```json
{
  "framer-motion": "^10.16.4",
  "lucide-react": "^0.284.0",
  "class-variance-authority": "^0.7.0"
}
```

如需使用 Tooltip 的 Popper 版本,需添加:
```bash
npm install react-popper @popperjs/core
```

---

## 🎓 学习资源

- [Framer Motion 文档](https://www.framer.com/motion/)
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 动画](https://material.io/design/motion)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)

---

## 📝 更新日志

### v1.0.0 (2025-10-21)
- ✅ 新增 LoadingSpinner 组件
- ✅ 新增 ProgressBar 组件
- ✅ 新增 ErrorBoundary 组件
- ✅ 新增 Toast 通知系统
- ✅ 新增 EmptyState 组件
- ✅ 新增 FormField 和表单验证
- ✅ 新增键盘导航 Hooks
- ✅ 新增 AccessibleModal 组件
- ✅ 新增 Tooltip 组件
- ✅ 新增 Ripple 效果

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这些组件!

---

**AI Chat Studio UI/UX Team**
Made with ❤️ for better user experience
