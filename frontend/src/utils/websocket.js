/**
 * WebSocket utility for debugging and managing connections
 */

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.debug = import.meta.env.VITE_DEBUG === 'true';
  }

  log(message, ...args) {
    if (this.debug) {
      console.log('[WebSocket]', message, ...args);
    }
  }

  error(message, ...args) {
    console.error('[WebSocket Error]', message, ...args);
  }

  // Create a WebSocket connection with error handling
  createConnection(url, protocols = [], options = {}) {
    const {
      autoReconnect = false,
      maxReconnectAttempts = 3,
      reconnectInterval = 3000,
      onOpen = null,
      onMessage = null,
      onError = null,
      onClose = null
    } = options;

    // Check if WebSocket is disabled via environment
    if (import.meta.env.VITE_WEBSOCKET_ENABLED === 'false') {
      this.log('WebSocket connections are disabled via environment variable');
      return null;
    }

    try {
      const ws = new WebSocket(url, protocols);
      const connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const connectionInfo = {
        ws,
        url,
        protocols,
        options,
        reconnectAttempts: 0,
        isReconnecting: false
      };

      ws.onopen = (event) => {
        this.log(`Connection opened: ${url}`);
        connectionInfo.reconnectAttempts = 0;
        connectionInfo.isReconnecting = false;
        if (onOpen) onOpen(event);
      };

      ws.onmessage = (event) => {
        this.log(`Message received from ${url}:`, event.data);
        if (onMessage) onMessage(event);
      };

      ws.onerror = (event) => {
        this.error(`Connection error for ${url}:`, event);
        if (onError) onError(event);
      };

      ws.onclose = (event) => {
        this.log(`Connection closed: ${url}`, event.code, event.reason);
        
        if (autoReconnect && 
            !connectionInfo.isReconnecting && 
            connectionInfo.reconnectAttempts < maxReconnectAttempts) {
          
          connectionInfo.isReconnecting = true;
          connectionInfo.reconnectAttempts++;
          
          this.log(`Attempting to reconnect (${connectionInfo.reconnectAttempts}/${maxReconnectAttempts})...`);
          
          setTimeout(() => {
            if (connectionInfo.reconnectAttempts <= maxReconnectAttempts) {
              this.createConnection(url, protocols, options);
            }
          }, reconnectInterval);
        }
        
        this.connections.delete(connectionId);
        if (onClose) onClose(event);
      };

      this.connections.set(connectionId, connectionInfo);
      return { ws, connectionId };

    } catch (error) {
      this.error('Failed to create WebSocket connection:', error);
      return null;
    }
  }

  // Close a specific connection
  closeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.ws) {
      connection.ws.close();
      this.connections.delete(connectionId);
      this.log(`Closed connection: ${connectionId}`);
    }
  }

  // Close all connections
  closeAllConnections() {
    this.connections.forEach((connection) => {
      if (connection.ws) {
        connection.ws.close();
      }
    });
    this.connections.clear();
    this.log('All WebSocket connections closed');
  }

  // Get connection status
  getConnectionStatus(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return 'not_found';
    
    switch (connection.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  // List all active connections
  listConnections() {
    const connections = [];
    this.connections.forEach((connection, id) => {
      connections.push({
        id,
        url: connection.url,
        status: this.getConnectionStatus(id),
        reconnectAttempts: connection.reconnectAttempts
      });
    });
    return connections;
  }
}

// Create a singleton instance
const wsManager = new WebSocketManager();

export default wsManager;

// Export for debugging in browser console
if (typeof window !== 'undefined') {
  window.wsManager = wsManager;
}
