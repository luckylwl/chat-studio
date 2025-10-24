interface InstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallOptions {
  autoPrompt?: boolean
  promptDelay?: number
  showCustomPrompt?: boolean
}

class PWAService {
  private static instance: PWAService
  private deferredPrompt: InstallPromptEvent | null = null
  private isInstalled = false
  private isStandalone = false
  private installPromptShown = false

  constructor() {
    this.initializePWA()
  }

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  private initializePWA() {
    if (typeof window === 'undefined') return

    // Check if app is installed
    this.checkInstallStatus()

    // Register service worker
    this.registerServiceWorker()

    // Listen for install prompt
    this.setupInstallPrompt()

    // Handle app updates
    this.handleAppUpdates()

    // Setup push notifications
    this.setupPushNotifications()

    // Track usage patterns
    this.trackUsagePatterns()
  }

  private checkInstallStatus() {
    // Check if running in standalone mode
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://')

    // Check if PWA is installed
    this.isInstalled = this.isStandalone ||
                      localStorage.getItem('pwa-installed') === 'true'

    if (this.isInstalled) {
      this.trackInstallation()
    }
  }

  private async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable()
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e as InstallPromptEvent
      console.log('Install prompt available')

      // Show custom install prompt after delay
      setTimeout(() => {
        if (!this.isInstalled && !this.installPromptShown) {
          this.showInstallPrompt()
        }
      }, 30000) // Show after 30 seconds
    })

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
      this.isInstalled = true
      localStorage.setItem('pwa-installed', 'true')
      this.trackInstallation()
      this.deferredPrompt = null
    })
  }

  private handleAppUpdates() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  private async setupPushNotifications() {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.log('Push notifications not supported')
      return
    }

    // Request permission for notifications
    if (Notification.permission === 'default') {
      setTimeout(async () => {
        try {
          const permission = await Notification.requestPermission()
          console.log('Notification permission:', permission)
        } catch (error) {
          console.error('Failed to request notification permission:', error)
        }
      }, 60000) // Request after 1 minute
    }
  }

  private trackUsagePatterns() {
    // Track when app is used
    const usage = JSON.parse(localStorage.getItem('app-usage') || '[]')
    usage.push({
      timestamp: Date.now(),
      url: window.location.pathname,
      standalone: this.isStandalone
    })

    // Keep only last 100 usage records
    const recentUsage = usage.slice(-100)
    localStorage.setItem('app-usage', JSON.stringify(recentUsage))
  }

  private trackInstallation() {
    try {
      const installData = {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        standalone: this.isStandalone,
        installSource: this.getInstallSource()
      }

      localStorage.setItem('pwa-install-data', JSON.stringify(installData))
      console.log('PWA installation tracked:', installData)
    } catch (error) {
      console.error('Failed to track installation:', error)
    }
  }

  private getInstallSource(): string {
    if (this.isStandalone) {
      if ((window.navigator as any).standalone) return 'ios-safari'
      if (document.referrer.includes('android-app://')) return 'android-chrome'
      return 'desktop-chrome'
    }
    return 'browser'
  }

  // Public API
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available')
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const choice = await this.deferredPrompt.userChoice

      console.log('Install prompt result:', choice)

      if (choice.outcome === 'accepted') {
        this.isInstalled = true
        localStorage.setItem('pwa-installed', 'true')
        return true
      }

      return false
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    } finally {
      this.deferredPrompt = null
    }
  }

  showInstallPrompt() {
    if (this.installPromptShown || this.isInstalled) return

    this.installPromptShown = true

    // Create custom install prompt
    const prompt = this.createInstallPrompt()
    document.body.appendChild(prompt)

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (prompt.parentNode) {
        prompt.remove()
      }
    }, 10000)
  }

  private createInstallPrompt(): HTMLElement {
    const prompt = document.createElement('div')
    prompt.className = 'pwa-install-prompt'
    prompt.innerHTML = `
      <div class="pwa-prompt-overlay">
        <div class="pwa-prompt-content">
          <div class="pwa-prompt-icon">📱</div>
          <h3>Install AI Chat Studio</h3>
          <p>Add this app to your home screen for a better experience!</p>
          <div class="pwa-prompt-buttons">
            <button class="pwa-prompt-install">Install</button>
            <button class="pwa-prompt-dismiss">Not now</button>
          </div>
        </div>
      </div>
    `

    // Add styles
    const style = document.createElement('style')
    style.textContent = `
      .pwa-install-prompt {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      }
      .pwa-prompt-overlay {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .pwa-prompt-content {
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 320px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        animation: pwa-prompt-slide-up 0.3s ease-out;
      }
      @keyframes pwa-prompt-slide-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .pwa-prompt-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      .pwa-prompt-content h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
      }
      .pwa-prompt-content p {
        margin: 0 0 20px 0;
        color: #666;
        line-height: 1.5;
      }
      .pwa-prompt-buttons {
        display: flex;
        gap: 12px;
      }
      .pwa-prompt-install,
      .pwa-prompt-dismiss {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .pwa-prompt-install {
        background: #007AFF;
        color: white;
      }
      .pwa-prompt-install:hover {
        background: #0056CC;
      }
      .pwa-prompt-dismiss {
        background: #F2F2F7;
        color: #1a1a1a;
      }
      .pwa-prompt-dismiss:hover {
        background: #E5E5EA;
      }
    `
    prompt.appendChild(style)

    // Add event listeners
    const installBtn = prompt.querySelector('.pwa-prompt-install') as HTMLElement
    const dismissBtn = prompt.querySelector('.pwa-prompt-dismiss') as HTMLElement

    installBtn.addEventListener('click', async () => {
      await this.promptInstall()
      prompt.remove()
    })

    dismissBtn.addEventListener('click', () => {
      prompt.remove()
    })

    prompt.addEventListener('click', (e) => {
      if (e.target === prompt.querySelector('.pwa-prompt-overlay')) {
        prompt.remove()
      }
    })

    return prompt
  }

  private showUpdateAvailable() {
    // Show update notification
    const notification = document.createElement('div')
    notification.className = 'pwa-update-notification'
    notification.innerHTML = `
      <div class="pwa-update-content">
        <span>A new version is available!</span>
        <button class="pwa-update-btn">Update</button>
      </div>
    `

    // Add styles
    const style = document.createElement('style')
    style.textContent = `
      .pwa-update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: #4CAF50;
        color: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: pwa-slide-in 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      }
      @keyframes pwa-slide-in {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .pwa-update-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .pwa-update-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .pwa-update-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `
    notification.appendChild(style)

    const updateBtn = notification.querySelector('.pwa-update-btn') as HTMLElement
    updateBtn.addEventListener('click', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      }
      notification.remove()
    })

    document.body.appendChild(notification)

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 10000)
  }

  // Getters
  get canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled
  }

  get installed(): boolean {
    return this.isInstalled
  }

  get standalone(): boolean {
    return this.isStandalone
  }

  // Utils
  getInstallData() {
    try {
      return JSON.parse(localStorage.getItem('pwa-install-data') || '{}')
    } catch {
      return {}
    }
  }

  getUsageData() {
    try {
      return JSON.parse(localStorage.getItem('app-usage') || '[]')
    } catch {
      return []
    }
  }
}

export const pwaService = PWAService.getInstance()
export default pwaService