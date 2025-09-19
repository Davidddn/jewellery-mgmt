import React from 'react';
import ReactDOM from 'react-dom/client';
//import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';
import './App.css';
import './unregisterServiceWorker'; // Clean up any existing service workers
// import { registerServiceWorker } from './registerServiceWorker'; // Temporarily disabled
// import { registerSyncListener } from './registerSyncListener'; // Temporarily disabled

// Create a client
//const queryClient = new QueryClient();



// registerServiceWorker(); // Temporarily disabled for debugging
// registerSyncListener(); // Temporarily disabled for debugging

/*ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    //<QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);*/