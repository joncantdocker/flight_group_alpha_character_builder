import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CharacterBuilder from './components/CharacterBuilder';
import Footer from './components/Footer';
import apiService from './services/apiService';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState('checking...');

  useEffect(() => {
    // Check local storage connection on component mount
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      const response = await apiService.healthCheck();
      if (response.status === 'healthy') {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      setApiStatus('disconnected');
    }
  };

  return (
    <div className="App">
      <Header apiStatus={apiStatus} />
      <main className="main-content">
        <CharacterBuilder />
      </main>
      <Footer />
    </div>
  );
}

export default App;