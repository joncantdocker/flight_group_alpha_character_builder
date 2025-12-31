import React from 'react';

const About = () => {
  return (
    <div className="container">
      <h2>About Flight Group Alpha</h2>
      
      <div className="card">
        <h3>Technology Stack</h3>
        <ul>
          <li><strong>Frontend:</strong> React 18 with React Router</li>
          <li><strong>Data Storage:</strong> Browser Local Storage</li>
          <li><strong>Containerization:</strong> Docker (Frontend Only)</li>
          <li><strong>State Management:</strong> React Hooks & Local Storage</li>
        </ul>
      </div>
      
      <div className="card">
        <h3>Features</h3>
        <ul>
          <li>Modern React frontend with routing</li>
          <li>Local data storage (no backend required)</li>
          <li>CRUD operations for flight route management</li>
          <li>Lightweight single-container deployment</li>
          <li>Real-time data updates</li>
          <li>Persistent data storage in browser</li>
        </ul>
      </div>
      
      <div className="card">
        <h3>Data Storage</h3>
        <p>
          This application stores all data locally in your browser's localStorage. 
          No external database or backend server is required, making it extremely 
          lightweight and portable.
        </p>
        <p>
          <strong>Note:</strong> Data will persist across browser sessions but will be 
          lost if you clear your browser's storage or use a different browser/device.
        </p>
      </div>
      
      <div className="card">
        <h3>Getting Started</h3>
        <p>
          To run this application, you just need Docker installed.
          Run <code>docker build -t flight-app . && docker run -p 3000:3000 flight-app</code> 
          from the frontend directory.
        </p>
        <p>
          Or for development: <code>npm start</code>
        </p>
      </div>
    </div>
  );
};

export default About;