import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  chat_id?: string; // Added for group chats
  content: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

interface ChatEvent {
  type: 'message' | 'message_sent' | 'typing_start' | 'typing_stop' | 'message_read' | 'user_online' | 'user_offline' | 'connection_ack' | 'heartbeat' | 'group_message';
  data: any;
}

interface QueuedMessage {
  recipientId?: string;
  chatId?: string;
  content: string;
  timestamp: number;
}

class WebSocketChatService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((event: ChatEvent) => void)[] = [];
  private currentUserId: string | null = null;
  private connected = false;
  private connecting = false;
  private messageQueue: QueuedMessage[] = [];
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1 second
  private connectionResolve: (() => void) | null = null;

  async connect(userId: string): Promise<void> {
    if (this.connected || this.connecting) {
      return Promise.resolve();
    }

    this.connecting = true;
    this.currentUserId = userId;

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const wsUrl = `wss://xrlqxncccdrjlfhbqcli.supabase.co/functions/v1/chat-websocket`;
      
      console.log('Attempting to connect to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      // Set the authorization header after connection
      if (this.ws) {
        console.log('WebSocket instance created successfully');
      }

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        // Store the resolve function for later use
        this.connectionResolve = resolve;

        this.ws.onopen = () => {
          console.log('WebSocket connected, sending authentication');
          console.log('Session token:', session.access_token ? 'Present' : 'Missing');
          
          // Send authentication message
          this.ws!.send(JSON.stringify({
            type: 'auth',
            token: session.access_token
          }));
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('Received WebSocket message:', event.data);
            const message: ChatEvent = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          console.log('Close event details:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.handleDisconnection();
          
          // Attempt to reconnect unless it was a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          console.error('Error details:', {
            type: error.type,
            target: error.target,
            timeStamp: error.timeStamp
          });
          this.connecting = false;
          reject(error);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.connecting) {
            this.connecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      this.connecting = false;
      throw error;
    }
  }

  private handleMessage(event: ChatEvent) {
    if (event.type === 'heartbeat') {
      // Handle heartbeat response
      return;
    }

    if (event.type === 'connection_ack') {
      console.log('WebSocket authenticated successfully');
      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
      
      // Resolve the connection promise if it exists
      if (this.connectionResolve) {
        this.connectionResolve();
        this.connectionResolve = null;
      }
      return;
    }

    this.messageHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private handleDisconnection() {
    this.connected = false;
    this.connecting = false;
    this.stopHeartbeat();
    
    // Notify handlers about disconnection
    this.messageHandlers.forEach(handler => {
      try {
        handler({ type: 'user_offline', data: { userId: this.currentUserId } });
      } catch (error) {
        console.error('Error in disconnection handler:', error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUserId) {
        this.connect(this.currentUserId).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'heartbeat',
          data: { timestamp: Date.now() }
        }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private processMessageQueue() {
    if (this.messageQueue.length === 0) return;

    console.log(`Processing ${this.messageQueue.length} queued messages`);
    
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    queue.forEach(queuedMessage => {
      if (queuedMessage.recipientId) {
        this.sendMessage(queuedMessage.recipientId, queuedMessage.content);
      } else if (queuedMessage.chatId) {
        this.sendGroupMessage(queuedMessage.chatId, queuedMessage.content);
      }
    });
  }

  sendMessage(recipientId: string, content: string): Promise<void> {
    if (!this.connected || !this.ws) {
      // Queue message for later delivery
      this.messageQueue.push({
        recipientId,
        content,
        timestamp: Date.now()
      });
      
      // Try to reconnect if not connected
      if (this.currentUserId) {
        this.connect(this.currentUserId).catch(console.error);
      }
      
      return Promise.resolve();
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'message',
        data: {
          recipientId,
          content
        }
      }));
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending message:', error);
      // Queue message for retry
      this.messageQueue.push({
        recipientId,
        content,
        timestamp: Date.now()
      });
      return Promise.reject(error);
    }
  }

  sendGroupMessage(chatId: string, content: string): Promise<void> {
    if (!this.connected || !this.ws) {
      // Queue message for later delivery
      this.messageQueue.push({
        chatId,
        content,
        timestamp: Date.now()
      });

      // Try to reconnect if not connected
      if (this.currentUserId) {
        this.connect(this.currentUserId).catch(console.error);
      }

      return Promise.resolve();
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'group_message',
        data: {
          chatId,
          content
        }
      }));
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending group message:', error);
      // Queue message for retry
      this.messageQueue.push({
        chatId,
        content,
        timestamp: Date.now()
      });
      return Promise.reject(error);
    }
  }

  sendTypingIndicator(id: string, isTyping: boolean, isGroupChat: boolean = false) {
    if (!this.connected || !this.ws) return;

    try {
      this.ws.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        data: {
          id,
          isGroupChat,
        }
      }));
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  markMessageAsRead(messageId: string, senderId: string) {
    if (!this.connected || !this.ws) return;

    try {
      this.ws.send(JSON.stringify({
        type: 'message_read',
        data: { messageId, senderId }
      }));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  onMessage(handler: (event: ChatEvent) => void) {
    this.messageHandlers.push(handler);
    
    // Return cleanup function
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connected = false;
    this.connecting = false;
    this.currentUserId = null;
    this.messageHandlers = [];
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    
    console.log('WebSocket service disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionState(): string {
    if (this.connecting) return 'connecting';
    return this.connected ? 'connected' : 'disconnected';
  }

  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }
}

export const webSocketChatService = new WebSocketChatService();
export type { Message, ChatEvent };