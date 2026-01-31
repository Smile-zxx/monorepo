import React from 'react';

const RemoteTable = () => {
  const data = [
    { id: 1, name: 'Remote Item A1', status: 'Active' },
    { id: 2, name: 'Remote Item B2', status: 'Pending' },
    { id: 3, name: 'Remote Item C3', status: 'Completed' },
  ];

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.id}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.name}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RemoteTable;
