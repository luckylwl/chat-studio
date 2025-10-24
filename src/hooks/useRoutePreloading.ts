import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { preloadRoute, preloadComponent, bundleAnalyzer } from '@/utils/bundleAnalysis'

interface RoutePreloadingOptions {
  preloadOnHover?: boolean
  preloadAdjacent?: boolean
  preloadPopular?: boolean
  componentPreloading?: boolean
}

export const useRoutePreloading = (options: RoutePreloadingOptions = {}) => {
  const location = useLocation()
  const {
    preloadOnHover = true,
    preloadAdjacent = true,
    preloadPopular = true,
    componentPreloading = true
  } = options

  // Track route navigation patterns
  const trackRouteUsage = useCallback((route: string) => {
    try {
      const usage = JSON.parse(localStorage.getItem('routeUsage') || '{}')
      usage[route] = (usage[route] || 0) + 1
      localStorage.setItem('routeUsage', JSON.stringify(usage))
    } catch (error) {
      console.error('Failed to track route usage:', error)
    }
  }, [])

  // Get popular routes based on usage
  const getPopularRoutes = useCallback((): string[] => {
    try {
      const usage = JSON.parse(localStorage.getItem('routeUsage') || '{}')
      return Object.entries(usage)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([route]) => route)
    } catch {
      return ['/chat', '/settings']
    }
  }, [])

  // Get adjacent routes based on current location
  const getAdjacentRoutes = useCallback((currentRoute: string): string[] => {
    const routeMap: Record<string, string[]> = {
      '/chat': ['/settings', '/advanced'],
      '/settings': ['/chat', '/advanced'],
      '/advanced': ['/chat', '/settings'],
      '/setup': ['/chat']
    }

    return routeMap[currentRoute] || []
  }, [])

  // Preload route on hover
  const handleLinkHover = useCallback(async (event: MouseEvent) => {
    if (!preloadOnHover) return

    const target = event.target as HTMLElement
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement

    if (link) {
      const href = link.getAttribute('href')
      if (href) {
        await preloadRoute(href)
      }
    }
  }, [preloadOnHover])

  // Setup hover preloading
  useEffect(() => {
    if (!preloadOnHover) return

    document.addEventListener('mouseover', handleLinkHover)
    return () => document.removeEventListener('mouseover', handleLinkHover)
  }, [handleLinkHover, preloadOnHover])

  // Preload adjacent routes
  useEffect(() => {
    if (!preloadAdjacent) return

    const adjacent = getAdjacentRoutes(location.pathname)
    adjacent.forEach(route => {
      setTimeout(() => preloadRoute(route), 1000) // Delay to avoid blocking initial render
    })
  }, [location.pathname, preloadAdjacent, getAdjacentRoutes])

  // Preload popular routes
  useEffect(() => {
    if (!preloadPopular) return

    const popular = getPopularRoutes()
    popular.forEach(route => {
      if (route !== location.pathname) {
        setTimeout(() => preloadRoute(route), 2000) // Delay for popular routes
      }
    })
  }, [preloadPopular, getPopularRoutes, location.pathname])

  // Preload components based on current route
  useEffect(() => {
    if (!componentPreloading) return

    const routeComponents: Record<string, string[]> = {
      '/chat': ['VoiceControl', 'ExportButton', 'DragDropUpload'],
      '/settings': ['PerformanceDashboard'],
      '/advanced': ['AdvancedSearch', 'ExportButton']
    }

    const components = routeComponents[location.pathname] || []
    components.forEach(component => {
      setTimeout(() => preloadComponent(component), 500)
    })
  }, [location.pathname, componentPreloading])

  // Track current route usage
  useEffect(() => {
    trackRouteUsage(location.pathname)
  }, [location.pathname, trackRouteUsage])

  return {
    preloadRoute,
    preloadComponent,
    trackRouteUsage,
    getPopularRoutes,
    getAdjacentRoutes
  }
}

// Hook for intelligent preloading based on user behavior
export const useIntelligentPreloading = () => {
  const location = useLocation()

  useEffect(() => {
    // Analyze user patterns and preload accordingly
    const analyzeAndPreload = async () => {
      const currentTime = Date.now()
      const timeOfDay = new Date().getHours()

      // Get user's historical navigation patterns
      const patterns = JSON.parse(localStorage.getItem('navigationPatterns') || '{}')
      const currentRoute = location.pathname

      // Store current navigation
      if (!patterns[currentRoute]) {
        patterns[currentRoute] = []
      }
      patterns[currentRoute].push({
        timestamp: currentTime,
        timeOfDay,
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
      })

      // Keep only recent patterns (last 30 days)
      const thirtyDaysAgo = currentTime - (30 * 24 * 60 * 60 * 1000)
      Object.keys(patterns).forEach(route => {
        patterns[route] = patterns[route].filter(
          (entry: any) => entry.timestamp > thirtyDaysAgo
        )
      })

      localStorage.setItem('navigationPatterns', JSON.stringify(patterns))

      // Predict next likely route based on patterns
      const predictions = predictNextRoute(patterns, currentRoute, timeOfDay)

      // Preload predicted routes
      predictions.slice(0, 2).forEach(route => {
        setTimeout(() => preloadRoute(route), 1500)
      })
    }

    analyzeAndPreload()
  }, [location.pathname])

  return {
    analyzeUserBehavior: () => {
      const patterns = JSON.parse(localStorage.getItem('navigationPatterns') || '{}')
      return patterns
    }
  }
}

// Predict next route based on user patterns
function predictNextRoute(patterns: any, currentRoute: string, timeOfDay: number): string[] {
  const predictions: { route: string; score: number }[] = []

  Object.keys(patterns).forEach(route => {
    if (route === currentRoute) return

    let score = 0
    const entries = patterns[route]

    // Score based on frequency
    score += entries.length * 0.3

    // Score based on time of day patterns
    const sameTimeOfDayVisits = entries.filter(
      (entry: any) => Math.abs(entry.timeOfDay - timeOfDay) <= 2
    )
    score += sameTimeOfDayVisits.length * 0.5

    // Score based on recency
    const recentVisits = entries.filter(
      (entry: any) => Date.now() - entry.timestamp < (7 * 24 * 60 * 60 * 1000)
    )
    score += recentVisits.length * 0.4

    if (score > 0) {
      predictions.push({ route, score })
    }
  })

  return predictions
    .sort((a, b) => b.score - a.score)
    .map(p => p.route)
}