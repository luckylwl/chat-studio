interface BundleInfo {
  chunkName: string
  size: number
  loadTime?: number
  dependencies: string[]
}

interface PerformanceMetrics {
  totalBundleSize: number
  initialLoadTime: number
  chunkLoadTimes: Record<string, number>
  memoryUsage: number
  renderTime: number
}

class BundleAnalyzer {
  private static instance: BundleAnalyzer
  private bundleInfo: BundleInfo[] = []
  private performanceMetrics: PerformanceMetrics = {
    totalBundleSize: 0,
    initialLoadTime: 0,
    chunkLoadTimes: {},
    memoryUsage: 0,
    renderTime: 0
  }

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer()
    }
    return BundleAnalyzer.instance
  }

  constructor() {
    this.initializeAnalysis()
  }

  private initializeAnalysis() {
    if (typeof window !== 'undefined') {
      // Analyze initial bundle size
      this.analyzeInitialBundle()

      // Monitor chunk loading
      this.monitorChunkLoading()

      // Monitor performance metrics
      this.monitorPerformanceMetrics()

      // Report bundle analysis periodically
      setInterval(() => {
        this.reportBundleAnalysis()
      }, 30000) // Every 30 seconds
    }
  }

  private analyzeInitialBundle() {
    // Estimate bundle size from script tags
    const scripts = document.querySelectorAll('script[src]')
    let totalSize = 0

    scripts.forEach((script) => {
      const src = script.getAttribute('src')
      if (src && src.includes('assets')) {
        // Estimate size based on filename patterns
        const estimatedSize = this.estimateFileSize(src)
        totalSize += estimatedSize

        this.bundleInfo.push({
          chunkName: this.extractChunkName(src),
          size: estimatedSize,
          dependencies: []
        })
      }
    })

    this.performanceMetrics.totalBundleSize = totalSize
  }

  private estimateFileSize(filename: string): number {
    // Basic heuristics for estimating file sizes
    if (filename.includes('vendor')) return 250 * 1024 // ~250KB
    if (filename.includes('chunk')) return 50 * 1024   // ~50KB
    if (filename.includes('index')) return 100 * 1024  // ~100KB
    return 30 * 1024 // Default ~30KB
  }

  private extractChunkName(src: string): string {
    const match = src.match(/\/([^\/]+)\.js$/)
    return match ? match[1] : 'unknown'
  }

  private monitorChunkLoading() {
    // Monitor dynamic imports
    const originalImport = window.__viteOriginalImport || window.import

    window.__viteOriginalImport = async (url: string) => {
      const startTime = performance.now()

      try {
        const result = await originalImport(url)
        const loadTime = performance.now() - startTime

        const chunkName = this.extractChunkName(url)
        this.performanceMetrics.chunkLoadTimes[chunkName] = loadTime

        console.log(`Chunk loaded: ${chunkName} in ${loadTime.toFixed(2)}ms`)

        return result
      } catch (error) {
        console.error(`Failed to load chunk: ${url}`, error)
        throw error
      }
    }
  }

  private monitorPerformanceMetrics() {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.performanceMetrics.memoryUsage = memory.usedJSHeapSize
      }, 5000)
    }

    // Monitor render performance
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'measure' && entry.name.includes('render')) {
              this.performanceMetrics.renderTime = entry.duration
            }
          })
        })

        observer.observe({ entryTypes: ['measure'] })
      } catch (error) {
        console.warn('Performance observer not fully supported')
      }
    }
  }

  private reportBundleAnalysis() {
    const report = {
      bundleInfo: this.bundleInfo,
      performanceMetrics: this.performanceMetrics,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    }

    // Store report locally
    try {
      const reports = JSON.parse(localStorage.getItem('bundleAnalysisReports') || '[]')
      reports.push(report)

      // Keep only last 10 reports
      const recentReports = reports.slice(-10)
      localStorage.setItem('bundleAnalysisReports', JSON.stringify(recentReports))
    } catch (error) {
      console.error('Failed to store bundle analysis report:', error)
    }

    // Log performance insights
    if (this.performanceMetrics.totalBundleSize > 1024 * 1024) { // > 1MB
      console.warn(`Bundle size warning: ${(this.performanceMetrics.totalBundleSize / 1024 / 1024).toFixed(2)}MB`)
    }

    return report
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    // Bundle size recommendations
    if (this.performanceMetrics.totalBundleSize > 1024 * 1024) {
      recommendations.push('Consider code splitting to reduce initial bundle size')
    }

    // Chunk loading recommendations
    const slowChunks = Object.entries(this.performanceMetrics.chunkLoadTimes)
      .filter(([_, time]) => time > 1000)
      .map(([chunk]) => chunk)

    if (slowChunks.length > 0) {
      recommendations.push(`Slow loading chunks detected: ${slowChunks.join(', ')}`)
    }

    // Memory recommendations
    if (this.performanceMetrics.memoryUsage > 50 * 1024 * 1024) { // > 50MB
      recommendations.push('High memory usage detected - consider optimizing component lifecycle')
    }

    // Render performance recommendations
    if (this.performanceMetrics.renderTime > 100) {
      recommendations.push('Slow render times detected - consider memoization or virtualization')
    }

    return recommendations
  }

  // Public API
  getBundleInfo(): BundleInfo[] {
    return [...this.bundleInfo]
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  getStoredReports(): any[] {
    try {
      return JSON.parse(localStorage.getItem('bundleAnalysisReports') || '[]')
    } catch {
      return []
    }
  }

  clearStoredReports(): void {
    try {
      localStorage.removeItem('bundleAnalysisReports')
    } catch (error) {
      console.error('Failed to clear bundle analysis reports:', error)
    }
  }

  // Force analysis and return current report
  analyzeNow(): any {
    return this.reportBundleAnalysis()
  }
}

// Utility functions for bundle optimization
export const preloadRoute = async (routePath: string): Promise<void> => {
  const routeModules: Record<string, () => Promise<any>> = {
    '/chat': () => import('@/pages/ChatPage'),
    '/settings': () => import('@/pages/SettingsPage'),
    '/advanced': () => import('@/pages/AdvancedFeaturesPage'),
    '/setup': () => import('@/pages/QuickSetup')
  }

  const loadModule = routeModules[routePath]
  if (loadModule) {
    try {
      await loadModule()
      console.log(`Preloaded route: ${routePath}`)
    } catch (error) {
      console.error(`Failed to preload route ${routePath}:`, error)
    }
  }
}

export const preloadComponent = async (componentName: string): Promise<void> => {
  const componentModules: Record<string, () => Promise<any>> = {
    'VoiceControl': () => import('@/components/VoiceControl'),
    'PerformanceDashboard': () => import('@/components/PerformanceDashboard'),
    'ExportButton': () => import('@/components/ExportButton'),
    'AdvancedSearch': () => import('@/components/AdvancedSearch'),
    'DragDropUpload': () => import('@/components/DragDropUpload')
  }

  const loadModule = componentModules[componentName]
  if (loadModule) {
    try {
      await loadModule()
      console.log(`Preloaded component: ${componentName}`)
    } catch (error) {
      console.error(`Failed to preload component ${componentName}:`, error)
    }
  }
}

export const bundleAnalyzer = BundleAnalyzer.getInstance()
export default bundleAnalyzer