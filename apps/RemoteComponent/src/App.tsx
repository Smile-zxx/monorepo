import React from 'react';
import RemoteTable from '@/components/RemoteTable';

const App = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Remote Component Development</h1>
      <hr />
      <h3>Preview: RemoteTable</h3>
      <RemoteTable />
    </div>
  );
};

export default App;
