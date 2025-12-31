import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService';
import pathUpgradesService from '../services/pathUpgradesService';
import XWingSymbols from './XWingSymbols';
import Snackbar from './Snackbar';
import ShipSelector from './ShipSelector';

const CharacterBuilder = () => {
  const [characters, setCharacters] = useState([]);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null); // Temp state for unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ message: '', type: 'error', show: false });
  
  const [showNewCharacterForm, setShowNewCharacterForm] = useState(false);
  const [newCharacterCallsign, setNewCharacterCallsign] = useState('');
  
  // XP Transfer amounts
  const [addBankedAmount, setAddBankedAmount] = useState(0);
  const [toLoadoutAmount, setToLoadoutAmount] = useState(0);
  const [toPathAmount, setToPathAmount] = useState(0);
  const [xpLog, setXpLog] = useState([]);

  // Path selection
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');
  const [availablePaths, setAvailablePaths] = useState([]);

  // Ship selection save function reference
  const saveShipSelectionRef = useRef(null);

  // XP Log persistence functions
  const loadXpLog = (characterId) => {
    if (!characterId) return [];
    const saved = localStorage.getItem(`xp_log_${characterId}`);
    return saved ? JSON.parse(saved) : [];
  };

  const saveXpLog = (characterId, log) => {
    if (!characterId) return;
    localStorage.setItem(`xp_log_${characterId}`, JSON.stringify(log));
  };

  // Snackbar helper functions
  const showSnackbar = (message, type = 'error') => {
    setSnackbar({ message, type, show: true });
  };

  const hideSnackbar = () => {
    setSnackbar({ message: '', type: 'error', show: false });
  };

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const chars = await apiService.getCharacters();
      setCharacters(chars);
      
      // Load available paths
      setAvailablePaths(pathUpgradesService.getAvailablePaths());
      
      // Get current character
      const current = apiService.getCurrentCharacter();
      setCurrentCharacter(current);
      setEditingCharacter(current ? { ...current } : null); // Create copy for editing
      setHasUnsavedChanges(false);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkUnsavedChanges = () => {
    if (hasUnsavedChanges) {
      return window.confirm(
        'You have unsaved changes that will be lost. Are you sure you want to continue without saving?'
      );
    }
    return true;
  };

  const switchCharacter = async (characterId) => {
    if (!checkUnsavedChanges()) {
      return;
    }

    try {
      apiService.setCurrentCharacter(characterId);
      const character = await apiService.getCharacterById(characterId);
      setCurrentCharacter(character);
      setEditingCharacter(character ? { ...character } : null);
      setHasUnsavedChanges(false);
      
      // Reset transfer amounts when switching characters
      setAddBankedAmount(0);
      setToLoadoutAmount(0);
      setToPathAmount(0);
      
      setMessage(`Switched to ${character.callsign}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const createNewCharacter = async () => {
    if (!newCharacterCallsign.trim()) return;
    
    if (!checkUnsavedChanges()) {
      return;
    }
    
    try {
      setLoading(true);
      const newChar = await apiService.createCharacter({
        callsign: newCharacterCallsign,
        bankedXP: 0,
        loadoutXP: 0,
        pathXP: 0,
        rank: 1,
        path: "None"
      });
      
      setNewCharacterCallsign('');
      setShowNewCharacterForm(false);
      await fetchCharacters();
      switchCharacter(newChar.id);
      setMessage(`Created new character: ${newChar.callsign}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateCharacterField = (field, value) => {
    if (!editingCharacter) return;
    
    // Only allow callsign updates directly, XP is handled by transfer functions
    if (field === 'callsign') {
      const updatedChar = {
        ...editingCharacter,
        [field]: value
      };
      
      setEditingCharacter(updatedChar);
      setHasUnsavedChanges(true);
    }
  };

  const addXpToLog = (type, amount, description) => {
    if (!currentCharacter) return;
    
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      type,
      amount,
      description
    };
    const newLog = [logEntry, ...xpLog].slice(0, 10); // Keep last 10 entries
    setXpLog(newLog);
    saveXpLog(currentCharacter.id, newLog);
  };

  const addBankedXP = () => {
    if (!editingCharacter || !addBankedAmount || addBankedAmount <= 0) return;
    
    const updatedChar = {
      ...editingCharacter,
      bankedXP: editingCharacter.bankedXP + parseInt(addBankedAmount)
    };
    
    setEditingCharacter(updatedChar);
    setHasUnsavedChanges(true);
    addXpToLog('add', addBankedAmount, 'Added to Banked XP');
    setAddBankedAmount(0);
  };

  const transferToLoadout = () => {
    if (!editingCharacter || !toLoadoutAmount || toLoadoutAmount <= 0) return;
    
    const amount = parseInt(toLoadoutAmount);
    if (amount > editingCharacter.bankedXP) {
      showSnackbar('Not enough Banked XP for transfer', 'error');
      return;
    }
    
    const updatedChar = {
      ...editingCharacter,
      bankedXP: editingCharacter.bankedXP - amount,
      loadoutXP: editingCharacter.loadoutXP + amount
    };
    
    setEditingCharacter(updatedChar);
    setHasUnsavedChanges(true);
    addXpToLog('transfer', -amount, `Transferred to Loadout XP`);
    setToLoadoutAmount(0);
  };

  const transferToPath = () => {
    if (!editingCharacter || !toPathAmount || toPathAmount <= 0) return;
    
    const amount = parseInt(toPathAmount);
    if (amount > editingCharacter.bankedXP) {
      showSnackbar('Not enough Banked XP for transfer', 'error');
      return;
    }
    
    const updatedChar = {
      ...editingCharacter,
      bankedXP: editingCharacter.bankedXP - amount,
      pathXP: editingCharacter.pathXP + amount
    };
    
    setEditingCharacter(updatedChar);
    setHasUnsavedChanges(true);
    addXpToLog('transfer', -amount, `Transferred to Path XP`);
    setToPathAmount(0);
  };

  // Path selection functions
  const openPathSelection = () => {
    if (editingCharacter && pathUpgradesService.canSelectPath(editingCharacter)) {
      setSelectedPath('');
      setShowPathSelection(true);
    }
  };

  const selectPath = async () => {
    if (!selectedPath || !editingCharacter) return;
    
    const updatedChar = {
      ...editingCharacter,
      path: selectedPath
    };
    
    setEditingCharacter(updatedChar);
    setHasUnsavedChanges(true);
    setShowPathSelection(false);
    setMessage(`Selected ${selectedPath} path!`);
    setTimeout(() => setMessage(''), 3000);
  };

  const cancelPathSelection = () => {
    setShowPathSelection(false);
    setSelectedPath('');
  };

  const saveCharacter = async () => {
    if (!editingCharacter || !hasUnsavedChanges) return;
    
    try {
      setLoading(true);
      const savedChar = await apiService.updateCharacter(editingCharacter.id, editingCharacter);
      
      setCurrentCharacter(savedChar);
      setEditingCharacter({ ...savedChar });
      setHasUnsavedChanges(false);
      
      // Update in characters list
      setCharacters(chars => 
        chars.map(char => char.id === savedChar.id ? savedChar : char)
      );
      
      setMessage('Character saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const discardChanges = () => {
    if (currentCharacter) {
      setEditingCharacter({ ...currentCharacter });
      setHasUnsavedChanges(false);
      setMessage('Changes discarded');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const levelUp = async () => {
    if (!editingCharacter) return;
    
    try {
      setLoading(true);
      const cost = apiService.getLevelUpCost(editingCharacter.rank);
      
      // Check if character can level up using current editing character data
      if (editingCharacter.rank >= 8) {
        showSnackbar('Already at maximum rank', 'error');
        return;
      }
      
      if (editingCharacter.bankedXP < cost) {
        showSnackbar(`Need ${cost} Banked XP to level up`, 'error');
        return;
      }
      
      // Check path requirement for rank 2->3
      if (editingCharacter.rank === 2 && (!editingCharacter.path || editingCharacter.path === 'None')) {
        showSnackbar('Must select a specialization path first', 'error');
        return;
      }
      
      // Update editing character only (don't save yet)
      const updatedChar = {
        ...editingCharacter,
        rank: editingCharacter.rank + 1,
        bankedXP: editingCharacter.bankedXP - cost
      };
      
      setEditingCharacter(updatedChar);
      setHasUnsavedChanges(true); // Mark as having unsaved changes
      
      // Add to XP log
      addXpToLog('levelup', -cost, `Level up to Rank ${updatedChar.rank} (Cost: ${cost} XP)`);
      
      // Check if character reached rank 3 and needs path selection
      if (updatedChar.rank === 3 && pathUpgradesService.needsPathSelection(updatedChar)) {
        setMessage(`Leveled up to rank ${updatedChar.rank}! You must now choose a specialization path before saving!`);
        setTimeout(() => {
          setMessage('');
          openPathSelection();
        }, 2000);
      } else {
        setMessage(`Leveled up to rank ${updatedChar.rank}! Don't forget to save your changes.`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacter = async (characterId) => {
    if (!window.confirm('Are you sure you want to delete this character?')) return;
    
    try {
      setLoading(true);
      await apiService.deleteCharacter(characterId);
      await fetchCharacters();
      setMessage('Character deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveAll = async () => {
    try {
      setLoading(true);
      
      // If there are unsaved changes, save them first
      if (hasUnsavedChanges && editingCharacter) {
        await apiService.updateCharacter(editingCharacter.id, editingCharacter);
        setCurrentCharacter(editingCharacter);
        setHasUnsavedChanges(false);
      }
      
      // Save ship selection if available
      if (saveShipSelectionRef.current && typeof saveShipSelectionRef.current === 'function') {
        await saveShipSelectionRef.current();
      }
      
      const result = await apiService.saveAll();
      setMessage(result.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load XP log when current character changes
  useEffect(() => {
    if (currentCharacter) {
      const log = loadXpLog(currentCharacter.id);
      setXpLog(log);
    } else {
      setXpLog([]);
    }
  }, [currentCharacter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle page refresh/close warnings
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const getRankName = (rank) => {
    const ranks = ['', 'Flight Cadet', 'Flight Officer', 'Lieutenant', 'Captain', 'Commander', 'Major', 'Colonel', 'General'];
    return ranks[rank] || 'Unknown';
  };

  const levelUpCost = editingCharacter ? apiService.getLevelUpCost(editingCharacter.rank) : null;
  
  // Enhanced canLevelUp logic that considers path selection for rank 2->3
  const canLevelUp = editingCharacter ? (() => {
    // Check XP requirement using editing character data
    if (editingCharacter.rank >= 8) return false;
    const cost = apiService.getLevelUpCost(editingCharacter.rank);
    const hasEnoughXP = editingCharacter.bankedXP >= cost;
    
    // If trying to level from rank 2 to 3, must have a path selected
    if (editingCharacter.rank === 2 && hasEnoughXP) {
      return editingCharacter.path && editingCharacter.path !== 'None';
    }
    
    return hasEnoughXP;
  })() : false;

  // Get appropriate level up button text
  const getLevelUpButtonText = () => {
    if (!editingCharacter) return 'Cannot Level Up';
    if (editingCharacter.rank >= 8) return 'Max Level Reached';
    
    // Check XP requirement using editing character data
    const cost = apiService.getLevelUpCost(editingCharacter.rank);
    const hasEnoughXP = editingCharacter.bankedXP >= cost;
    
    if (!hasEnoughXP) return `Need ${cost} Banked XP`;
    
    // Check if rank 2 trying to level without path
    if (editingCharacter.rank === 2 && (!editingCharacter.path || editingCharacter.path === 'None')) {
      return 'Select Path First';
    }
    
    return `🚀 Level Up (Cost: ${levelUpCost})`;
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Character Builder</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {hasUnsavedChanges && (
            <span style={{ 
              color: '#dc3545', 
              fontSize: '14px', 
              fontWeight: 'bold' 
            }}>
              ● Unsaved Changes
            </span>
          )}
          {hasUnsavedChanges && (
            <>
              <button 
                className="button" 
                onClick={discardChanges}
                style={{ background: '#6c757d', fontSize: '14px', padding: '8px 16px' }}
                disabled={loading}
              >
                🚫 Discard
              </button>
              <button 
                className="button" 
                onClick={saveCharacter}
                style={{ background: '#28a745', fontSize: '14px', padding: '8px 16px' }}
                disabled={loading}
              >
                💾 Save
              </button>
            </>
          )}
          <button 
            className="button" 
            onClick={saveAll} 
            disabled={loading}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            💾 Save All
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ 
          padding: '10px', 
          background: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {message}
        </div>
      )}

      {/* Character Selection Menu */}
      <div className="card">
        <h3>Character Selection ({characters.length} characters)</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          {characters.map(char => (
            <button
              key={char.id}
              onClick={() => switchCharacter(char.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: currentCharacter?.id === char.id ? '2px solid #007bff' : '1px solid #ccc',
                background: currentCharacter?.id === char.id ? '#e3f2fd' : 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {char.callsign} (Rank {char.rank})
            </button>
          ))}
        </div>
        
        {!showNewCharacterForm ? (
          <button 
            className="button" 
            onClick={() => setShowNewCharacterForm(true)}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            ➕ New Character
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter callsign..."
              value={newCharacterCallsign}
              onChange={(e) => setNewCharacterCallsign(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createNewCharacter()}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button 
              className="button" 
              onClick={createNewCharacter}
              disabled={!newCharacterCallsign.trim() || loading}
            >
              Create
            </button>
            <button 
              onClick={() => setShowNewCharacterForm(false)}
              style={{ 
                padding: '8px 12px', 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px' 
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Character Details */}
      {editingCharacter ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>
              Character: {editingCharacter.callsign}
              {hasUnsavedChanges && <span style={{ color: '#dc3545', fontSize: '14px' }}> (Modified)</span>}
            </h3>
            <button
              onClick={() => deleteCharacter(editingCharacter.id)}
              style={{
                padding: '6px 12px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              🗑️ Delete
            </button>
          </div>

          {/* Basic Info */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Callsign:
            </label>
            <input
              type="text"
              value={editingCharacter.callsign}
              onChange={(e) => updateCharacterField('callsign', e.target.value)}
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                border: hasUnsavedChanges ? '2px solid #ffc107' : '1px solid #ccc',
                width: '200px'
              }}
            />
          </div>

          {/* Rank and Level Up */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px', 
            marginBottom: '20px' 
          }}>
            <div>
              <h4>Initiative</h4>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                {(() => {
                  const bonuses = pathUpgradesService.getCharacterBonuses(editingCharacter);
                  return bonuses.initiative;
                })()}
              </p>
              
              <h4>Rank Information</h4>
              <p><strong>Current Rank:</strong> {editingCharacter.rank} - {getRankName(editingCharacter.rank)}</p>
              {editingCharacter.rank < 8 && (
                <div>
                  <p><strong>Next Level Cost:</strong> {levelUpCost} Banked XP</p>
                  <button
                    className="button"
                    onClick={levelUp}
                    disabled={!canLevelUp || loading}
                    style={{
                      background: canLevelUp ? '#28a745' : '#6c757d',
                      opacity: canLevelUp ? 1 : 0.6
                    }}
                  >
                    {getLevelUpButtonText()}
                  </button>
                </div>
              )}
              {editingCharacter.rank >= 8 && (
                <p style={{ color: '#28a745', fontWeight: 'bold' }}>🏆 Maximum Rank Achieved!</p>
              )}
            </div>

            {/* Path Information */}
            <div>
              <h4>Specialization Path</h4>
              <p><strong>Current Path:</strong> {editingCharacter.path || 'None'}</p>
              <p style={{ fontSize: '14px', color: '#6c757d' }}>
                {pathUpgradesService.getPathDescription(editingCharacter.path || 'None')}
              </p>

              {/* Path selection helper text for rank 2 */}
              {editingCharacter.rank === 2 && (!editingCharacter.path || editingCharacter.path === 'None') && (
                <div style={{ 
                  background: '#fff3cd', 
                  color: '#856404', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  fontSize: '14px',
                  marginTop: '10px'
                }}>
                  💡 <strong>Tip:</strong> Select a specialization path now to unlock level 3 advancement!
                </div>
              )}
              
              {/* Path Selection Button */}
              {pathUpgradesService.shouldSelectPath(editingCharacter) && (
                <button
                  className="button"
                  onClick={openPathSelection}
                  style={{
                    background: editingCharacter.rank >= 3 ? '#dc3545' : '#ffc107',
                    color: editingCharacter.rank >= 3 ? 'white' : 'black',
                    marginTop: '10px'
                  }}
                >
                  {editingCharacter.rank >= 3 ? '⚠️ Choose Path (Required)' : '📋 Choose Path (Recommended)'}
                </button>
              )}
              
              {editingCharacter.path && editingCharacter.path !== 'None' && (
                <button
                  className="button"
                  onClick={openPathSelection}
                  disabled={editingCharacter.path !== 'None'}
                  style={{
                    background: '#6c757d',
                    opacity: 0.6,
                    marginTop: '10px'
                  }}
                >
                  Path Locked
                </button>
              )}

              {/* Path Bonuses Display */}
              {editingCharacter && (
                <div style={{ marginTop: '15px' }}>
                  <h5>Current Bonuses:</h5>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '10px', 
                    borderRadius: '4px', 
                    fontSize: '14px' 
                  }}>
                    <XWingSymbols bonuses={pathUpgradesService.getCharacterBonusesWithSymbols(editingCharacter)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* XP Pools */}
          <div>
            <h4>Experience Points</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              {/* Banked XP - Editable */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Banked XP:
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCharacter.bankedXP}
                  onChange={(e) => updateCharacterField('bankedXP', e.target.value)}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: hasUnsavedChanges ? '2px solid #ffc107' : '1px solid #ccc',
                    width: '100px'
                  }}
                />
                {/* Add Banked XP */}
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Add XP"
                    value={addBankedAmount}
                    onChange={(e) => setAddBankedAmount(e.target.value)}
                    style={{ 
                      padding: '6px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc',
                      width: '80px',
                      marginRight: '5px'
                    }}
                  />
                  <button
                    onClick={addBankedXP}
                    disabled={!addBankedAmount || addBankedAmount <= 0}
                    style={{
                      padding: '6px 8px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Loadout XP - Readonly with Transfer */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Loadout XP:
                </label>
                <input
                  type="number"
                  value={editingCharacter.loadoutXP}
                  readOnly
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    width: '100px',
                    background: '#f8f9fa',
                    color: '#6c757d'
                  }}
                />
                {/* Transfer to Loadout */}
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Transfer"
                    value={toLoadoutAmount}
                    onChange={(e) => setToLoadoutAmount(e.target.value)}
                    style={{ 
                      padding: '6px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc',
                      width: '80px',
                      marginRight: '5px'
                    }}
                  />
                  <button
                    onClick={transferToLoadout}
                    disabled={!toLoadoutAmount || toLoadoutAmount <= 0 || toLoadoutAmount > editingCharacter.bankedXP}
                    style={{
                      padding: '6px 8px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              {/* Path XP - Readonly with Transfer */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Path XP:
                </label>
                <input
                  type="number"
                  value={editingCharacter.pathXP}
                  readOnly
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    width: '100px',
                    background: '#f8f9fa',
                    color: '#6c757d'
                  }}
                />
                {/* Transfer to Path */}
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Transfer"
                    value={toPathAmount}
                    onChange={(e) => setToPathAmount(e.target.value)}
                    style={{ 
                      padding: '6px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc',
                      width: '80px',
                      marginRight: '5px'
                    }}
                  />
                  <button
                    onClick={transferToPath}
                    disabled={!toPathAmount || toPathAmount <= 0 || toPathAmount > editingCharacter.bankedXP}
                    style={{
                      padding: '6px 8px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* XP Transaction Log */}
            {xpLog.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h5>XP Transaction Log</h5>
                <div style={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  background: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {xpLog.map((entry, index) => (
                    <div key={index} style={{ 
                      marginBottom: '5px',
                      color: entry.amount > 0 ? '#28a745' : '#dc3545'
                    }}>
                      <strong>{entry.timestamp}:</strong> {entry.description} ({entry.amount > 0 ? '+' : ''}{entry.amount} XP)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Character Stats Summary */}
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
            <h4>Character Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <p><strong>Total XP:</strong> {editingCharacter.bankedXP + editingCharacter.loadoutXP + editingCharacter.pathXP}</p>
              <p><strong>Created:</strong> {new Date(editingCharacter.createdAt).toLocaleDateString()}</p>
              <p><strong>Last Saved:</strong> {currentCharacter ? new Date(currentCharacter.lastSaved).toLocaleString() : 'Never'}</p>
              {hasUnsavedChanges && (
                <p style={{ color: '#dc3545', fontWeight: 'bold' }}>⚠️ Unsaved Changes</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No character selected. Choose a character from the menu above or create a new one.</p>
        </div>
      )}

      {/* Ship Selection Section */}
      <ShipSelector 
        editingCharacter={editingCharacter} 
        onSaveShipSelection={(func) => { saveShipSelectionRef.current = func; }}
      />
      
      {/* Path Selection Modal */}
      {showPathSelection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3>Choose Your Specialization Path</h3>
            <p>At rank 3, you must choose a specialization path that will define your character's unique abilities and bonuses.</p>
            
            <div style={{ margin: '20px 0' }}>
              {availablePaths.map(path => (
                <div key={path} style={{
                  border: selectedPath === path ? '2px solid #007bff' : '1px solid #ccc',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedPath === path ? '#e3f2fd' : 'white'
                }} onClick={() => setSelectedPath(path)}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{path}</h4>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                    {pathUpgradesService.getPathDescription(path)}
                  </p>
                  
                  {/* Show rank 3 bonuses preview */}
                  {(() => {
                    const rank3Bonuses = pathUpgradesService.getRankBonusesWithSymbols(path, 3);
                    if (rank3Bonuses) {
                      return (
                        <div style={{ marginTop: '10px', fontSize: '12px', background: '#f8f9fa', padding: '8px', borderRadius: '4px' }}>
                          <strong>Rank 3 Bonuses:</strong>
                          <XWingSymbols bonuses={rank3Bonuses} />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelPathSelection}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={selectPath}
                disabled={!selectedPath}
                style={{
                  padding: '10px 20px',
                  background: selectedPath ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  opacity: selectedPath ? 1 : 0.6
                }}
              >
                Select Path
              </button>
            </div>
            
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#dc3545' }}>
              <strong>Warning:</strong> Path selection is permanent and cannot be changed once selected.
            </div>
          </div>
        </div>
      )}
      
      {/* Snackbar for error messages */}
      {snackbar.show && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={hideSnackbar}
        />
      )}
    </div>
  );
};

export default CharacterBuilder;