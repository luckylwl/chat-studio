/**
 * WebSocket Client with Authentication
 * Handles authenticated WebSocket connections with auto-reconnect
 */

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface WebSocketConfig {
  url: string;
  token: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export type MessageHandler = (message: WebSocketMessage) => void;
export type ErrorHandler = (error: Event) => void;
export type ConnectionHandler = () => void;

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting',
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private errorHandlers: ErrorHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private sessionId: string | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (
      this.status === ConnectionStatus.CONNECTED ||
      this.status === ConnectionStatus.CONNECTING
    ) {
      console.warn('WebSocket is already connected or connecting');
      return;
    }

    this.status = ConnectionStatus.CONNECTING;

    return new Promise((resolve, reject) => {
      try {
        // Add token to URL
        const url = `${this.config.url}?token=${encodeURIComponent(
          this.config.token
        )}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.status = ConnectionStatus.CONNECTED;
          this.reconnectAttempts = 0;

          // Start heartbeat
          this.startHeartbeat();

          // Trigger connect handlers
          this.connectHandlers.forEach((handler) => handler());

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            // Handle authentication success
            if (message.type === 'auth_success') {
              this.sessionId = message.data.session_id;
              console.log('WebSocket authenticated:', this.sessionId);
            }

            // Handle pong (heartbeat response)
            if (message.type === 'pong') {
              console.debug('Heartbeat acknowledged');
            }

            // Trigger message handlers
            this.triggerMessageHandlers(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.status = ConnectionStatus.ERROR;

          // Trigger error handlers
          this.errorHandlers.forEach((handler) => handler(error));

          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.status = ConnectionStatus.DISCONNECTED;

          // Stop heartbeat
          this.stopHeartbeat();

          // Trigger disconnect handlers
          this.disconnectHandlers.forEach((handler) => handler());

          // Auto-reconnect
          if (
            this.config.autoReconnect &&
            this.reconnectAttempts < this.config.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        this.status = ConnectionStatus.ERROR;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.status = ConnectionStatus.DISCONNECTING;
      this.config.autoReconnect = false; // Disable auto-reconnect
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
      this.sessionId = null;
    }

    this.stopHeartbeat();
    this.stopReconnect();
  }

  /**
   * Send message to server
   */
  send(type: string, data: any): boolean {
    if (this.status !== ConnectionStatus.CONNECTED || !this.ws) {
      console.warn('WebSocket is not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = { type, data };
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Send chat message
   */
  sendMessage(conversationId: string, content: string, messageId?: string): boolean {
    return this.send('message', {
      conversation_id: conversationId,
      content,
      message_id: messageId || Date.now().toString(),
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): boolean {
    return this.send('typing', {
      conversation_id: conversationId,
      is_typing: isTyping,
    });
  }

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversation(conversationId: string): boolean {
    return this.send('subscribe', {
      conversation_id: conversationId,
    });
  }

  /**
   * Register message handler for specific message type
   */
  on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Remove message handler
   */
  off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Register error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Register connect handler
   */
  onConnect(handler: ConnectionHandler): void {
    this.connectHandlers.push(handler);
  }

  /**
   * Register disconnect handler
   */
  onDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandlers.push(handler);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  /**
   * Update authentication token
   */
  updateToken(token: string): void {
    this.config.token = token;

    // Reconnect with new token
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Trigger message handlers for specific type
   */
  private triggerMessageHandlers(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Message handler error:', error);
        }
      });
    }

    // Also trigger wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Wildcard handler error:', error);
        }
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.status = ConnectionStatus.RECONNECTING;
    this.reconnectAttempts++;

    console.log(
      `Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Start heartbeat/ping
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.send('ping', { timestamp: Date.now() });
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

/**
 * React hook for WebSocket
 */
export function useWebSocket(config: WebSocketConfig) {
  const [client] = React.useState(() => new WebSocketClient(config));
  const [status, setStatus] = React.useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [error, setError] = React.useState<Event | null>(null);

  React.useEffect(() => {
    // Connect
    client.connect().catch((err) => {
      console.error('WebSocket connection failed:', err);
      setError(err);
    });

    // Setup handlers
    const statusInterval = setInterval(() => {
      setStatus(client.getStatus());
    }, 100);

    client.onError((err) => {
      setError(err);
    });

    // Cleanup
    return () => {
      clearInterval(statusInterval);
      client.disconnect();
    };
  }, [client]);

  return {
    client,
    status,
    error,
    isConnected: status === ConnectionStatus.CONNECTED,
    send: client.send.bind(client),
    sendMessage: client.sendMessage.bind(client),
    sendTyping: client.sendTyping.bind(client),
  };
}
