import React from 'react';
import { DashboardShell } from './components/DashboardShell';
import { ReactFlowProvider } from 'reactflow';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <ReactFlowProvider>
        <DashboardShell />
      </ReactFlowProvider>
    </AppProvider>
  );
}

export default App;