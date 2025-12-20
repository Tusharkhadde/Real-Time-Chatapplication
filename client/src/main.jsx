import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from '@context/ThemeContext';
import { AuthProvider } from '@context/AuthContext';
import { SocketProvider } from '@context/SocketContext';
import { NotificationProvider } from '@context/NotificationContext';
import { ChatProvider } from '@context/ChatContext';
import './index.css';

// Debug environment
console.log('🔧 Environment:', {
  API_URL: import.meta.env.VITE_API_URL,
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  MODE: import.meta.env.MODE
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <ChatProvider>
                <App />
              </ChatProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);