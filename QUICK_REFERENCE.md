# 🚀 UI 组件快速参考指南

快速查找和使用 AI Chat Studio 的所有 UI 组件。

---

## 📦 导入方式

```tsx
import {
  // 加载状态
  LoadingSpinner,
  Skeleton,
  ProgressBar,

  // 反馈
  useToast,
  ToastContainer,

  // 空状态
  EmptyState,
  NoConversationsEmpty,

  // 表单
  FormField,
  Input,
  useFormValidation,

  // 交互
  AccessibleModal,
  Tooltip,
  RippleButton,

  // 错误处理
  ErrorBoundary,
} from '@/components/ui'
```

---

## ⚡ 快速示例

### 1. 显示加载状态

```tsx
// 旋转加载器
<LoadingSpinner size="md" label="Loading..." />

// 骨架屏
<Skeleton variant="text" width="200px" />
<Skeleton variant="rect" width="100%" height="100px" />

// 进度条
<ProgressBar value={65} variant="success" showLabel />
```

### 2. Toast 通知

```tsx
function MyComponent() {
  const { success, error, warning, info } = useToast()

  return (
    <button onClick={() => success('Success!')}>
      Show Toast
    </button>
  )
}

// 在 App.tsx 中添加容器
<ToastContainer toasts={toasts} onClose={closeToast} />
```

### 3. 空状态

```tsx
// 预设空状态
<NoConversationsEmpty onCreate={handleCreate} />

// 自定义空状态
<EmptyState
  title="No data"
  description="Create your first item"
  action={{ label: 'Create', onClick: handleCreate }}
/>
```

### 4. 表单验证

```tsx
function MyForm() {
  const { values, errors, handleChange, handleBlur } = useFormValidation({
    email: ''
  })

  const rules = {
    required: { value: true, message: 'Required' },
    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
  }

  return (
    <FormField label="Email" error={errors.email} required>
      <Input
        value={values.email}
        onChange={(e) => handleChange('email', e.target.value, rules)}
        onBlur={() => handleBlur('email', rules)}
      />
    </FormField>
  )
}
```

### 5. 模态框

```tsx
<AccessibleModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content</p>
</AccessibleModal>

// 确认对话框
<ConfirmDialog
  isOpen={isOpen}
  onClose={handleClose}
  onConfirm={handleConfirm}
  title="Delete?"
  message="This cannot be undone"
  variant="danger"
/>
```

### 6. 错误边界

```tsx
<ErrorBoundary onError={(error) => console.error(error)}>
  <YourComponent />
</ErrorBoundary>

// 或使用 HOC
const SafeComponent = withErrorBoundary(YourComponent)
```

### 7. Tooltip

```tsx
<Tooltip content="Helpful tip" placement="top">
  <button>Hover me</button>
</Tooltip>

// 简单版本
<SimpleTooltip content="Tip" position="right">
  <button>Hover me</button>
</SimpleTooltip>
```

### 8. 涟漪效果

```tsx
<RippleButton onClick={handleClick}>
  Click me
</RippleButton>

// 或自定义使用
const { addRipple, RippleContainer } = useRipple()

<button onClick={addRipple} className="relative overflow-hidden">
  <RippleContainer />
  Click me
</button>
```

### 9. 键盘导航

```tsx
useKeyboardNavigation({
  onEnter: handleSubmit,
  onEscape: handleClose,
  onArrowUp: selectPrevious,
  onArrowDown: selectNext,
})

// 焦点陷阱
const containerRef = useFocusTrap(true)
<div ref={containerRef}>...</div>

// 列表导航
const { selectedIndex, handleKeyDown } = useListNavigation(items, {
  onSelect: (item) => console.log(item),
  loop: true
})
```

---

## 🎨 组件速查表

| 需求 | 组件 | 示例 |
|------|------|------|
| 加载中 | LoadingSpinner | `<LoadingSpinner />` |
| 骨架屏 | Skeleton | `<Skeleton variant="text" />` |
| 进度条 | ProgressBar | `<ProgressBar value={50} />` |
| 通知 | Toast | `toast.success('Done!')` |
| 无数据 | EmptyState | `<NoConversationsEmpty />` |
| 表单 | FormField | `<FormField error={...}>` |
| 弹窗 | AccessibleModal | `<AccessibleModal isOpen>` |
| 确认 | ConfirmDialog | `<ConfirmDialog onConfirm>` |
| 提示 | Tooltip | `<Tooltip content="...">` |
| 错误 | ErrorBoundary | `<ErrorBoundary>` |
| 涟漪 | RippleButton | `<RippleButton>` |

---

## 🎯 常见场景

### 场景：提交表单

```tsx
const { success, error } = useToast()
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  try {
    await submitForm()
    success('Submitted!')
  } catch (err) {
    error('Failed to submit')
  } finally {
    setLoading(false)
  }
}

return (
  <button disabled={loading}>
    {loading ? <LoadingSpinner size="sm" /> : 'Submit'}
  </button>
)
```

### 场景：文件上传

```tsx
const [progress, setProgress] = useState(0)

return (
  <div>
    <ProgressBar
      value={progress}
      variant={progress === 100 ? 'success' : 'default'}
      showLabel
      label="Uploading..."
    />
  </div>
)
```

### 场景：列表为空

```tsx
function List({ items }) {
  if (items.length === 0) {
    return (
      <NoConversationsEmpty
        onCreate={() => navigate('/new')}
      />
    )
  }

  return <div>{/* Render items */}</div>
}
```

### 场景：删除确认

```tsx
const [showConfirm, setShowConfirm] = useState(false)

return (
  <>
    <button onClick={() => setShowConfirm(true)}>
      Delete
    </button>

    <ConfirmDialog
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={handleDelete}
      title="Delete conversation?"
      message="This action cannot be undone."
      variant="danger"
    />
  </>
)
```

---

## 🎨 Props 速查

### LoadingSpinner
```tsx
size?: 'sm' | 'md' | 'lg' | 'xl'
color?: 'primary' | 'secondary' | 'white'
label?: string
```

### ProgressBar
```tsx
value: number              // 0-100
variant?: 'default' | 'success' | 'warning' | 'error'
size?: 'sm' | 'md' | 'lg'
showLabel?: boolean
animated?: boolean
```

### Toast (via useToast)
```tsx
success(message, { description, duration, action })
error(message, options)
warning(message, options)
info(message, options)
```

### EmptyState
```tsx
icon?: LucideIcon
title: string
description?: string
action?: { label, onClick, icon }
variant?: 'default' | 'search' | 'error'
```

### FormField
```tsx
label?: string
error?: string | { message, type }
helperText?: string
required?: boolean
```

### AccessibleModal
```tsx
isOpen: boolean
onClose: () => void
title: string
description?: string
size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
closeOnEscape?: boolean
closeOnOverlayClick?: boolean
```

---

## 💡 最佳实践

### ✅ Do

```tsx
// 提供加载状态
{isLoading && <LoadingSpinner />}

// 处理错误
<ErrorBoundary>
  <Component />
</ErrorBoundary>

// 显示空状态
{items.length === 0 && <EmptyState />}

// 即时反馈
toast.success('Saved!')

// 实时验证
<FormField error={errors.field}>
  <Input onChange={handleChange} onBlur={handleBlur} />
</FormField>
```

### ❌ Don't

```tsx
// 没有加载指示
<Content />

// 没有错误处理
<Component />

// 空白的空状态
{items.length === 0 && null}

// 没有用户反馈
await save()

// 没有验证反馈
<Input onChange={handleChange} />
```

---

## 🔗 资源链接

- 📖 **完整文档:** [UI_UX_ENHANCEMENTS.md](./UI_UX_ENHANCEMENTS.md)
- 📊 **项目总结:** [PROJECT_ENHANCEMENTS_SUMMARY.md](./PROJECT_ENHANCEMENTS_SUMMARY.md)
- 📝 **更新日志:** [CHANGELOG.md](./CHANGELOG.md)

---

**快速开始，高效开发！**
