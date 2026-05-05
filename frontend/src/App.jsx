import React, { useState } from 'react';
import './styles/variables.css';
import { ThemeProvider } from './context/ThemeContext';
import { WardrobeProvider } from './context/WardrobeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginRegister from './components/Auth/LoginRegister';
import LandingPage from './components/Landing/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  
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
    <LandingPage 
      showAuth={!showLanding}
      onLogin={() => setShowLanding(false)} 
      onBackToHome={() => setShowLanding(true)}
    />
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
