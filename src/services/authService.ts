/**
 * Authentication Service
 * Handles user authentication, session management, and JWT tokens
 */

import localforage from 'localforage'

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatar?: string
  role: 'admin' | 'user' | 'guest'
  createdAt: number
  lastLoginAt: number
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: boolean
  emailNotifications: boolean
  timezone: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  username: string
  password: string
  displayName: string
}

export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export interface AuthSession {
  user: User
  token: AuthToken
  isAuthenticated: boolean
  loginTime: number
}

export class AuthService {
  private store: LocalForage
  private currentSession: AuthSession | null = null
  private tokenRefreshTimer: NodeJS.Timeout | null = null

  constructor() {
    this.store = localforage.createInstance({
      name: 'auth-db',
      storeName: 'sessions'
    })
  }

  /**
   * Initialize auth service and restore session
   */
  async initialize(): Promise<void> {
    try {
      const session = await this.store.getItem<AuthSession>('current-session')
      if (session && this.isSessionValid(session)) {
        this.currentSession = session
        this.startTokenRefresh()
      } else {
        await this.logout()
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // In production, call backend API
      // For now, use mock authentication
      const mockUser = await this.mockLogin(credentials)

      const token: AuthToken = {
        accessToken: this.generateToken(),
        refreshToken: this.generateToken(),
        expiresIn: 3600, // 1 hour
        tokenType: 'Bearer'
      }

      const session: AuthSession = {
        user: mockUser,
        token,
        isAuthenticated: true,
        loginTime: Date.now()
      }

      this.currentSession = session

      if (credentials.rememberMe) {
        await this.store.setItem('current-session', session)
      }

      this.startTokenRefresh()

      return mockUser
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(`Login failed: ${error.message}`)
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    try {
      // Validate input
      this.validateEmail(data.email)
      this.validatePassword(data.password)
      this.validateUsername(data.username)

      // In production, call backend API
      const user = await this.mockRegister(data)

      // Auto-login after registration
      await this.login({
        email: data.email,
        password: data.password,
        rememberMe: true
      })

      return user
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(`Registration failed: ${error.message}`)
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    this.currentSession = null
    await this.store.removeItem('current-session')

    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer)
      this.tokenRefreshTimer = null
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentSession?.user || null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession?.isAuthenticated || false
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.currentSession?.token.accessToken || null
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    if (!this.currentSession) return

    try {
      // In production, call backend API to refresh token
      const newToken: AuthToken = {
        accessToken: this.generateToken(),
        refreshToken: this.currentSession.token.refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer'
      }

      this.currentSession.token = newToken
      await this.store.setItem('current-session', this.currentSession)
    } catch (error) {
      console.error('Token refresh error:', error)
      await this.logout()
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentSession) {
      throw new Error('Not authenticated')
    }

    try {
      // In production, call backend API
      const updatedUser = {
        ...this.currentSession.user,
        ...updates,
        id: this.currentSession.user.id, // Prevent ID change
        email: this.currentSession.user.email // Prevent email change
      }

      this.currentSession.user = updatedUser
      await this.store.setItem('current-session', this.currentSession)

      return updatedUser
    } catch (error: any) {
      throw new Error(`Profile update failed: ${error.message}`)
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Not authenticated')
    }

    this.validatePassword(newPassword)

    try {
      // In production, call backend API
      // For now, just validate
      if (oldPassword === newPassword) {
        throw new Error('New password must be different')
      }

      // Mock success
      console.log('Password changed successfully')
    } catch (error: any) {
      throw new Error(`Password change failed: ${error.message}`)
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    this.validateEmail(email)

    try {
      // In production, call backend API to send reset email
      console.log(`Password reset email sent to ${email}`)
    } catch (error: any) {
      throw new Error(`Password reset request failed: ${error.message}`)
    }
  }

  /**
   * Validate session
   */
  private isSessionValid(session: AuthSession): boolean {
    const now = Date.now()
    const expiresAt = session.loginTime + (session.token.expiresIn * 1000)
    return now < expiresAt
  }

  /**
   * Start token refresh timer
   */
  private startTokenRefresh(): void {
    if (!this.currentSession) return

    // Refresh token 5 minutes before expiration
    const refreshTime = (this.currentSession.token.expiresIn - 300) * 1000

    this.tokenRefreshTimer = setTimeout(async () => {
      await this.refreshToken()
      this.startTokenRefresh()
    }, refreshTime)
  }

  /**
   * Generate mock JWT token
   */
  private generateToken(): string {
    return `mock-token-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  /**
   * Mock login (replace with real API call)
   */
  private async mockLogin(credentials: LoginCredentials): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock user data
    const users: Record<string, any> = {
      'demo@example.com': {
        password: 'demo123',
        user: {
          id: 'user-1',
          email: 'demo@example.com',
          username: 'demo',
          displayName: 'Demo User',
          avatar: 'https://ui-avatars.com/api/?name=Demo+User',
          role: 'user' as const,
          createdAt: Date.now() - 86400000 * 30,
          lastLoginAt: Date.now(),
          preferences: {
            theme: 'system' as const,
            language: 'zh-CN',
            notifications: true,
            emailNotifications: false,
            timezone: 'Asia/Shanghai'
          }
        }
      }
    }

    const userData = users[credentials.email]
    if (!userData || userData.password !== credentials.password) {
      throw new Error('Invalid email or password')
    }

    return userData.user
  }

  /**
   * Mock registration (replace with real API call)
   */
  private async mockRegister(data: RegisterData): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const user: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName)}`,
      role: 'user',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      preferences: {
        theme: 'system',
        language: 'zh-CN',
        notifications: true,
        emailNotifications: false,
        timezone: 'Asia/Shanghai'
      }
    }

    return user
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Optional: Add more strength requirements
    // const hasUpperCase = /[A-Z]/.test(password)
    // const hasLowerCase = /[a-z]/.test(password)
    // const hasNumbers = /\d/.test(password)
    // const hasSpecialChar = /[!@#$%^&*]/.test(password)
  }

  /**
   * Validate username
   */
  private validateUsername(username: string): void {
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters')
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, hyphens, and underscores')
    }
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken()
    if (!token) return {}

    return {
      'Authorization': `Bearer ${token}`
    }
  }
}

/**
 * Global auth service instance
 */
export const authService = new AuthService()

/**
 * Initialize on module load
 */
authService.initialize().catch(console.error)
