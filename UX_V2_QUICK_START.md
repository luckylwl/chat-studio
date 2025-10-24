# UX v2.0 快速上手指南

> 5 分钟快速集成所有新增的 UX 增强功能

---

## 🚀 3 步快速开始

### 步骤 1: 导入样式 (30 秒)

```typescript
// src/main.tsx
import '@/styles/accessibility.css'
```

### 步骤 2: 初始化服务 (1 分钟)

```typescript
// src/main.tsx
import offlineManager from '@/services/offlineManager'

async function initializeApp() {
  // 初始化离线管理器
  await offlineManager.initialize()

  // 启动应用
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

initializeApp()
```

### 步骤 3: 添加根组件 (3 分钟)

```typescript
// src/App.tsx
import ScreenReaderAnnouncer from '@/components/ScreenReaderAnnouncer'
import SkipLinks from '@/components/SkipLinks'
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator'
import PerformanceMonitor from '@/components/PerformanceMonitor'

function App() {
  return (
    <>
      {/* 可访问性 */}
      <SkipLinks />
      <ScreenReaderAnnouncer enabled={true} />

      {/* 性能监控 */}
      <NetworkStatusIndicator position="bottom-right" autoHide={true} />
      <PerformanceMonitor showFloatingButton={true} position="bottom-left" />

      {/* 主要内容 */}
      <main id="main-content">
        <Routes>
          {/* 你的路由 */}
        </Routes>
      </main>
    </>
  )
}
```

**完成!** 🎉 你的应用现在已经具备:
- ✅ 无障碍访问支持
- ✅ 网络状态监控
- ✅ 性能实时监控
- ✅ 屏幕阅读器优化

---

## 📦 组件快速使用

### 可访问性设置 ♿

**添加设置入口**:
```typescript
import AccessibilitySettings from '@/components/AccessibilitySettings'

function SettingsPage() {
  const [show, setShow] = useState(false)

  return (
    <>
      <button onClick={() => setShow(true)}>
        无障碍设置
      </button>

      <AccessibilitySettings
        isOpen={show}
        onClose={() => setShow(false)}
      />
    </>
  )
}
```

**屏幕阅读器公告**:
```typescript
import { announceToScreenReader } from '@/components/ScreenReaderAnnouncer'

// 在任何地方使用
announceToScreenReader('消息已发送', 'polite')
announceToScreenReader('连接已断开!', 'assertive')
```

---

### 移动端手势 📱

**添加手势支持**:
```typescript
import MobileGestureHandler from '@/components/MobileGestureHandler'

<MobileGestureHandler
  callbacks={{
    onSwipeLeft: () => deleteMessage(),
    onSwipeRight: () => archiveMessage(),
    onLongPress: (x, y) => showMenu(x, y),
    onDoubleTap: () => likeMessage(),
  }}
>
  <div className="message">
    {/* 消息内容 */}
  </div>
</MobileGestureHandler>
```

**底部菜单**:
```typescript
import MobileActionSheet from '@/components/MobileActionSheet'

const sections = [
  {
    id: 'actions',
    items: [
      {
        id: 'copy',
        label: '复制',
        onClick: handleCopy,
        icon: CopyIcon
      },
    ],
  },
]

<MobileActionSheet
  isOpen={showMenu}
  onClose={() => setShowMenu(false)}
  sections={sections}
  title="操作"
/>
```

**下拉刷新**:
```typescript
import PullToRefresh from '@/components/PullToRefresh'

<PullToRefresh
  onRefresh={async () => await fetchLatest()}
>
  <MessageList />
</PullToRefresh>
```

---

### AI 智能建议 🧠

**智能输入建议**:
```typescript
import AISmartSuggestions from '@/components/AISmartSuggestions'

<AISmartSuggestions
  context={{
    currentInput: input,
    conversationHistory: messages,
    recentTopics: ['React', 'AI'],
  }}
  onSuggestionSelect={(s) => setInput(s.text)}
  maxSuggestions={3}
  learningEnabled={true}
/>
```

**命令推荐**:
```typescript
import SmartCommandRecommender from '@/components/SmartCommandRecommender'

const commands = [
  {
    id: 'code',
    name: '/code',
    description: '生成代码',
    icon: '💻',
    category: '开发',
    keywords: ['code'],
  },
]

<SmartCommandRecommender
  commands={commands}
  onCommandSelect={executeCommand}
  currentContext={input}
/>
```

**用户行为学习**:
```typescript
import userBehaviorLearning from '@/services/userBehaviorLearning'

// 记录用户操作
userBehaviorLearning.recordAction('message_sent', {
  topic: 'React',
  length: message.length,
})

// 获取推荐
const recs = userBehaviorLearning.getPersonalizedRecommendations()
console.log(recs.suggestedCommands) // ['/code', '/debug']
```

---

### 实时协作 👥

```typescript
import RealtimeCollaboration from '@/components/RealtimeCollaboration'

<RealtimeCollaboration
  conversationId={conversationId}
  currentUser={{
    id: currentUser.id,
    name: currentUser.name,
    color: '#3b82f6',
    status: 'active',
  }}
  websocketUrl="wss://your-api.com/collab"
  enabled={true}
/>
```

---

### 性能优化 ⚡

**网络状态**:
```typescript
// 已在根组件添加,无需额外配置
// 自动监控网络状态并显示提示
```

**离线存储**:
```typescript
import offlineManager from '@/services/offlineManager'

// 保存对话
await offlineManager.saveConversation({
  id: 'conv-1',
  title: '对话标题',
  messages: [...],
  lastModified: Date.now(),
  syncStatus: 'pending',
})

// 获取对话
const conv = await offlineManager.getConversation('conv-1')

// 添加待同步操作
await offlineManager.addPendingAction('send_message', {
  conversationId: 'conv-1',
  message: 'Hello',
})
```

**渐进式加载**:
```typescript
import ProgressiveLoader from '@/components/ProgressiveLoader'

<ProgressiveLoader
  loadData={async (page, size) => {
    const res = await fetch(`/api/messages?page=${page}&size=${size}`)
    return res.json()
  }}
  pageSize={20}
  renderItem={(message, index) => (
    <MessageCard key={message.id} message={message} />
  )}
  threshold={200}
  preloadPages={1}
/>
```

---

## ⚙️ 常用配置

### 可访问性配置

```typescript
// 在 AccessibilitySettings 组件中配置
// 用户可以通过 UI 自行调整,无需代码配置

// 如需程序化配置:
localStorage.setItem('accessibility-config', JSON.stringify({
  visual: {
    fontSize: 'large',
    highContrast: true,
    reducedMotion: false,
  },
  screenReader: {
    enabled: true,
  },
}))
```

### 手势配置

```typescript
<MobileGestureHandler
  config={{
    swipeThreshold: 60,      // 滑动距离阈值
    swipeVelocity: 0.4,      // 滑动速度阈值
    longPressDelay: 600,     // 长按延迟
    doubleTapDelay: 250,     // 双击间隔
  }}
  callbacks={...}
>
```

### 性能监控配置

```typescript
<PerformanceMonitor
  showFloatingButton={true}
  position="bottom-left"
  // 警告阈值
  warningThresholds={{
    fps: 30,        // FPS 低于 30 警告
    memory: 80,     // 内存超过 80% 警告
    latency: 1000,  // 延迟超过 1000ms 警告
  }}
/>
```

---

## 🎯 5 个典型场景

### 场景 1: 发送消息后提示

```typescript
import { announceToScreenReader } from '@/components/ScreenReaderAnnouncer'
import userBehaviorLearning from '@/services/userBehaviorLearning'

const sendMessage = async (message: string) => {
  // 记录用户行为
  userBehaviorLearning.recordAction('message_sent', {
    length: message.length,
    timestamp: Date.now(),
  })

  // 发送消息
  await api.sendMessage(message)

  // 屏幕阅读器提示
  announceToScreenReader('消息已发送', 'polite')
}
```

### 场景 2: 移动端长按显示菜单

```typescript
<MobileGestureHandler
  callbacks={{
    onLongPress: (x, y) => {
      setMenuPosition({ x, y })
      setShowMenu(true)
    },
  }}
>
  <MessageCard message={message} />
</MobileGestureHandler>

<MobileActionSheet
  isOpen={showMenu}
  onClose={() => setShowMenu(false)}
  sections={menuSections}
/>
```

### 场景 3: 智能命令建议

```typescript
function CommandInput() {
  const [input, setInput] = useState('')

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {input.startsWith('/') && (
        <SmartCommandRecommender
          commands={allCommands}
          currentContext={input}
          onCommandSelect={(cmd) => {
            setInput(cmd.name + ' ')
            userBehaviorLearning.recordAction('command_executed', {
              command: cmd.name,
            })
          }}
        />
      )}
    </div>
  )
}
```

### 场景 4: 离线消息队列

```typescript
const sendMessageWithOffline = async (message: string) => {
  if (navigator.onLine) {
    // 在线,直接发送
    await api.sendMessage(message)
  } else {
    // 离线,加入队列
    await offlineManager.addPendingAction('send_message', {
      message,
      timestamp: Date.now(),
    })

    announceToScreenReader('消息已加入离线队列', 'polite')
  }
}
```

### 场景 5: 无限滚动加载历史

```typescript
<ProgressiveLoader
  loadData={async (page, size) => {
    return await fetchMessageHistory(conversationId, page, size)
  }}
  pageSize={20}
  renderItem={(msg) => <MessageCard message={msg} />}
  threshold={300}
  loadingComponent={<LoadingSpinner />}
  emptyComponent={<EmptyState title="没有更多消息" />}
/>
```

---

## 🔍 故障排查

### 问题: 组件导入失败

**检查**:
```bash
# 确保所有组件文件存在
ls src/components/AccessibilitySettings.tsx
ls src/components/ScreenReaderAnnouncer.tsx
# ... 等等

# 确保样式文件存在
ls src/styles/accessibility.css
```

### 问题: TypeScript 类型错误

**解决**:
```typescript
// 确保导入了类型
import type { AccessibilityConfig } from '@/components/AccessibilitySettings'
import type { NetworkStatus } from '@/components/NetworkStatusIndicator'

// 或者使用 any 临时绕过(不推荐)
const config: any = { ... }
```

### 问题: 服务未初始化

**检查**:
```typescript
// 确保在 main.tsx 中初始化
await offlineManager.initialize()

// 检查初始化状态
const status = offlineManager.getSyncStatus()
console.log('Initialized:', status.isOnline)
```

---

## 📚 下一步

- 📖 阅读完整文档: `UX_ENHANCEMENTS_V2.md`
- 📊 查看实现总结: `UX_IMPLEMENTATION_SUMMARY.md`
- 🎨 自定义组件样式和配置
- 🧪 编写测试用例
- 🚀 部署到生产环境

---

## 🆘 获取帮助

- 📖 **文档**: 查看项目根目录的 `UX_ENHANCEMENTS_V2.md`
- 🐛 **问题**: 提交 GitHub Issue
- 💬 **讨论**: GitHub Discussions

---

**恭喜!** 🎉 你已经成功集成了所有 UX v2.0 增强功能!

**现在你的应用拥有**:
- ♿ 完整的无障碍支持
- 📱 原生级移动端体验
- 🧠 AI 智能化功能
- 👥 实时协作能力
- ⚡ 高性能离线支持

**开始享受提升的用户体验吧!** 🚀
