import React from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/MainLayout';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MainLayout />
      </SettingsProvider>
    </AuthProvider>
  );
}
