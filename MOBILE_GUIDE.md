# 📱 AI Chat Studio - 移动端使用指南

欢迎使用 AI Chat Studio 移动版！本指南将帮助你在移动设备上获得最佳体验。

---

## 📖 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [移动端优化](#移动端优化)
- [手势操作](#手势操作)
- [PWA 安装](#pwa-安装)
- [移动端组件](#移动端组件)
- [故障排查](#故障排查)
- [最佳实践](#最佳实践)

---

## ✨ 功能特性

### 响应式设计
- ✅ 自动适配 320px - 768px 屏幕
- ✅ 支持竖屏和横屏
- ✅ iOS 安全区域支持 (刘海屏)
- ✅ Android 导航栏适配

### 移动端专属 UI
- ✅ 底部固定输入栏
- ✅ 滑动抽屉菜单
- ✅ 触摸优化的按钮 (44px 最小尺寸)
- ✅ 移动端友好的消息气泡

### 手势支持
- ✅ 滑动 (左/右/上/下)
- ✅ 长按
- ✅ 双击
- ✅ 捏合缩放

### PWA 功能
- ✅ 可安装到主屏幕
- ✅ 离线支持
- ✅ 应用快捷方式
- ✅ iOS 启动画面

---

## 🚀 快速开始

### 1. 访问应用

使用移动浏览器访问:
```
https://your-domain.com
```

推荐浏览器:
- iOS: Safari
- Android: Chrome

### 2. 添加到主屏幕

#### iOS (Safari)
1. 点击底部分享按钮 📤
2. 选择"添加到主屏幕"
3. 点击"添加"

#### Android (Chrome)
1. 点击右上角菜单 ⋮
2. 选择"安装应用"或"添加到主屏幕"
3. 点击"安装"

### 3. 开始使用

安装后，应用会像原生 App 一样运行：
- 无浏览器地址栏
- 全屏体验
- 独立图标
- 离线支持

---

## 📐 移动端优化

### 屏幕尺寸适配

应用自动适配以下设备:

| 设备类型 | 屏幕宽度 | 布局 |
|---------|---------|------|
| 小屏手机 | 320px - 374px | 紧凑布局 |
| 中屏手机 | 375px - 413px | 标准布局 |
| 大屏手机 | 414px - 767px | 宽松布局 |
| 平板 | 768px+ | 桌面布局 |

### iOS 安全区域

自动处理刘海屏和圆角：

```css
/* 顶部安全区域 */
.header {
  padding-top: env(safe-area-inset-top);
}

/* 底部安全区域 */
.footer {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 触摸目标优化

所有可点击元素最小 44px × 44px：
- ✅ 按钮
- ✅ 链接
- ✅ 复选框
- ✅ 单选按钮

### 性能优化

移动端专属优化：
- ✅ 虚拟滚动 (支持 10,000+ 消息)
- ✅ 惯性滚动
- ✅ 硬件加速动画
- ✅ 图片懒加载

---

## 🖐️ 手势操作

### 滑动手势

#### 使用 `useSwipe` Hook

```tsx
import { useSwipe } from '@/hooks/useSwipe'

function MyComponent() {
  const { ref, swipeState } = useSwipe({
    onSwipeLeft: () => console.log('向左滑动'),
    onSwipeRight: () => console.log('向右滑动'),
    onSwipeUp: () => console.log('向上滑动'),
    onSwipeDown: () => console.log('向下滑动'),
  }, {
    minSwipeDistance: 50,  // 最小滑动距离 (px)
    maxSwipeTime: 300      // 最大滑动时间 (ms)
  })

  return <div ref={ref}>滑动我</div>
}
```

#### 配置选项

```typescript
interface SwipeConfig {
  minSwipeDistance?: number    // 最小滑动距离 (默认: 50px)
  maxSwipeTime?: number        // 最大滑动时间 (默认: 300ms)
  preventDefaultTouchmoveEvent?: boolean  // 阻止默认触摸事件
  trackTouch?: boolean         // 跟踪触摸 (默认: true)
  trackMouse?: boolean         // 跟踪鼠标 (默认: false)
}
```

### 长按手势

```tsx
import { useLongPress } from '@/hooks/useSwipe'

function MyComponent() {
  const ref = useLongPress(() => {
    console.log('长按触发')
  }, 500)  // 500ms

  return <button ref={ref}>长按我</button>
}
```

### 双击手势

```tsx
import { useDoubleTap } from '@/hooks/useSwipe'

function MyComponent() {
  const ref = useDoubleTap(() => {
    console.log('双击触发')
  }, 300)  // 300ms 间隔

  return <div ref={ref}>双击我</div>
}
```

### 捏合缩放

```tsx
import { usePinch } from '@/hooks/useSwipe'

function MyComponent() {
  const ref = usePinch((scale) => {
    console.log('缩放比例:', scale)
  })

  return <div ref={ref}>捏合缩放我</div>
}
```

---

## 📲 PWA 安装

### 检查 PWA 支持

```typescript
// 检查浏览器是否支持 PWA
const isPWASupported = 'serviceWorker' in navigator
```

### 监听安装事件

```typescript
window.addEventListener('beforeinstallprompt', (e) => {
  // 阻止默认安装提示
  e.preventDefault()

  // 保存事件，稍后使用
  deferredPrompt = e

  // 显示自定义安装按钮
  showInstallButton()
})
```

### 触发安装

```typescript
const installButton = document.getElementById('install')
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return

  // 显示安装提示
  deferredPrompt.prompt()

  // 等待用户响应
  const { outcome } = await deferredPrompt.userChoice

  if (outcome === 'accepted') {
    console.log('用户接受安装')
  }

  deferredPrompt = null
})
```

### 检查安装状态

```typescript
// 检查是否已安装为 PWA
const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true
```

---

## 🎨 移动端组件

### 1. MobileLayout 组件

主移动端布局组件。

#### 使用方法

```tsx
import { MobileLayout } from '@/components/MobileLayout'

<MobileLayout
  conversations={conversations}
  currentConversation={currentConversation}
  messages={messages}
  onSendMessage={handleSend}
  onCreateConversation={handleCreate}
  onSelectConversation={handleSelect}
  onDeleteConversation={handleDelete}
/>
```

#### 特性

- ✅ 滑动抽屉侧边栏
- ✅ 底部固定输入栏
- ✅ iOS 安全区域支持
- ✅ 触摸优化的 UI

### 2. useResponsive Hook

检测设备类型和屏幕尺寸。

#### 使用方法

```tsx
import { useResponsive } from '@/hooks/useResponsive'

function MyComponent() {
  const {
    isMobile,      // 是否移动端 (< 768px)
    isTablet,      // 是否平板 (768px - 1024px)
    isDesktop,     // 是否桌面 (> 1024px)
    deviceType,    // 'mobile' | 'tablet' | 'desktop'
    screenSize,    // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    orientation,   // 'portrait' | 'landscape'
    isTouch,       // 是否触摸设备
    width,         // 屏幕宽度
    height         // 屏幕高度
  } = useResponsive()

  if (isMobile) {
    return <MobileLayout />
  }

  return <DesktopLayout />
}
```

### 3. useMediaQuery Hook

使用媒体查询。

```tsx
import { useMediaQuery } from '@/hooks/useResponsive'

function MyComponent() {
  const isSmallScreen = useMediaQuery('(max-width: 640px)')
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const isLandscape = useMediaQuery('(orientation: landscape)')

  return (
    <div>
      {isSmallScreen && <SmallScreenUI />}
      {isDarkMode && <DarkModeIndicator />}
      {isLandscape && <LandscapeWarning />}
    </div>
  )
}
```

### 4. useViewportHeight Hook

获取真实视口高度 (排除移动端浏览器工具栏)。

```tsx
import { useViewportHeight } from '@/hooks/useResponsive'

function MyComponent() {
  const viewportHeight = useViewportHeight()

  return (
    <div style={{ height: `${viewportHeight}px` }}>
      全屏内容
    </div>
  )
}
```

### 5. useSafeArea Hook

获取 iOS 安全区域内边距。

```tsx
import { useSafeArea } from '@/hooks/useResponsive'

function MyComponent() {
  const safeArea = useSafeArea()

  return (
    <div style={{
      paddingTop: safeArea.top,
      paddingRight: safeArea.right,
      paddingBottom: safeArea.bottom,
      paddingLeft: safeArea.left
    }}>
      内容
    </div>
  )
}
```

---

## 🎨 移动端样式类

### 安全区域类

```html
<!-- 顶部安全区域 -->
<header class="safe-top">...</header>

<!-- 底部安全区域 -->
<footer class="safe-bottom">...</footer>

<!-- 所有安全区域 -->
<div class="safe-all">...</div>

<!-- 安全区域高度 -->
<div class="h-safe-bottom"></div>
```

### 触摸优化类

```html
<!-- 可触摸元素 -->
<button class="touchable">点击</button>

<!-- 触摸涟漪效果 -->
<button class="touch-ripple">按钮</button>

<!-- 禁用触摸反馈 -->
<button class="no-touch-feedback">按钮</button>

<!-- 禁用长按菜单 -->
<div class="no-context-menu">内容</div>
```

### 滚动优化类

```html
<!-- 惯性滚动 -->
<div class="momentum-scroll">...</div>

<!-- 隐藏滚动条 -->
<div class="hide-scrollbar">...</div>
```

### 布局类

```html
<!-- 全屏容器 -->
<div class="mobile-fullscreen">...</div>

<!-- 固定头部 -->
<header class="mobile-header-fixed">...</header>

<!-- 固定底部 -->
<footer class="mobile-footer-fixed">...</footer>

<!-- 内容区域 -->
<main class="mobile-content">...</main>
```

### 字体大小类

```html
<p class="text-mobile-xs">超小文字 (12px)</p>
<p class="text-mobile-sm">小文字 (14px)</p>
<p class="text-mobile-base">标准文字 (16px)</p>
<p class="text-mobile-lg">大文字 (18px)</p>
<p class="text-mobile-xl">超大文字 (20px)</p>
```

### 响应式工具类

```html
<!-- 仅移动端显示 -->
<div class="mobile-only">移动端内容</div>

<!-- 仅桌面端显示 -->
<div class="desktop-only">桌面端内容</div>

<!-- 仅平板端显示 -->
<div class="tablet-only">平板端内容</div>
```

---

## 🐛 故障排查

### 问题 1: 安全区域不生效

**症状**: iOS 刘海屏遮挡内容

**解决方法**:

1. 检查 viewport meta 标签:
```html
<meta name="viewport" content="viewport-fit=cover" />
```

2. 使用 CSS 环境变量:
```css
padding-top: env(safe-area-inset-top);
```

### 问题 2: 滑动不流畅

**症状**: 滚动卡顿

**解决方法**:

1. 添加惯性滚动:
```css
-webkit-overflow-scrolling: touch;
```

2. 使用虚拟滚动组件

### 问题 3: 输入框被键盘遮挡

**症状**: 输入框被虚拟键盘覆盖

**解决方法**:

1. 使用 `visualViewport` API:
```typescript
const height = window.visualViewport?.height || window.innerHeight
```

2. 监听视口变化:
```typescript
window.visualViewport?.addEventListener('resize', updateHeight)
```

### 问题 4: 字体太小导致缩放

**症状**: iOS 自动放大输入框

**解决方法**:

设置最小字体 16px:
```css
input, textarea {
  font-size: 16px;
}
```

### 问题 5: PWA 无法安装

**症状**: 没有安装提示

**检查清单**:

1. ✅ 是否使用 HTTPS
2. ✅ manifest.json 是否正确
3. ✅ Service Worker 是否注册
4. ✅ 是否满足最小要求 (start_url, icons 等)

---

## 💡 最佳实践

### 1. 性能优化

#### 使用虚拟滚动
```tsx
import { VirtualizedMessageList } from '@/components/VirtualizedMessageList'

<VirtualizedMessageList
  messages={messages}
  height={600}
  itemSize={80}
/>
```

#### 懒加载图片
```tsx
<img
  loading="lazy"
  src={url}
  alt={alt}
/>
```

#### 防抖和节流
```tsx
import { useDebounce } from '@/hooks/useDebounce'

const debouncedSearch = useDebounce(searchTerm, 300)
```

### 2. 用户体验

#### 提供触摸反馈
```tsx
<button className="touchable">
  点击我
</button>
```

#### 显示加载状态
```tsx
{isLoading && (
  <div className="mobile-loading">
    <div className="mobile-loading-spinner" />
  </div>
)}
```

#### 使用骨架屏
```tsx
<div className="mobile-skeleton" style={{ height: '80px' }} />
```

### 3. 无障碍

#### 添加 ARIA 标签
```tsx
<button aria-label="发送消息">
  <SendIcon />
</button>
```

#### 支持键盘导航
```tsx
<input
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }}
/>
```

### 4. 离线支持

#### 缓存关键资源
```typescript
// service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles/main.css',
        '/scripts/main.js'
      ])
    })
  )
})
```

#### 提供离线提示
```tsx
const isOnline = useOnlineStatus()

{!isOnline && (
  <div className="offline-banner">
    您当前处于离线状态
  </div>
)}
```

---

## 📚 相关文档

- [项目入门指南](./START_HERE.md)
- [完整功能文档](./COMPLETE_FEATURE_UPDATE.md)
- [性能优化指南](./PROJECT_COMPLETE_SUMMARY.md)

---

## 🎯 总结

AI Chat Studio 移动版提供了完整的移动端体验：

✅ **响应式设计** - 自动适配所有屏幕尺寸
✅ **手势支持** - 滑动、长按、双击、捏合
✅ **PWA 功能** - 可安装、离线支持
✅ **性能优化** - 虚拟滚动、懒加载
✅ **iOS 优化** - 安全区域、启动画面
✅ **触摸优化** - 44px 最小触摸目标

立即在移动设备上试用，享受流畅的 AI 对话体验！

---

**Happy Chatting! 📱**
