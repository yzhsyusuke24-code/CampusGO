import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProfileView from './components/ProfileView';
import CreateOrderView from './components/CreateOrderView';
import RequesterOrdersView from './components/RequesterOrdersView';
import LobbyView from './components/LobbyView';
import RunnerTasksView from './components/RunnerTasksView';

function AppContent() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('create'); // Default for requester

  // Reset tab when role changes
  React.useEffect(() => {
    if (role === 'requester') {
      setActiveTab('create');
    } else {
      setActiveTab('lobby');
    }
  }, [role]);

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <ProfileView />;
    }

    if (role === 'requester') {
      switch (activeTab) {
        case 'create':
          return <CreateOrderView onOrderCreated={() => setActiveTab('orders')} />;
        case 'orders':
          return <RequesterOrdersView />;
        default:
          return null;
      }
    } else {
      switch (activeTab) {
        case 'lobby':
          return <LobbyView onTaskAccepted={() => setActiveTab('tasks')} />;
        case 'tasks':
          return <RunnerTasksView />;
        default:
          return null;
      }
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
