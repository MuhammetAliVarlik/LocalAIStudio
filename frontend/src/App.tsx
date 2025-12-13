import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import { AppProvider } from './context/AppContext';
import { DashboardShell } from './components/DashboardShell';

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