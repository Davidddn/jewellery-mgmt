import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Temporarily remove StrictMode to test if it's causing duplicate effects
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);