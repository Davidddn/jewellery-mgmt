import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { CustomThemeProvider } from './contexts/CustomThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRoutes from './routes';
import { useEffect } from 'react';
import { subscribeUserToPush } from './pushNotifications';


function App() {
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        subscribeUserToPush();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            subscribeUserToPush();
          }
        });
      }
    }
  }, []);
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CustomThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </BrowserRouter>
  );
}

export default App;