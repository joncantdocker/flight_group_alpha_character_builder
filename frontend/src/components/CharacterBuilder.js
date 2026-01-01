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
  
  // Import/Export functionality
  const [showImportExport, setShowImportExport] = useState(false);
  const [exportString, setExportString] = useState('');
  const [importString, setImportString] = useState('');
  
  // XP Transfer amounts
  const [addBankedAmount, setAddBankedAmount] = useState(0);
  const [toLoadoutAmount, setToLoadoutAmount] = useState(0);
  const [toPathAmount, setToPathAmount] = useState(0);
  const [xpLog, setXpLog] = useState([]);
  const [, setTempXpLogEntries] = useState([]); // Track unsaved XP log entries

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


  // Listen for character changes from header
  useEffect(() => {
    const handleCharacterChange = (event) => {
      const character = event.detail;
      setCurrentCharacter(character);
      setEditingCharacter(character ? { ...character } : null);
      setHasUnsavedChanges(false);
    };

    window.addEventListener('characterChanged', handleCharacterChange);
    return () => {
      window.removeEventListener('characterChanged', handleCharacterChange);
    };
  }, []);

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
      
      // Clear temporary XP log entries when switching characters
      setTempXpLogEntries([]);
      
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
    
    // Add to temporary entries (don't save yet)
    setTempXpLogEntries(prev => [logEntry, ...prev]);
    
    // Update display to include temp entries
    const newLog = [logEntry, ...xpLog].slice(0, 10);
    setXpLog(newLog);
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
    
    const bankedAmount = parseInt(toPathAmount);
    if (bankedAmount > editingCharacter.bankedXP) {
      showSnackbar('Not enough Banked XP for transfer', 'error');
      return;
    }
    
    // Convert at 3 banked XP to 2 path XP ratio
    const pathAmount = Math.floor((bankedAmount * 2) / 3);
    
    const updatedChar = {
      ...editingCharacter,
      bankedXP: editingCharacter.bankedXP - bankedAmount,
      pathXP: editingCharacter.pathXP + pathAmount
    };
    
    setEditingCharacter(updatedChar);
    setHasUnsavedChanges(true);
    addXpToLog('transfer', -bankedAmount, `Transferred ${bankedAmount} Banked XP to ${pathAmount} Path XP`);
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

  const discardChanges = () => {
    if (currentCharacter) {
      setEditingCharacter({ ...currentCharacter });
      setHasUnsavedChanges(false);
      
      // Remove temporary XP log entries and restore original log
      setTempXpLogEntries([]);
      const originalLog = loadXpLog(currentCharacter.id);
      setXpLog(originalLog);
      
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
      if (editingCharacter.rank >= 11) {
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
        const savedChar = await apiService.updateCharacter(editingCharacter.id, editingCharacter);
        setCurrentCharacter(savedChar);
        setEditingCharacter({ ...savedChar });
        setHasUnsavedChanges(false);
        
        // Update in characters list
        setCharacters(chars => 
          chars.map(char => char.id === savedChar.id ? savedChar : char)
        );
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

  const exportCharacter = () => {
    if (!currentCharacter) {
      showSnackbar('No character selected to export', 'error');
      return;
    }
    
    try {
      const exportedString = apiService.exportCharacter(currentCharacter);
      setExportString(exportedString);
      setShowImportExport(true);
      showSnackbar(`Character "${currentCharacter.callsign}" exported successfully!`, 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const importCharacter = async () => {
    if (!importString.trim()) {
      showSnackbar('Please enter a character export string', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const result = await apiService.importCharacter(importString.trim());
      
      if (result.success) {
        await fetchCharacters();
        switchCharacter(result.character.id);
        setImportString('');
        setShowImportExport(false);
        showSnackbar(result.message, 'success');
      }
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const duplicateCharacter = async () => {
    if (!currentCharacter) {
      showSnackbar('No character selected to duplicate', 'error');
      return;
    }
    
    if (!checkUnsavedChanges()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate a unique callsign
      const baseCallsign = currentCharacter.callsign;
      const existingCallsigns = characters.map(char => char.callsign);
      let duplicateCallsign = `${baseCallsign} Copy`;
      let counter = 2;
      
      while (existingCallsigns.includes(duplicateCallsign)) {
        duplicateCallsign = `${baseCallsign} Copy ${counter}`;
        counter++;
      }
      
      // Create new character with same data but new callsign
      const duplicateChar = await apiService.createCharacter({
        callsign: duplicateCallsign,
        bankedXP: currentCharacter.bankedXP,
        loadoutXP: currentCharacter.loadoutXP,
        pathXP: currentCharacter.pathXP,
        rank: currentCharacter.rank,
        path: currentCharacter.path
      });
      
      // Copy ship selection data to the new character
      const shipCopied = apiService.copyShipSelection(currentCharacter.id, duplicateChar.id);
      
      await fetchCharacters();
      switchCharacter(duplicateChar.id);
      
      let message = `Created duplicate character: ${duplicateCallsign}`;
      if (shipCopied) {
        message += ' (including ship selection)';
      }
      
      setMessage(message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar('Copied to clipboard!', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSnackbar('Copied to clipboard!', 'success');
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
      setTempXpLogEntries([]); // Clear temporary entries when loading character
    } else {
      setXpLog([]);
      setTempXpLogEntries([]);
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
    if (editingCharacter.rank >= 11) return false;
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
    if (editingCharacter.rank >= 11) return 'Max Level Reached';
    
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
      <div style={{ marginBottom: '20px' }}>
        <h2>Character Builder</h2>
        <div className="mobile-button-group" style={{ marginTop: '10px' }}>
          {hasUnsavedChanges && (
            <span style={{ 
              color: '#dc3545', 
              fontSize: '14px', 
              fontWeight: 'bold',
              alignSelf: 'center'
            }}>
              ● Unsaved Changes
            </span>
          )}
          <div className="mobile-button-row">
            {hasUnsavedChanges && (
              <button 
                className="button icon-button" 
                onClick={discardChanges}
                style={{ background: '#6c757d', fontSize: '18px' }}
                disabled={loading}
                title="Discard Changes"
              >
                🗙
              </button>
            )}
            <button 
              className="button" 
              onClick={saveAll} 
              disabled={loading}
              style={{ fontSize: '14px', padding: '8px 16px' }}
              title="Save All Characters"
            >
              💾
            </button>
            <button 
              className="button" 
              onClick={exportCharacter} 
              disabled={loading || !currentCharacter}
              style={{ fontSize: '14px', padding: '8px 16px', background: '#17a2b8' }}
              title="Export Character"
            >
              📥
            </button>
            <button 
              className="button" 
              onClick={() => setShowImportExport(true)} 
              disabled={loading}
              style={{ fontSize: '14px', padding: '8px 16px', background: '#28a745' }}
              title="Import Character"
            >
              📤
            </button>
            <button 
              className="button" 
              onClick={duplicateCharacter} 
              disabled={loading || !currentCharacter}
              style={{ fontSize: '14px', padding: '8px 16px', background: '#6f42c1' }}
              title="Duplicate Character"
            >
              ⎘
            </button>
          </div>
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

      {/* Import/Export Panel */}
      {showImportExport && (
        <div className="card" style={{ background: '#f8f9fa', border: '2px solid #007bff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3>Import/Export Character</h3>
            <button
              onClick={() => {
                setShowImportExport(false);
                setExportString('');
                setImportString('');
              }}
              style={{ 
                padding: '6px 12px', 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                fontSize: '12px',
                minHeight: '32px'
              }}
            >
              ✕ Close
            </button>
          </div>
          
          {/* Export Section */}
          {exportString && (
            <div style={{ marginBottom: '20px' }}>
              <h4>📤 Export Data</h4>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                Copy this string to share your character:
              </p>
              <div className="mobile-button-row" style={{ alignItems: 'flex-start' }}>
                <textarea
                  value={exportString}
                  readOnly
                  style={{
                    flex: 1,
                    height: '80px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    resize: 'vertical',
                    background: '#f8f9fa'
                  }}
                />
                <button
                  onClick={() => copyToClipboard(exportString)}
                  className="button"
                  style={{
                    background: '#007bff',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    minWidth: '80px',
                    width: 'auto'
                  }}
                >
                  📋 Copy
                </button>
              </div>
            </div>
          )}
          
          {/* Import Section */}
          <div>
            <h4>📥 Import Character</h4>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Paste a character export string below:
            </p>
            <div className="mobile-button-row" style={{ alignItems: 'flex-start' }}>
              <textarea
                value={importString}
                onChange={(e) => setImportString(e.target.value)}
                placeholder="Paste character export string here..."
                style={{
                  flex: 1,
                  height: '80px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  resize: 'vertical'
                }}
              />
              <button
                onClick={importCharacter}
                disabled={loading || !importString.trim()}
                className="button"
                style={{
                  background: '#28a745',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  opacity: (!importString.trim() || loading) ? 0.6 : 1,
                  minWidth: '80px',
                  width: 'auto'
                }}
              >
                {loading ? '⏳' : '📥'} Import
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Note: Character callsign must be unique. Rename existing characters if there's a conflict.
            </p>
          </div>
        </div>
      )}

      {/* Character Selection Menu */}
      <div className="card character-selection-card">
        <h3>Character Selection ({characters.length} characters)</h3>
        
        {/* Desktop Character List */}
        <div className="character-list-desktop" style={{ marginBottom: '15px' }}>
          {characters.map(char => (
            <button
              key={char.id}
              onClick={() => switchCharacter(char.id)}
              style={{
                padding: '10px 16px',
                borderRadius: '4px',
                border: currentCharacter?.id === char.id ? '2px solid #007bff' : '1px solid #ccc',
                background: currentCharacter?.id === char.id ? '#e3f2fd' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '120px',
                flex: '0 0 auto'
              }}
            >
              {char.callsign} (Rank {char.rank})
            </button>
          ))}
        </div>
        
        {!showNewCharacterForm ? (
          <button 
            className="character-list-desktop button" 
            onClick={() => setShowNewCharacterForm(true)}
            style={{ fontSize: '14px', padding: '8px 16px', width: 'auto' }}
          >
            ➕ New Character
          </button>
        ) : (
          <div className="mobile-button-group">
            <input
              type="text"
              placeholder="Enter callsign..."
              value={newCharacterCallsign}
              onChange={(e) => setNewCharacterCallsign(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createNewCharacter()}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '8px' }}
            />
            <div className="mobile-button-row">
              <button 
                className="button" 
                onClick={createNewCharacter}
                disabled={!newCharacterCallsign.trim() || loading}
              >
                Create
              </button>
              <button 
                className="button"
                onClick={() => setShowNewCharacterForm(false)}
                style={{ background: '#6c757d' }}
              >
                Cancel
              </button>
            </div>
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
          <div className="rank-path-grid" style={{ marginBottom: '20px' }}>
            <div className="rank-path-section">
              <h4>Initiative</h4>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                {(() => {
                  const bonuses = pathUpgradesService.getCharacterBonuses(editingCharacter);
                  return bonuses.initiative;
                })()}
              </p>
              
              <h4>Rank Information</h4>
              <p><strong>Current Rank:</strong> {editingCharacter.rank} - {getRankName(editingCharacter.rank)}</p>
              {editingCharacter.rank < 11 && (
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
              {editingCharacter.rank >= 11 && (
                <p style={{ color: '#28a745', fontWeight: 'bold' }}>🏆 Maximum Rank Achieved!</p>
              )}
            </div>

            {/* Path Information */}
            <div className="rank-path-section">
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
            <div className="responsive-grid responsive-grid-3">
              {/* Banked XP - Editable */}
              <div className="xp-input-container">
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
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                {/* Add Banked XP */}
                <div className="xp-transfer-container" style={{ marginTop: '10px' }}>
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
                      flex: 1
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
                      cursor: 'pointer',
                      minWidth: '50px'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Loadout XP - Readonly with Transfer */}
              <div className="xp-input-container">
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
                    width: '100%',
                    background: '#f8f9fa',
                    color: '#6c757d',
                    boxSizing: 'border-box'
                  }}
                />
                {/* Transfer to Loadout */}
                <div className="xp-transfer-container" style={{ marginTop: '10px' }}>
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
                      flex: 1
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
                      cursor: 'pointer',
                      minWidth: '50px'
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              {/* Path XP - Readonly with Transfer */}
              <div className="xp-input-container">
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Path XP: <small style={{ fontWeight: 'normal', color: '#6c757d' }}>(3 Banked XP → 2 Path XP)</small>
                </label>
                <input
                  type="number"
                  value={editingCharacter.pathXP}
                  readOnly
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    width: '100%',
                    background: '#f8f9fa',
                    color: '#6c757d',
                    boxSizing: 'border-box'
                  }}
                />
                {/* Transfer to Path */}
                <div className="xp-transfer-container" style={{ marginTop: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Banked XP to convert"
                    value={toPathAmount}
                    onChange={(e) => setToPathAmount(e.target.value)}
                    style={{ 
                      padding: '6px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc',
                      flex: 1
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
                      cursor: 'pointer',
                      minWidth: '50px'
                    }}
                  >
                    Apply
                  </button>
                </div>
                {toPathAmount > 0 && (
                  <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
                    Will receive {Math.floor((parseInt(toPathAmount || 0) * 2) / 3)} Path XP
                  </small>
                )}
                {toPathAmount > 0 && parseInt(toPathAmount) % 3 !== 0 && (
                  <small style={{ color: '#dc3545', marginTop: '2px', display: 'block', fontWeight: 'bold' }}>
                    ⚠️ Warning: {parseInt(toPathAmount) % 3} Banked XP will be wasted. Use {Math.floor(parseInt(toPathAmount) / 3) * 3} or {Math.ceil(parseInt(toPathAmount) / 3) * 3} for efficient conversion.
                  </small>
                )}
              </div>
            </div>

            {/* XP Transaction Log */}
            {xpLog.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h5>XP Transaction Log</h5>
                <div className="scrollable-content" style={{ 
                  background: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {xpLog.map((entry, index) => (
                    <div key={index} style={{ 
                      marginBottom: '5px',
                      color: entry.amount > 0 ? '#28a745' : '#dc3545',
                      wordBreak: 'break-word'
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
            <div className="responsive-grid responsive-grid-2">
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
        <div className="mobile-modal">
          <div className="mobile-modal-content">
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
            
            <div className="mobile-button-row" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={cancelPathSelection}
                className="button"
                style={{
                  background: '#6c757d'
                }}
              >
                Cancel
              </button>
              <button
                onClick={selectPath}
                disabled={!selectedPath}
                className="button"
                style={{
                  background: selectedPath ? '#28a745' : '#6c757d',
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