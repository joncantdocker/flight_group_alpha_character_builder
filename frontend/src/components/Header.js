import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const Header = ({ apiStatus }) => {
  const [showCharacterMenu, setShowCharacterMenu] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [currentCharacter, setCurrentCharacter] = useState(null);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const chars = await apiService.getCharacters();
        setCharacters(chars);
        const current = apiService.getCurrentCharacter();
        setCurrentCharacter(current);
      } catch (err) {
        console.error('Failed to load characters:', err);
      }
    };
    
    loadCharacters();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCharacterMenu && !event.target.closest('.header-character-menu')) {
        setShowCharacterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCharacterMenu]);

  const switchCharacter = async (characterId) => {
    try {
      apiService.setCurrentCharacter(characterId);
      const character = await apiService.getCharacterById(characterId);
      setCurrentCharacter(character);
      setShowCharacterMenu(false);
      // Trigger a custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('characterChanged', { detail: character }));
    } catch (err) {
      console.error('Failed to switch character:', err);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Hamburger Menu - Mobile Only */}
          <div className="header-character-menu">
            <button 
              className="header-hamburger-button"
              onClick={() => setShowCharacterMenu(!showCharacterMenu)}
              title={currentCharacter ? `Current: ${currentCharacter.callsign}` : 'Select Character'}
            >
              ☰
            </button>
            
            {showCharacterMenu && (
              <div className="header-character-dropdown">
                {characters.map(char => (
                  <div
                    key={char.id}
                    className={`character-option ${currentCharacter?.id === char.id ? 'active' : ''}`}
                    onClick={() => switchCharacter(char.id)}
                  >
                    {char.callsign} (Rank {char.rank})
                  </div>
                ))}
              </div>
            )}
          </div>

          <h1 style={{ wordBreak: 'break-word', lineHeight: '1.3', margin: 0, flex: 1, textAlign: 'center' }}>
            <span style={{ fontFamily: 'X-Wing-Ships, Arial, sans-serif', marginRight: '10px' }}>F</span>
            <span className="header-title-text">Flight Group Alpha Character Builder</span>
            <span className={`status-indicator ${getStatusClass()}`} title={`Storage Status: ${apiStatus}`}></span>
          </h1>
          
          {/* Spacer for centering */}
          <div style={{ width: '44px' }}></div>
        </div>
        <p className="header-tagline" style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9, textAlign: 'center' }}>
          Build and manage your characters • XP Tracking • Rank Progression
        </p>
      </div>
    </header>
  );
};

export default Header;