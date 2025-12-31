import React from 'react';

const Header = ({ apiStatus }) => {
  const getStatusClass = () => {
    switch (apiStatus) {
      case 'connected': return 'status-connected';
      case 'disconnected': return 'status-disconnected';
      case 'error': return 'status-error';
      default: return 'status-checking';
    }
  };

  return (
    <header className="header">
      <div className="container">
        <h1>
          ⚔️ Character Builder
          <span className={`status-indicator ${getStatusClass()}`} title={`Storage Status: ${apiStatus}`}></span>
        </h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          Build and manage your characters • XP Tracking • Rank Progression
        </p>
      </div>
    </header>
  );
};

export default Header;