import React, { useState, useCallback } from 'react';
// FIX: Corrected import paths to be relative.
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import type { User } from './types';

const App: React.FC = () => {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  const handleLogin = useCallback((user: User) => {
    setAuthenticatedUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    setAuthenticatedUser(null);
  }, []);

  return (
    <>
      {!authenticatedUser ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <Layout user={authenticatedUser} onLogout={handleLogout} />
      )}
    </>
  );
};

export default App;
