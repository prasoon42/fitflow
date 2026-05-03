import './styles/variables.css';
import { ThemeProvider } from './context/ThemeContext';
import { WardrobeProvider } from './context/WardrobeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginRegister from './components/Auth/LoginRegister';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-family)',
        }}
      >
        Loading…
      </div>
    );
  }
  
  return user ? (
    <WardrobeProvider>
      <Layout />
    </WardrobeProvider>
  ) : (
    <LoginRegister />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
