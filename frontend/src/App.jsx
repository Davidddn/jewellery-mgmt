import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { CustomThemeProvider } from './contexts/CustomThemeContext';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CustomThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </CustomThemeProvider>
    </BrowserRouter>
  );
}

export default App;