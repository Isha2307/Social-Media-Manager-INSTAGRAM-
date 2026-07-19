import React from 'react';
import { connectInstagram } from './api-client';

export const InstagramConnect: React.FC = () => {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px' }}>
      <h2>Connect Social Media</h2>
      <p>Connect your Instagram Business or Creator account to start publishing posts automatically.</p>
      <button 
        onClick={connectInstagram}
        style={{
          padding: '10px 16px',
          backgroundColor: '#E1306C',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Connect Instagram
      </button>
    </div>
  );
};
