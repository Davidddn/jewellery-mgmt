import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Typography } from '@mui/material';

const WebSocketDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({
    viteHMR: null,
    customConnections: [],
    errors: []
  });

  useEffect(() => {
    // Monitor WebSocket connections
    const originalWebSocket = window.WebSocket;
    const connections = [];
    
    window.WebSocket = function(url, protocols) {
      console.log('🔌 WebSocket connection attempt:', url, protocols);
      
      const ws = new originalWebSocket(url, protocols);
      
      connections.push({
        url,
        protocols,
        timestamp: new Date().toISOString(),
        readyState: ws.readyState
      });
      
      ws.addEventListener('open', () => {
        console.log('✅ WebSocket opened:', url);
      });
      
      ws.addEventListener('error', (error) => {
        console.error('❌ WebSocket error:', url, error);
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors, { url, error: error.toString(), timestamp: new Date().toISOString() }]
        }));
      });
      
      ws.addEventListener('close', (event) => {
        console.log('🔐 WebSocket closed:', url, event.code, event.reason);
      });
      
      setDebugInfo(prev => ({
        ...prev,
        customConnections: connections
      }));
      
      return ws;
    };
    
    // Check for Vite HMR
    const checkViteHMR = () => {
      if (import.meta.hot) {
        setDebugInfo(prev => ({
          ...prev,
          viteHMR: {
            enabled: true,
            url: import.meta.hot.data?.ws?.url || 'unknown'
          }
        }));
      }
    };
    
    checkViteHMR();
    
    return () => {
      window.WebSocket = originalWebSocket;
    };
  }, []);

  const clearErrors = () => {
    setDebugInfo(prev => ({
      ...prev,
      errors: []
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        WebSocket Debug Information
      </Typography>
      
      {/* Environment Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Environment</Typography>
          <Typography variant="body2">
            Mode: {import.meta.env.MODE}<br/>
            API URL: {import.meta.env.VITE_API_URL}<br/>
            WebSocket Enabled: {import.meta.env.VITE_WEBSOCKET_ENABLED}<br/>
            WebSocket URL: {import.meta.env.VITE_WS_URL}
          </Typography>
        </CardContent>
      </Card>

      {/* Vite HMR Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Vite HMR</Typography>
          <Typography variant="body2">
            {debugInfo.viteHMR ? (
              <>
                Enabled: {debugInfo.viteHMR.enabled ? 'Yes' : 'No'}<br/>
                URL: {debugInfo.viteHMR.url}
              </>
            ) : (
              'Not detected'
            )}
          </Typography>
        </CardContent>
      </Card>

      {/* WebSocket Connections */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">WebSocket Connections</Typography>
          {debugInfo.customConnections.length === 0 ? (
            <Typography variant="body2">No connections detected</Typography>
          ) : (
            debugInfo.customConnections.map((conn, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>URL:</strong> {conn.url}<br/>
                  <strong>Protocols:</strong> {conn.protocols?.join(', ') || 'None'}<br/>
                  <strong>Time:</strong> {conn.timestamp}
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Errors */}
      {debugInfo.errors.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Errors</Typography>
              <Button size="small" onClick={clearErrors}>Clear</Button>
            </Box>
            {debugInfo.errors.map((error, index) => (
              <Alert key={index} severity="error" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>URL:</strong> {error.url}<br/>
                  <strong>Error:</strong> {error.error}<br/>
                  <strong>Time:</strong> {error.timestamp}
                </Typography>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Alert severity="info">
        This component monitors WebSocket connections in real-time. 
        Any connection attempts will be logged here and in the browser console.
      </Alert>
    </Box>
  );
};

export default WebSocketDebugger;
