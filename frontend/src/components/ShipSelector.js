import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import shipService from '../services/shipService';
import upgradeService from '../services/upgradeService';
import pathUpgradesService from '../services/pathUpgradesService';
import apiService from '../services/apiService';

// Add CSS for X-Wing fonts in dropdowns
const xwingFontStyle = {
  fontFamily: 'X-Wing-Symbols, Arial, sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal'
};

const xwingRedFontStyle = {
  fontFamily: 'X-Wing-Symbols, Arial, sans-serif',
  color: '#dc3545',
  fontWeight: 'normal',
  fontStyle: 'normal'
};

// Utility function to parse X-Wing special formatting codes
const parseXWingText = (text) => {
  if (!text) return text;
  
  const parts = [];
  let currentIndex = 0;
  let partKey = 0;
  
  // Find all special formatting codes
  const regex = /\[([^\]]+)\]/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }
    
    const code = match[1];
    
    // Handle different formatting codes
    if (code.startsWith('r:')) {
      // Red colored symbol: [r:l] -> red 'l' in x-wing-symbols font
      const symbol = code.substring(2);
      parts.push(
        <span 
          key={`red-${partKey++}`}
          style={{ 
            fontFamily: 'X-Wing-Symbols, Arial, sans-serif', 
            color: '#dc3545' 
          }}
        >
          {symbol}
        </span>
      );
    } else {
      // Regular symbol: [}] or [MM] -> symbol in x-wing-symbols font
      parts.push(
        <span 
          key={`symbol-${partKey++}`}
          style={{ fontFamily: 'X-Wing-Symbols, Arial, sans-serif' }}
        >
          {code}
        </span>
      );
    }
    
    currentIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }
  
  return parts.length > 1 ? parts : text;
};

const ShipSelector = () => {
  const [ships, setShips] = useState([]);
  const [currentShipSelection, setCurrentShipSelection] = useState(null);
  const [editingShipSelection, setEditingShipSelection] = useState(null); // Temp state for unsaved changes
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [characterBonuses, setCharacterBonuses] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadShips = async () => {
      // Wait for ship service to load
      await shipService.waitForLoad();
      const shipList = shipService.getShipList();
      setShips(shipList);
      
      // Now load saved ship selection after ships are loaded
      loadSavedShipSelection();
    };
    
    const loadCurrentCharacter = async () => {
      // Load current character for rank-based upgrades
      const character = apiService.getCurrentCharacter();
      console.log('Loading character in ShipSelector:', character); // Debug log
      setCurrentCharacter(character);
      
      if (character) {
        // Wait for path service to load if needed
        setTimeout(() => {
          const bonuses = pathUpgradesService.getCharacterBonuses(character);
          console.log('Character bonuses:', bonuses); // Debug log
          setCharacterBonuses(bonuses);
        }, 200);
      } else {
        setCharacterBonuses(null);
      }
    };
    
    loadShips();
    loadCurrentCharacter();
  }, []);

  // Handle page refresh/close warnings
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved ship selection changes. Are you sure you want to leave?';
        return 'You have unsaved ship selection changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const loadSavedShipSelection = () => {
    const savedSelection = apiService.getCurrentShipSelection();
    if (savedSelection) {
      const ship = savedSelection.shipKey ? shipService.getShipByKey(savedSelection.shipKey) : null;
      const selectionData = {
        shipKey: savedSelection.shipKey,
        selectedShip: ship ? { key: savedSelection.shipKey, ...ship } : null,
        selectedUpgrades: savedSelection.selectedUpgrades || {},
        selectedRankUpgrades: savedSelection.selectedRankUpgrades || {}
      };
      setCurrentShipSelection(selectionData);
      setEditingShipSelection({ ...selectionData }); // Create copy for editing
      setHasUnsavedChanges(false);
    } else {
      setCurrentShipSelection(null);
      setEditingShipSelection(null);
      setHasUnsavedChanges(false);
    }
  };

  // Add another useEffect to listen for character changes more efficiently
  useEffect(() => {
    const handleStorageChange = () => {
      const character = apiService.getCurrentCharacter();
      setCurrentCharacter(character);
      
      if (character) {
        setTimeout(() => {
          const bonuses = pathUpgradesService.getCharacterBonuses(character);
          setCharacterBonuses(bonuses);
        }, 200);
      } else {
        setCharacterBonuses(null);
      }
    };

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkUnsavedChanges = () => {
    if (hasUnsavedChanges) {
      return window.confirm(
        'You have unsaved ship selection changes that will be lost. Are you sure you want to continue without saving?'
      );
    }
    return true;
  };

  const handleShipSelection = (shipKey) => {
    if (!checkUnsavedChanges()) {
      return;
    }

    if (shipKey) {
      const ship = shipService.getShipByKey(shipKey);
      const newSelection = {
        shipKey,
        selectedShip: ship ? { key: shipKey, ...ship } : null,
        selectedUpgrades: {},
        selectedRankUpgrades: {}
      };
      setEditingShipSelection(newSelection);
      setHasUnsavedChanges(false);
    } else {
      setEditingShipSelection(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleUpgradeSelection = (slotIndex, upgradeName) => {
    if (!editingShipSelection) return;
    
    const newSelectedUpgrades = {
      ...editingShipSelection.selectedUpgrades,
      [slotIndex]: upgradeName
    };
    
    setEditingShipSelection({
      ...editingShipSelection,
      selectedUpgrades: newSelectedUpgrades
    });
    setHasUnsavedChanges(true);
  };

  const handleRankUpgradeSelection = (slotIndex, upgradeName) => {
    if (!editingShipSelection) return;
    
    const newSelectedRankUpgrades = {
      ...editingShipSelection.selectedRankUpgrades,
      [slotIndex]: upgradeName
    };
    
    setEditingShipSelection({
      ...editingShipSelection,
      selectedRankUpgrades: newSelectedRankUpgrades
    });
    setHasUnsavedChanges(true);
  };

  const calculateTotalLoadoutCost = () => {
    if (!editingShipSelection) return 0;
    const shipUpgradeCosts = upgradeService.calculateSplitCosts(editingShipSelection.selectedUpgrades);
    const rankUpgradeCosts = upgradeService.calculateSplitCosts(editingShipSelection.selectedRankUpgrades);
    return shipUpgradeCosts.loadoutCost + rankUpgradeCosts.loadoutCost;
  };

  const calculateTotalPathCost = () => {
    if (!editingShipSelection) return 0;
    const shipUpgradeCosts = upgradeService.calculateSplitCosts(editingShipSelection.selectedUpgrades);
    const rankUpgradeCosts = upgradeService.calculateSplitCosts(editingShipSelection.selectedRankUpgrades);
    return shipUpgradeCosts.pathCost + rankUpgradeCosts.pathCost;
  };

  // Save current ship selection
  const saveShipSelection = async () => {
    if (!editingShipSelection || !hasUnsavedChanges) return;
    
    try {
      apiService.setCurrentShipSelection(
        editingShipSelection.shipKey, 
        editingShipSelection.selectedUpgrades, 
        editingShipSelection.selectedRankUpgrades
      );
      
      setCurrentShipSelection({ ...editingShipSelection });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving ship selection:', err);
    }
  };

  const discardChanges = () => {
    if (currentShipSelection) {
      setEditingShipSelection({ ...currentShipSelection });
      setHasUnsavedChanges(false);
    } else {
      setEditingShipSelection(null);
      setHasUnsavedChanges(false);
    }
  };

  // Get filtered slot index for non-special resources
  const getNonSpecialSlotIndex = (originalSlots, currentSlot) => {
    return originalSlots.filter(slot => !upgradeService.isSpecialResource(slot)).indexOf(currentSlot);
  };

  const renderUpgradeSlots = (upgradeString) => {
    const slots = shipService.formatUpgradeSlots(upgradeString);
    
    return (
      <div>
        {slots.map((slot, index) => {
          const availableUpgrades = upgradeService.getUpgradesForSlotCode(slot);
          const characterInitiative = characterBonuses ? characterBonuses.initiative : 1;
          
          return (
            <div key={index} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'X-Wing-Symbols, Arial, sans-serif',
                    fontSize: '16px',
                    background: '#f8f9fa',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  {slot}
                </span>
                
                <Select
                  value={editingShipSelection?.selectedUpgrades[index] ? 
                    { value: editingShipSelection.selectedUpgrades[index], label: editingShipSelection.selectedUpgrades[index] } : 
                    null
                  }
                  onChange={(selectedOption) => handleUpgradeSelection(index, selectedOption ? selectedOption.value : '')}
                  options={[
                    { value: '', label: '-- No Upgrade --' },
                    ...availableUpgrades.map((upgrade) => {
                      const isInvalid = upgrade.minimum_in && characterInitiative < upgrade.minimum_in;
                      return {
                        value: upgrade.name,
                        label: upgrade.name,
                        upgrade: upgrade,
                        isInvalid: isInvalid
                      };
                    })
                  ]}
                  formatOptionLabel={({ label, upgrade, isInvalid }) => {
                    if (!upgrade) return <span>{label}</span>;
                    
                    // Simple X-Wing symbol replacement
                    const renderRestrictions = (text) => {
                      if (!text) return null;
                      
                      // Handle [r:symbol] format
                      if (text.includes('[r:')) {
                        return text.split(/\[(r:[^\]]+)\]/).map((part, index) => {
                          if (part.startsWith('r:')) {
                            return (
                              <span key={index} style={xwingRedFontStyle}>
                                {part.substring(2)}
                              </span>
                            );
                          } else if (part.match(/\[[^\]]+\]/)) {
                            return (
                              <span key={index} style={xwingFontStyle}>
                                {part.replace(/[\[\]]/g, '')}
                              </span>
                            );
                          }
                          return part;
                        });
                      }
                      
                      // Handle regular [symbol] format
                      return text.split(/(\[[^\]]+\])/).map((part, index) => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                          return (
                            <span key={index} style={xwingFontStyle}>
                              {part.substring(1, part.length - 1)}
                            </span>
                          );
                        }
                        return part;
                      });
                    };
                    
                    return (
                      <div style={{
                        color: isInvalid ? '#6c757d' : 'inherit',
                        fontStyle: isInvalid ? 'italic' : 'normal',
                        fontFamily: 'Arial, sans-serif'
                      }}>
                        <span>{upgrade.name}</span>
                        <span style={{ color: '#6c757d' }}> ({Number(upgrade.cpp_cost)} XP)</span>
                        {upgrade.restrictions && (
                          <span style={{ color: '#6c757d' }}> - {renderRestrictions(upgrade.restrictions)}</span>
                        )}
                        {isInvalid && (
                          <span style={{ color: '#dc3545' }}> [Requires Init {upgrade.minimum_in}]</span>
                        )}
                      </div>
                    );
                  }}
                  styles={{
                    container: (provided) => ({
                      ...provided,
                      flex: 1
                    }),
                    control: (provided) => ({
                      ...provided,
                      minHeight: 'auto',
                      fontSize: '14px'
                    }),
                    option: (provided) => ({
                      ...provided,
                      fontFamily: 'Arial, sans-serif'
                    })
                  }}
                  isClearable
                />
              </div>
              
              {editingShipSelection?.selectedUpgrades[index] && (() => {
                const selectedUpgrade = upgradeService.getUpgradeByName(editingShipSelection.selectedUpgrades[index]);
                if (selectedUpgrade) {
                  const isInvalid = selectedUpgrade.minimum_in && characterInitiative < selectedUpgrade.minimum_in;
                  return (
                    <div style={{
                      marginTop: '5px',
                      padding: '8px',
                      background: isInvalid ? '#f8d7da' : '#f8f9fa',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: isInvalid ? '#721c24' : '#6c757d',
                      border: isInvalid ? '1px solid #f5c6cb' : 'none'
                    }}>                      
                      <div style={{ marginBottom: '5px' }}>
                        <strong>Cost:</strong> {String(Number(selectedUpgrade.cpp_cost))} XP
                      </div>
                      {selectedUpgrade.restrictions && (
                        <div style={{ marginBottom: '5px' }}>
                          <strong>Requirements:</strong> {(() => {
                            const text = selectedUpgrade.restrictions;
                            if (text.includes('[r:')) {
                              return text.split(/\[(r:[^\]]+)\]/).map((part, index) => {
                                if (part.startsWith('r:')) {
                                  return (
                                    <span key={index} style={xwingRedFontStyle}>
                                      {part.substring(2)}
                                    </span>
                                  );
                                } else if (part.match(/\[[^\]]+\]/)) {
                                  return (
                                    <span key={index} style={xwingFontStyle}>
                                      {part.replace(/[\[\]]/g, '')}
                                    </span>
                                  );
                                }
                                return part;
                              });
                            }
                            return text.split(/(\[[^\]]+\])/).map((part, index) => {
                              if (part.startsWith('[') && part.endsWith(']')) {
                                return (
                                  <span key={index} style={xwingFontStyle}>
                                    {part.substring(1, part.length - 1)}
                                  </span>
                                );
                              }
                              return part;
                            });
                          })()} 
                        </div>
                      )}
                      {selectedUpgrade.minimum_in && Number(selectedUpgrade.minimum_in) > 0 ? (
                        <div style={{ marginBottom: '5px' }}>
                          <strong>Min Initiative:</strong> {String(Number(selectedUpgrade.minimum_in))}
                        </div>
                      ) : null}
                      {isInvalid ? (
                        <div style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '5px' }}>
                          INVALID: Requires Initiative {String(Number(selectedUpgrade.minimum_in || 0))}
                        </div>
                      ) : null}
                      <br />
                      <em>{parseXWingText(selectedUpgrade.card_text)}</em>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Ship Selection</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                onClick={discardChanges}
                style={{ 
                  background: '#6c757d', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🚫 Discard
              </button>
              <button 
                onClick={saveShipSelection}
                style={{ 
                  background: '#28a745', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                💾 Save
              </button>
            </>
          )}
          {currentShipSelection && !hasUnsavedChanges && (
            <small style={{ color: '#28a745', fontSize: '12px' }}>
              ✓ Selection saved
            </small>
          )}
        </div>
      </div>
      
      {/* Ship Dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Select Ship:
        </label>
        <select
          value={editingShipSelection?.shipKey || ''}
          onChange={(e) => handleShipSelection(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minWidth: '300px',
            fontSize: '14px'
          }}
        >
          <option value="">-- Select a Ship --</option>
          {ships.map((ship) => (
            <option key={ship.key} value={ship.key}>
              {shipService.getShipDisplayName(ship.key, ship.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Ship Details Display */}
      {editingShipSelection?.selectedShip && (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ 
            margin: '0 0 15px 0', 
            color: '#007bff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              fontFamily: 'X-Wing-Ships, Arial, sans-serif',
              fontSize: '20px'
            }}>
              {editingShipSelection.selectedShip.key}
            </span>
            {editingShipSelection.selectedShip.name}
          </h4>
          
          {/* Loadout XP Cost */}
          <div style={{
            padding: '10px',
            background: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffeaa7',
            marginBottom: '20px'
          }}>
            {/* XP Cost Display */}
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
            marginBottom: '15px'
          }}>
            {/* Loadout XP Cost */}
            <div>
              <h6 style={{ margin: '0 0 5px 0', color: '#856404' }}>Loadout XP Required:</h6>
              <p style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#856404' 
              }}>
                {calculateTotalLoadoutCost()} XP
              </p>
            </div>
            
            {/* Path XP Cost */}
            {calculateTotalPathCost() > 0 && (
              <div>
                <h6 style={{ margin: '0 0 5px 0', color: '#6f42c1' }}>Path XP Required:</h6>
                <p style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#6f42c1' 
                }}>
                  {calculateTotalPathCost()} XP
                </p>
              </div>
            )}
          </div>
            {(editingShipSelection && (Object.keys(editingShipSelection.selectedUpgrades).length > 0 || Object.keys(editingShipSelection.selectedRankUpgrades).length > 0)) && (
              <div style={{ fontSize: '12px', marginTop: '10px' }}>
                <strong>Selected Upgrades:</strong>
                {/* Ship Upgrades */}
                {Object.entries(editingShipSelection.selectedUpgrades)
                  .filter(([, upgradeName]) => upgradeName)
                  .map(([slotIndex, upgradeName], index) => {
                    const upgrade = upgradeService.getUpgradeByName(upgradeName);
                    const isPath = upgradeService.isPathUpgrade(upgrade);
                    return (
                      <div key={`ship-${index}`} style={{ color: '#6c757d' }}>
                        • {upgradeName} ({upgrade?.cpp_cost || 0} XP) - Ship {isPath ? '(Path)' : '(Loadout)'}
                      </div>
                    );
                  })}
                
                {/* Rank Upgrades */}
                {Object.entries(editingShipSelection.selectedRankUpgrades)
                  .filter(([, upgradeName]) => upgradeName)
                  .map(([slotIndex, upgradeName], index) => {
                    const upgrade = upgradeService.getUpgradeByName(upgradeName);
                    const isPath = upgradeService.isPathUpgrade(upgrade);
                    return (
                      <div key={`rank-${index}`} style={{ color: '#6c757d' }}>
                        • {upgradeName} ({upgrade?.cpp_cost || 0} XP) - Rank {isPath ? '(Path)' : '(Loadout)'}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <h5 style={{ margin: '0 0 10px 0' }}>Ship Upgrade Slots:</h5>
              {editingShipSelection?.selectedShip?.upgrades && editingShipSelection.selectedShip.upgrades.length > 0 ? (
                renderUpgradeSlots(editingShipSelection.selectedShip.upgrades.join(''))
              ) : (
                <p style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
                  No ship upgrade slots
                </p>
              )}
            </div>
            
            <div>
              <h5 style={{ margin: '0 0 10px 0' }}>Rank-Based Upgrades:</h5>
              {currentCharacter && characterBonuses ? (
                <div>
                  {characterBonuses.slots && characterBonuses.slots.length > 0 ? (
                    <div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                        From {currentCharacter.callsign} (Rank {currentCharacter.rank}, {currentCharacter.path} Path):
                      </p>
                      
                      {/* Special Resources (Charges and Force) */}
                      {(() => {
                        const resources = upgradeService.countSpecialResources(characterBonuses.slots);
                        if (resources.charges > 0 || resources.force > 0) {
                          return (
                            <div style={{
                              marginBottom: '15px',
                              padding: '10px',
                              background: '#fff3cd',
                              borderRadius: '6px',
                              border: '1px solid #ffeaa7'
                            }}>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {resources.charges > 0 && (
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    background: '#ffc400ff',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    <span style={{
                                      fontFamily: 'X-Wing-Symbols, Arial, sans-serif',
                                      marginRight: '4px'
                                    }}>g</span>
                                    + {resources.charges} Charge{resources.charges > 1 ? 's' : ''}
                                  </div>
                                )}
                                {resources.force > 0 && (
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    background: '#6f42c1',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    <span style={{
                                      fontFamily: 'X-Wing-Symbols, Arial, sans-serif',
                                      marginRight: '4px'
                                    }}>h`</span>
                                    + {resources.force} Force
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Regular Upgrade Slots */}
                      {characterBonuses.slots.filter(slot => !upgradeService.isSpecialResource(slot)).map((slot, index) => {
                        const availableUpgrades = upgradeService.getUpgradesForSlotCode(slot);
                        const characterInitiative = characterBonuses ? characterBonuses.initiative : 1;
                        
                        // Use the filtered index for the select value and onChange
                        const slotIndex = index;
                        
                        return (
                          <div key={index} style={{ 
                            marginBottom: '15px',
                            padding: '8px',
                            background: '#e8f5e8',
                            borderRadius: '4px',
                            border: '1px solid #c3e6cb'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  fontFamily: 'X-Wing-Symbols, Arial, sans-serif',
                                  fontSize: '14px',
                                  background: '#d4edda',
                                  padding: '2px 6px',
                                  borderRadius: '3px'
                                }}
                              >
                                {slot}
                              </span>
                              
                              <Select
                                value={editingShipSelection?.selectedRankUpgrades[slotIndex] ? 
                                  { value: editingShipSelection.selectedRankUpgrades[slotIndex], label: editingShipSelection.selectedRankUpgrades[slotIndex] } : 
                                  null
                                }
                                onChange={(selectedOption) => handleRankUpgradeSelection(slotIndex, selectedOption ? selectedOption.value : '')}
                                options={[
                                  { value: '', label: '-- No Upgrade --' },
                                  ...availableUpgrades.map((upgrade) => {
                                    const isInvalid = upgrade.minimum_in && characterInitiative < upgrade.minimum_in;
                                    return {
                                      value: upgrade.name,
                                      label: upgrade.name,
                                      upgrade: upgrade,
                                      isInvalid: isInvalid
                                    };
                                  })
                                ]}
                                formatOptionLabel={({ label, upgrade, isInvalid }) => {
                                  if (!upgrade) return <span>{label}</span>;
                                  
                                  // Simple X-Wing symbol replacement
                                  const renderRestrictions = (text) => {
                                    if (!text) return null;
                                    
                                    // Handle [r:symbol] format
                                    if (text.includes('[r:')) {
                                      return text.split(/\[(r:[^\]]+)\]/).map((part, index) => {
                                        if (part.startsWith('r:')) {
                                          return (
                                            <span key={index} style={xwingRedFontStyle}>
                                              {part.substring(2)}
                                            </span>
                                          );
                                        } else if (part.match(/\[[^\]]+\]/)) {
                                          return (
                                            <span key={index} style={xwingFontStyle}>
                                              {part.replace(/[\[\]]/g, '')}
                                            </span>
                                          );
                                        }
                                        return part;
                                      });
                                    }
                                    
                                    // Handle regular [symbol] format
                                    return text.split(/(\[[^\]]+\])/).map((part, index) => {
                                      if (part.startsWith('[') && part.endsWith(']')) {
                                        return (
                                          <span key={index} style={xwingFontStyle}>
                                            {part.substring(1, part.length - 1)}
                                          </span>
                                        );
                                      }
                                      return part;
                                    });
                                  };
                                  
                                  return (
                                    <div style={{
                                      color: isInvalid ? '#6c757d' : 'inherit',
                                      fontStyle: isInvalid ? 'italic' : 'normal',
                                      fontFamily: 'Arial, sans-serif'
                                    }}>
                                      <span>{upgrade.name}</span>
                                      <span style={{ color: '#6c757d' }}> ({Number(upgrade.cpp_cost)} XP)</span>
                                      {upgrade.restrictions && (
                                        <span style={{ color: '#6c757d' }}> - {renderRestrictions(upgrade.restrictions)}</span>
                                      )}
                                      {isInvalid && (
                                        <span style={{ color: '#dc3545' }}> [Requires Init {upgrade.minimum_in}]</span>
                                      )}
                                    </div>
                                  );
                                }}
                                styles={{
                                  container: (provided) => ({
                                    ...provided,
                                    flex: 1
                                  }),
                                  control: (provided) => ({
                                    ...provided,
                                    minHeight: 'auto',
                                    fontSize: '12px',
                                    background: 'white',
                                    borderColor: '#28a745'
                                  }),
                                  option: (provided) => ({
                                    ...provided,
                                    fontFamily: 'Arial, sans-serif'
                                  })
                                }}
                                isClearable
                              />
                            </div>
                            
                            {editingShipSelection?.selectedRankUpgrades[slotIndex] && (() => {
                              const selectedUpgrade = upgradeService.getUpgradeByName(editingShipSelection.selectedRankUpgrades[slotIndex]);
                              if (selectedUpgrade) {
                                const isInvalid = selectedUpgrade.minimum_in && characterInitiative < selectedUpgrade.minimum_in;
                                return (
                                  <div style={{
                                    marginTop: '5px',
                                    padding: '6px',
                                    background: isInvalid ? '#f8d7da' : '#d4edda',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: isInvalid ? '#721c24' : '#155724',
                                    border: isInvalid ? '1px solid #f5c6cb' : 'none'
                                  }}>                                    
                                    <div style={{ marginBottom: '5px' }}>
                                      <strong>Cost:</strong> {String(Number(selectedUpgrade.cpp_cost))} XP
                                    </div>
                                    {selectedUpgrade.restrictions && (
                                      <div style={{ marginBottom: '5px' }}>
                                        <strong>Requirements:</strong> {(() => {
                                          const text = selectedUpgrade.restrictions;
                                          if (text.includes('[r:')) {
                                            return text.split(/\[(r:[^\]]+)\]/).map((part, index) => {
                                              if (part.startsWith('r:')) {
                                                return (
                                                  <span key={index} style={xwingRedFontStyle}>
                                                    {part.substring(2)}
                                                  </span>
                                                );
                                              } else if (part.match(/\[[^\]]+\]/)) {
                                                return (
                                                  <span key={index} style={xwingFontStyle}>
                                                    {part.replace(/[\[\]]/g, '')}
                                                  </span>
                                                );
                                              }
                                              return part;
                                            });
                                          }
                                          return text.split(/(\[[^\]]+\])/).map((part, index) => {
                                            if (part.startsWith('[') && part.endsWith(']')) {
                                              return (
                                                <span key={index} style={xwingFontStyle}>
                                                  {part.substring(1, part.length - 1)}
                                                </span>
                                              );
                                            }
                                            return part;
                                          });
                                        })()} 
                                      </div>
                                    )}
                                    {selectedUpgrade.minimum_in && Number(selectedUpgrade.minimum_in) > 0 ? (
                                      <div style={{ marginBottom: '5px' }}>
                                        <strong>Min Initiative:</strong> {String(Number(selectedUpgrade.minimum_in))}
                                      </div>
                                    ) : null}
                                    {isInvalid ? (
                                      <div style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '5px' }}>
                                        INVALID: Requires Initiative {String(Number(selectedUpgrade.minimum_in || 0))}
                                      </div>
                                    ) : null}
                                    <br />
                                    <em>{parseXWingText(selectedUpgrade.card_text)}</em>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
                        No rank-based upgrade slots yet
                      </p>
                      {/* Debug info */}
                      <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '5px' }}>
                        Debug: Character has {characterBonuses.slots ? characterBonuses.slots.length : 'no'} slots
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
                    {!currentCharacter ? 'No character selected' : 'Loading character bonuses...'}
                  </p>
                  {/* Debug info */}
                  <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '5px' }}>
                    Debug: Character={currentCharacter ? currentCharacter.callsign : 'null'}, 
                    Bonuses={characterBonuses ? 'loaded' : 'null'}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h5 style={{ margin: '0 0 10px 0' }}>Ship Information:</h5>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: editingShipSelection.selectedShip.hyperdrive ? '#28a745' : '#dc3545'
                }}></span>
                <span style={{
                  fontWeight: 'bold',
                  color: editingShipSelection.selectedShip.hyperdrive ? '#28a745' : '#dc3545'
                }}>
                  Hyperdrive: {editingShipSelection.selectedShip.hyperdrive ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipSelector;