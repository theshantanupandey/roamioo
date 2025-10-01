import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

interface WebSocketMessage {
  type: 'message' | 'typing_start' | 'typing_stop' | 'message_read' | 'user_online' | 'user_offline' | 'heartbeat' | 'auth';
  data: any;
  userId?: string;
  targetUserId?: string;
  token?: string;
}

interface ConnectedUser {
  socket: WebSocket;
  userId: string;
  lastSeen: Date;
}

// Store connected users
const connectedUsers = new Map<string, ConnectedUser>();

// Initialize Supabase client with environment secrets
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://xrlqxncccdrjlfhbqcli.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('WebSocket connection attempt received');
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Request is not a WebSocket upgrade');
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  console.log('Upgrading to WebSocket connection');
  const { socket, response } = Deno.upgradeWebSocket(req);
  let userId: string | null = null;
  let authenticated = false;

  socket.onopen = () => {
    console.log(`WebSocket connection opened, waiting for authentication`);
  };

  socket.onmessage = async (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle authentication first
      if (message.type === 'auth' && !authenticated) {
        const token = message.token;
        if (!token) {
          socket.close(1008, 'Authentication token required');
          return;
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          socket.close(1008, 'Invalid authentication token');
          return;
        }

        userId = user.id;
        authenticated = true;

        console.log(`User ${userId} authenticated successfully`);
        
        // Store the connection
        connectedUsers.set(userId, {
          socket,
          userId,
          lastSeen: new Date()
        });

        // Notify other users that this user is online
        broadcastToAll({
          type: 'user_online',
          data: { userId },
          userId
        }, userId);

        // Send connection acknowledgment with current online users
        socket.send(JSON.stringify({
          type: 'connection_ack',
          data: { status: 'connected', userId, onlineUsers: Array.from(connectedUsers.keys()) }
        }));
        
        return;
      }

      // Reject if not authenticated
      if (!authenticated || !userId) {
        socket.close(1008, 'Not authenticated');
        return;
      }

      console.log(`Received message from ${userId}:`, message);

      // Update last seen
      const userConnection = connectedUsers.get(userId);
      if (userConnection) {
        userConnection.lastSeen = new Date();
      }

      switch (message.type) {
        case 'message':
          await handleChatMessage(message, userId);
          break;
        case 'typing_start':
        case 'typing_stop':
          handleTypingIndicator(message, userId);
          break;
        case 'message_read':
          handleMessageRead(message, userId);
          break;
        case 'heartbeat':
          // Update last seen and respond
          socket.send(JSON.stringify({ type: 'heartbeat', data: { timestamp: Date.now() } }));
          break;
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  socket.onclose = () => {
    if (userId && authenticated) {
      console.log(`User ${userId} disconnected from chat WebSocket`);
      
      // Remove the connection
      connectedUsers.delete(userId);

      // Notify other users that this user is offline
      broadcastToAll({
        type: 'user_offline',
        data: { userId },
        userId
      }, userId);
    } else {
      console.log('Unauthenticated connection closed');
    }
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error:`, error);
  };

  return response;
});

async function handleChatMessage(message: WebSocketMessage, senderId: string) {
  const { recipientId, content } = message.data;

  try {
    // Store message in database
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content: content
      })
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          first_name,
          last_name,
          profile_image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error storing message:', error);
      return;
    }

    // Send to recipient if online
    const recipientConnection = connectedUsers.get(recipientId);
    if (recipientConnection) {
      recipientConnection.socket.send(JSON.stringify({
        type: 'message',
        data: newMessage
      }));
    }

    // Send confirmation to sender
    const senderConnection = connectedUsers.get(senderId);
    if (senderConnection) {
      senderConnection.socket.send(JSON.stringify({
        type: 'message_sent',
        data: newMessage
      }));
    }

  } catch (error) {
    console.error('Error handling chat message:', error);
  }
}

function handleTypingIndicator(message: WebSocketMessage, senderId: string) {
  const { recipientId } = message.data;
  
  // Forward typing indicator to recipient if online
  const recipientConnection = connectedUsers.get(recipientId);
  if (recipientConnection) {
    recipientConnection.socket.send(JSON.stringify({
      type: message.type,
      data: {
        userId: senderId,
        ...message.data
      }
    }));
  }
}

function handleMessageRead(message: WebSocketMessage, readerId: string) {
  const { messageId, senderId } = message.data;
  
  // Notify sender that their message was read
  const senderConnection = connectedUsers.get(senderId);
  if (senderConnection) {
    senderConnection.socket.send(JSON.stringify({
      type: 'message_read',
      data: {
        messageId,
        readerId
      }
    }));
  }
}

function broadcastToAll(message: WebSocketMessage, excludeUserId?: string) {
  connectedUsers.forEach((connection, userId) => {
    if (userId !== excludeUserId) {
      try {
        connection.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending to user ${userId}:`, error);
        // Remove broken connection
        connectedUsers.delete(userId);
      }
    }
  });
}

// Cleanup inactive connections every 30 seconds
setInterval(() => {
  const now = new Date();
  const timeout = 60000; // 1 minute timeout

  connectedUsers.forEach((connection, userId) => {
    if (now.getTime() - connection.lastSeen.getTime() > timeout) {
      console.log(`Removing inactive connection for user ${userId}`);
      try {
        connection.socket.close();
      } catch (error) {
        console.error(`Error closing connection for user ${userId}:`, error);
      }
      connectedUsers.delete(userId);
    }
  });
}, 30000);