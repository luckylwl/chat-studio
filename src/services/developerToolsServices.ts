/**
 * AI Chat Studio v4.0 - Developer Tools Services
 *
 * This file contains developer-focused services:
 * - GraphQL API Service
 * - WebSocket Service
 * - API Versioning Service
 * - Developer Console Service
 * - SDK Generator Service
 */

import localforage from 'localforage'
import type {
  GraphQLSchema,
  GraphQLQuery,
  GraphQLMutation,
  GraphQLSubscription,
  WebSocketConnection,
  WebSocketMessage,
  WebSocketChannel,
  APIVersion,
  APIEndpoint,
  DeveloperConsole,
  APIKey,
  WebhookConfig,
  SDKConfig,
  SDKLanguage
} from '../types/v4-types'

// ===================================
// GRAPHQL SERVICE
// ===================================

class GraphQLService {
  private readonly SCHEMA_KEY = 'graphql_schemas'
  private readonly QUERY_HISTORY_KEY = 'graphql_query_history'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'graphql'
  })

  // Schema Management
  async getSchema(): Promise<GraphQLSchema> {
    const schema = await this.store.getItem<GraphQLSchema>(this.SCHEMA_KEY)

    if (!schema) {
      return this.createDefaultSchema()
    }

    return schema
  }

  async updateSchema(updates: Partial<GraphQLSchema>): Promise<GraphQLSchema> {
    const schema = await this.getSchema()
    const updated = { ...schema, ...updates, updatedAt: Date.now() }
    await this.store.setItem(this.SCHEMA_KEY, updated)
    return updated
  }

  // Query Execution
  async executeQuery(query: string, variables?: Record<string, any>): Promise<any> {
    const queryRecord: GraphQLQuery = {
      id: `query_${Date.now()}`,
      query,
      variables: variables || {},
      timestamp: Date.now(),
      executionTime: 0,
      result: null,
      errors: []
    }

    const startTime = Date.now()

    try {
      // Simulate query execution (in real app, this would call actual GraphQL endpoint)
      const result = await this.simulateQueryExecution(query, variables)

      queryRecord.executionTime = Date.now() - startTime
      queryRecord.result = result

      await this.saveQueryHistory(queryRecord)
      return result
    } catch (error: any) {
      queryRecord.executionTime = Date.now() - startTime
      queryRecord.errors.push({
        message: error.message,
        locations: [],
        path: []
      })

      await this.saveQueryHistory(queryRecord)
      throw error
    }
  }

  // Mutation Execution
  async executeMutation(mutation: string, variables?: Record<string, any>): Promise<any> {
    const mutationRecord: GraphQLMutation = {
      id: `mutation_${Date.now()}`,
      mutation,
      variables: variables || {},
      timestamp: Date.now(),
      executionTime: 0,
      result: null,
      errors: []
    }

    const startTime = Date.now()

    try {
      const result = await this.simulateMutationExecution(mutation, variables)

      mutationRecord.executionTime = Date.now() - startTime
      mutationRecord.result = result

      return result
    } catch (error: any) {
      mutationRecord.executionTime = Date.now() - startTime
      mutationRecord.errors.push({
        message: error.message,
        locations: [],
        path: []
      })

      throw error
    }
  }

  // Subscription Management
  async subscribe(subscription: string, variables?: Record<string, any>): Promise<GraphQLSubscription> {
    return {
      id: `subscription_${Date.now()}`,
      subscription,
      variables: variables || {},
      active: true,
      startedAt: Date.now(),
      lastEvent: Date.now(),
      eventCount: 0,
      callback: (data: any) => {
        console.log('Subscription event:', data)
      }
    }
  }

  // Query History
  async getQueryHistory(limit: number = 50): Promise<GraphQLQuery[]> {
    const history = await this.store.getItem<GraphQLQuery[]>(this.QUERY_HISTORY_KEY) || []
    return history.slice(-limit)
  }

  private async saveQueryHistory(query: GraphQLQuery): Promise<void> {
    const history = await this.store.getItem<GraphQLQuery[]>(this.QUERY_HISTORY_KEY) || []
    history.push(query)

    // Keep last 100 queries
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }

    await this.store.setItem(this.QUERY_HISTORY_KEY, history)
  }

  private createDefaultSchema(): GraphQLSchema {
    return {
      version: '1.0.0',
      types: [
        {
          name: 'Conversation',
          fields: ['id', 'title', 'messages', 'createdAt', 'updatedAt'],
          description: 'A conversation between user and AI'
        },
        {
          name: 'Message',
          fields: ['id', 'content', 'role', 'timestamp'],
          description: 'A single message in a conversation'
        },
        {
          name: 'User',
          fields: ['id', 'name', 'email', 'preferences'],
          description: 'A user of the platform'
        }
      ],
      queries: [
        {
          name: 'getConversation',
          args: ['id: ID!'],
          returns: 'Conversation',
          description: 'Get a conversation by ID'
        },
        {
          name: 'listConversations',
          args: ['limit: Int', 'offset: Int'],
          returns: '[Conversation]',
          description: 'List all conversations'
        }
      ],
      mutations: [
        {
          name: 'createConversation',
          args: ['title: String!'],
          returns: 'Conversation',
          description: 'Create a new conversation'
        },
        {
          name: 'sendMessage',
          args: ['conversationId: ID!', 'content: String!'],
          returns: 'Message',
          description: 'Send a message in a conversation'
        }
      ],
      subscriptions: [
        {
          name: 'messageAdded',
          args: ['conversationId: ID!'],
          returns: 'Message',
          description: 'Subscribe to new messages in a conversation'
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  private async simulateQueryExecution(query: string, variables?: Record<string, any>): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Return mock data based on query
    if (query.includes('getConversation')) {
      return {
        data: {
          getConversation: {
            id: variables?.id || '1',
            title: 'Sample Conversation',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        }
      }
    }

    return { data: {} }
  }

  private async simulateMutationExecution(mutation: string, variables?: Record<string, any>): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 150))

    if (mutation.includes('createConversation')) {
      return {
        data: {
          createConversation: {
            id: `conv_${Date.now()}`,
            title: variables?.title || 'New Conversation',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        }
      }
    }

    return { data: {} }
  }
}

// ===================================
// WEBSOCKET SERVICE
// ===================================

class WebSocketService {
  private readonly CONNECTIONS_KEY = 'websocket_connections'
  private readonly CHANNELS_KEY = 'websocket_channels'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'websocket'
  })

  private connections: Map<string, WebSocketConnection> = new Map()
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map()

  // Connection Management
  async connect(url: string, protocols?: string[]): Promise<WebSocketConnection> {
    const connection: WebSocketConnection = {
      id: `ws_${Date.now()}`,
      url,
      protocols: protocols || [],
      state: 'connecting',
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      channels: [],
      metadata: {}
    }

    // Simulate connection (in real app, would use actual WebSocket)
    await new Promise(resolve => setTimeout(resolve, 100))
    connection.state = 'open'

    this.connections.set(connection.id, connection)
    await this.saveConnection(connection)

    return connection
  }

  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)

    if (connection) {
      connection.state = 'closed'
      connection.disconnectedAt = Date.now()
      this.connections.delete(connectionId)
      await this.saveConnection(connection)
    }
  }

  async getConnection(connectionId: string): Promise<WebSocketConnection | null> {
    if (this.connections.has(connectionId)) {
      return this.connections.get(connectionId)!
    }

    const connections = await this.store.getItem<WebSocketConnection[]>(this.CONNECTIONS_KEY) || []
    return connections.find(c => c.id === connectionId) || null
  }

  // Message Handling
  async sendMessage(
    connectionId: string,
    type: string,
    payload: any
  ): Promise<WebSocketMessage> {
    const connection = await this.getConnection(connectionId)

    if (!connection || connection.state !== 'open') {
      throw new Error('Connection not open')
    }

    const message: WebSocketMessage = {
      id: `msg_${Date.now()}`,
      type,
      payload,
      timestamp: Date.now(),
      connectionId
    }

    connection.messageCount++
    connection.lastActivity = Date.now()

    // In real app, would actually send via WebSocket
    console.log('Sending WebSocket message:', message)

    return message
  }

  onMessage(connectionId: string, handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.set(connectionId, handler)
  }

  // Channel Management
  async joinChannel(
    connectionId: string,
    channelName: string
  ): Promise<WebSocketChannel> {
    const connection = await this.getConnection(connectionId)

    if (!connection) {
      throw new Error('Connection not found')
    }

    const channel: WebSocketChannel = {
      id: `channel_${Date.now()}`,
      name: channelName,
      connectionId,
      subscribedAt: Date.now(),
      messageCount: 0,
      members: []
    }

    connection.channels.push(channel)
    await this.saveChannel(channel)

    return channel
  }

  async leaveChannel(channelId: string): Promise<void> {
    const channels = await this.store.getItem<WebSocketChannel[]>(this.CHANNELS_KEY) || []
    const filtered = channels.filter(c => c.id !== channelId)
    await this.store.setItem(this.CHANNELS_KEY, filtered)
  }

  async getChannels(connectionId: string): Promise<WebSocketChannel[]> {
    const channels = await this.store.getItem<WebSocketChannel[]>(this.CHANNELS_KEY) || []
    return channels.filter(c => c.connectionId === connectionId)
  }

  // Presence Tracking
  async updatePresence(
    channelId: string,
    userId: string,
    status: 'online' | 'away' | 'offline'
  ): Promise<void> {
    const channels = await this.store.getItem<WebSocketChannel[]>(this.CHANNELS_KEY) || []
    const channel = channels.find(c => c.id === channelId)

    if (channel) {
      const member = channel.members.find(m => m.userId === userId)

      if (member) {
        member.status = status
        member.lastSeen = Date.now()
      } else {
        channel.members.push({
          userId,
          status,
          joinedAt: Date.now(),
          lastSeen: Date.now()
        })
      }

      await this.store.setItem(this.CHANNELS_KEY, channels)
    }
  }

  private async saveConnection(connection: WebSocketConnection): Promise<void> {
    const connections = await this.store.getItem<WebSocketConnection[]>(this.CONNECTIONS_KEY) || []
    const index = connections.findIndex(c => c.id === connection.id)

    if (index >= 0) {
      connections[index] = connection
    } else {
      connections.push(connection)
    }

    await this.store.setItem(this.CONNECTIONS_KEY, connections)
  }

  private async saveChannel(channel: WebSocketChannel): Promise<void> {
    const channels = await this.store.getItem<WebSocketChannel[]>(this.CHANNELS_KEY) || []
    channels.push(channel)
    await this.store.setItem(this.CHANNELS_KEY, channels)
  }
}

// ===================================
// API VERSIONING SERVICE
// ===================================

class APIVersioningService {
  private readonly VERSIONS_KEY = 'api_versions'
  private readonly ENDPOINTS_KEY = 'api_endpoints'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'api_versioning'
  })

  // Version Management
  async createVersion(
    version: string,
    description: string
  ): Promise<APIVersion> {
    const apiVersion: APIVersion = {
      version,
      releaseDate: Date.now(),
      deprecationDate: null,
      sunsetDate: null,
      status: 'current',
      changes: [],
      endpoints: [],
      documentation: description,
      breaking: false
    }

    const versions = await this.getAllVersions()
    versions.push(apiVersion)
    await this.store.setItem(this.VERSIONS_KEY, versions)

    return apiVersion
  }

  async getAllVersions(): Promise<APIVersion[]> {
    return await this.store.getItem<APIVersion[]>(this.VERSIONS_KEY) || []
  }

  async getVersion(version: string): Promise<APIVersion | null> {
    const versions = await this.getAllVersions()
    return versions.find(v => v.version === version) || null
  }

  async deprecateVersion(version: string, sunsetDate: number): Promise<void> {
    const versions = await this.getAllVersions()
    const apiVersion = versions.find(v => v.version === version)

    if (apiVersion) {
      apiVersion.status = 'deprecated'
      apiVersion.deprecationDate = Date.now()
      apiVersion.sunsetDate = sunsetDate
      await this.store.setItem(this.VERSIONS_KEY, versions)
    }
  }

  // Endpoint Management
  async registerEndpoint(endpoint: APIEndpoint): Promise<void> {
    const endpoints = await this.getAllEndpoints()
    endpoints.push(endpoint)
    await this.store.setItem(this.ENDPOINTS_KEY, endpoints)
  }

  async getAllEndpoints(version?: string): Promise<APIEndpoint[]> {
    const endpoints = await this.store.getItem<APIEndpoint[]>(this.ENDPOINTS_KEY) || []

    if (version) {
      return endpoints.filter(e => e.version === version)
    }

    return endpoints
  }

  async getEndpoint(path: string, version: string): Promise<APIEndpoint | null> {
    const endpoints = await this.getAllEndpoints(version)
    return endpoints.find(e => e.path === path) || null
  }

  // Compatibility Checking
  async checkCompatibility(
    fromVersion: string,
    toVersion: string
  ): Promise<{ compatible: boolean; issues: string[] }> {
    const from = await this.getVersion(fromVersion)
    const to = await this.getVersion(toVersion)

    if (!from || !to) {
      return { compatible: false, issues: ['Version not found'] }
    }

    const issues: string[] = []

    if (to.breaking) {
      issues.push('Target version contains breaking changes')
    }

    // Check for removed endpoints
    const fromEndpoints = await this.getAllEndpoints(fromVersion)
    const toEndpoints = await this.getAllEndpoints(toVersion)

    const removedEndpoints = fromEndpoints.filter(
      fe => !toEndpoints.some(te => te.path === fe.path)
    )

    if (removedEndpoints.length > 0) {
      issues.push(`${removedEndpoints.length} endpoints removed`)
    }

    return {
      compatible: issues.length === 0,
      issues
    }
  }
}

// ===================================
// DEVELOPER CONSOLE SERVICE
// ===================================

class DeveloperConsoleService {
  private readonly CONSOLE_KEY = 'developer_console'
  private readonly API_KEYS_KEY = 'api_keys'
  private readonly WEBHOOKS_KEY = 'webhooks'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'dev_console'
  })

  // Console Management
  async getConsole(userId: string): Promise<DeveloperConsole> {
    const consoles = await this.store.getItem<Record<string, DeveloperConsole>>(this.CONSOLE_KEY) || {}

    if (!consoles[userId]) {
      consoles[userId] = this.createDefaultConsole(userId)
      await this.store.setItem(this.CONSOLE_KEY, consoles)
    }

    return consoles[userId]
  }

  // API Key Management
  async createAPIKey(
    userId: string,
    name: string,
    scopes: string[]
  ): Promise<APIKey> {
    const key = this.generateAPIKey()

    const apiKey: APIKey = {
      id: `key_${Date.now()}`,
      name,
      key,
      userId,
      scopes,
      createdAt: Date.now(),
      lastUsed: null,
      usageCount: 0,
      rateLimit: {
        requests: 1000,
        period: 3600,
        remaining: 1000
      },
      active: true
    }

    const keys = await this.getAllAPIKeys(userId)
    keys.push(apiKey)
    await this.store.setItem(this.API_KEYS_KEY, keys)

    return apiKey
  }

  async getAllAPIKeys(userId: string): Promise<APIKey[]> {
    const allKeys = await this.store.getItem<APIKey[]>(this.API_KEYS_KEY) || []
    return allKeys.filter(k => k.userId === userId)
  }

  async revokeAPIKey(keyId: string): Promise<void> {
    const allKeys = await this.store.getItem<APIKey[]>(this.API_KEYS_KEY) || []
    const key = allKeys.find(k => k.id === keyId)

    if (key) {
      key.active = false
      await this.store.setItem(this.API_KEYS_KEY, allKeys)
    }
  }

  // Webhook Management
  async createWebhook(
    userId: string,
    url: string,
    events: string[]
  ): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      id: `webhook_${Date.now()}`,
      url,
      events,
      secret: this.generateWebhookSecret(),
      active: true,
      createdAt: Date.now(),
      lastTriggered: null,
      deliveryCount: 0,
      failureCount: 0
    }

    const webhooks = await this.getAllWebhooks(userId)
    webhooks.push(webhook)
    await this.store.setItem(`${this.WEBHOOKS_KEY}_${userId}`, webhooks)

    return webhook
  }

  async getAllWebhooks(userId: string): Promise<WebhookConfig[]> {
    return await this.store.getItem<WebhookConfig[]>(`${this.WEBHOOKS_KEY}_${userId}`) || []
  }

  async triggerWebhook(webhookId: string, event: string, data: any): Promise<void> {
    // In real app, would make HTTP request to webhook URL
    console.log('Triggering webhook:', webhookId, event, data)
  }

  // Usage Tracking
  async trackAPIUsage(keyId: string): Promise<void> {
    const allKeys = await this.store.getItem<APIKey[]>(this.API_KEYS_KEY) || []
    const key = allKeys.find(k => k.id === keyId)

    if (key) {
      key.usageCount++
      key.lastUsed = Date.now()
      key.rateLimit.remaining--
      await this.store.setItem(this.API_KEYS_KEY, allKeys)
    }
  }

  private createDefaultConsole(userId: string): DeveloperConsole {
    return {
      userId,
      projects: [],
      apiKeys: [],
      webhooks: [],
      usage: {
        requests: 0,
        bandwidth: 0,
        errors: 0,
        period: 'monthly'
      },
      sandbox: {
        enabled: true,
        testData: {},
        mockResponses: []
      }
    }
  }

  private generateAPIKey(): string {
    return `sk_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`
  }

  private generateWebhookSecret(): string {
    return `whsec_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`
  }
}

// ===================================
// SDK GENERATOR SERVICE
// ===================================

class SDKGeneratorService {
  async generateSDK(config: SDKConfig): Promise<string> {
    const { language, version, features } = config

    switch (language) {
      case 'typescript':
        return this.generateTypeScriptSDK(version, features)
      case 'python':
        return this.generatePythonSDK(version, features)
      case 'java':
        return this.generateJavaSDK(version, features)
      case 'go':
        return this.generateGoSDK(version, features)
      case 'ruby':
        return this.generateRubySDK(version, features)
      case 'php':
        return this.generatePHPSDK(version, features)
      default:
        throw new Error(`Unsupported language: ${language}`)
    }
  }

  async getSupportedLanguages(): Promise<SDKLanguage[]> {
    return [
      {
        id: 'typescript',
        name: 'TypeScript',
        version: '5.0+',
        packageManager: 'npm',
        documentation: 'https://docs.example.com/sdk/typescript'
      },
      {
        id: 'python',
        name: 'Python',
        version: '3.8+',
        packageManager: 'pip',
        documentation: 'https://docs.example.com/sdk/python'
      },
      {
        id: 'java',
        name: 'Java',
        version: '11+',
        packageManager: 'maven',
        documentation: 'https://docs.example.com/sdk/java'
      },
      {
        id: 'go',
        name: 'Go',
        version: '1.18+',
        packageManager: 'go get',
        documentation: 'https://docs.example.com/sdk/go'
      },
      {
        id: 'ruby',
        name: 'Ruby',
        version: '3.0+',
        packageManager: 'gem',
        documentation: 'https://docs.example.com/sdk/ruby'
      },
      {
        id: 'php',
        name: 'PHP',
        version: '8.0+',
        packageManager: 'composer',
        documentation: 'https://docs.example.com/sdk/php'
      }
    ]
  }

  private generateTypeScriptSDK(version: string, features: string[]): string {
    return `
/**
 * AI Chat Studio SDK v${version}
 * Generated TypeScript Client
 */

export class ChatStudioClient {
  private apiKey: string
  private baseURL: string

  constructor(apiKey: string, baseURL = 'https://api.chatstudio.com') {
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  async createConversation(title: string): Promise<any> {
    return this.request('POST', '/conversations', { title })
  }

  async sendMessage(conversationId: string, content: string): Promise<any> {
    return this.request('POST', \`/conversations/\${conversationId}/messages\`, { content })
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const response = await fetch(\`\${this.baseURL}\${path}\`, {
      method,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    return response.json()
  }
}
`.trim()
  }

  private generatePythonSDK(version: string, features: string[]): string {
    return `
"""
AI Chat Studio SDK v${version}
Generated Python Client
"""

import requests
from typing import Dict, Any

class ChatStudioClient:
    def __init__(self, api_key: str, base_url: str = "https://api.chatstudio.com"):
        self.api_key = api_key
        self.base_url = base_url

    def create_conversation(self, title: str) -> Dict[str, Any]:
        return self._request("POST", "/conversations", {"title": title})

    def send_message(self, conversation_id: str, content: str) -> Dict[str, Any]:
        return self._request(
            "POST",
            f"/conversations/{conversation_id}/messages",
            {"content": content}
        )

    def _request(self, method: str, path: str, body: Dict = None) -> Dict[str, Any]:
        response = requests.request(
            method,
            f"{self.base_url}{path}",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json=body
        )
        return response.json()
`.trim()
  }

  private generateJavaSDK(version: string, features: string[]): string {
    return `
/**
 * AI Chat Studio SDK v${version}
 * Generated Java Client
 */

package com.chatstudio.sdk;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ChatStudioClient {
    private String apiKey;
    private String baseURL;
    private HttpClient client;

    public ChatStudioClient(String apiKey) {
        this(apiKey, "https://api.chatstudio.com");
    }

    public ChatStudioClient(String apiKey, String baseURL) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.client = HttpClient.newHttpClient();
    }

    // API methods here
}
`.trim()
  }

  private generateGoSDK(version: string, features: string[]): string {
    return `
// AI Chat Studio SDK v${version}
// Generated Go Client

package chatstudio

import (
    "net/http"
)

type Client struct {
    APIKey  string
    BaseURL string
    HTTP    *http.Client
}

func NewClient(apiKey string) *Client {
    return &Client{
        APIKey:  apiKey,
        BaseURL: "https://api.chatstudio.com",
        HTTP:    &http.Client{},
    }
}

// API methods here
`.trim()
  }

  private generateRubySDK(version: string, features: string[]): string {
    return `
# AI Chat Studio SDK v${version}
# Generated Ruby Client

require 'net/http'
require 'json'

module ChatStudio
  class Client
    def initialize(api_key, base_url = 'https://api.chatstudio.com')
      @api_key = api_key
      @base_url = base_url
    end

    # API methods here
  end
end
`.trim()
  }

  private generatePHPSDK(version: string, features: string[]): string {
    return `
<?php
/**
 * AI Chat Studio SDK v${version}
 * Generated PHP Client
 */

namespace ChatStudio;

class Client {
    private $apiKey;
    private $baseURL;

    public function __construct($apiKey, $baseURL = 'https://api.chatstudio.com') {
        $this->apiKey = $apiKey;
        $this->baseURL = $baseURL;
    }

    // API methods here
}
`.trim()
  }
}

// ===================================
// EXPORTS
// ===================================

export const graphqlService = new GraphQLService()
export const websocketService = new WebSocketService()
export const apiVersioningService = new APIVersioningService()
export const developerConsoleService = new DeveloperConsoleService()
export const sdkGeneratorService = new SDKGeneratorService()

export default {
  graphql: graphqlService,
  websocket: websocketService,
  apiVersioning: apiVersioningService,
  developerConsole: developerConsoleService,
  sdkGenerator: sdkGeneratorService
}
