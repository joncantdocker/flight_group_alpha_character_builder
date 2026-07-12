// Local data service using localStorage for character management
class LocalDataService {
  constructor() {
    this.storageKey = 'character_builder_data';
    this.currentCharacterKey = 'current_character_id';
    this.shipSelectionKey = 'current_ship_selection';
    
    // Initialize with sample data if empty
    this.initializeData();
  }

  initializeData() {
    // Migrate existing characters to include path field
    this.migrateCharacterData();
  }

  migrateCharacterData() {
    const characters = this.getCharacters();
    let needsUpdate = false;
    
    const updatedCharacters = characters.map(char => {
      if (!char.hasOwnProperty('path')) {
        needsUpdate = true;
        return {
          ...char,
          path: "None" // Default path for existing characters
        };
      }
      return char;
    });
    
    if (needsUpdate) {
      this.setCharacters(updatedCharacters);
    }
  }

  // Character management
  getCharacters() {
    const characters = localStorage.getItem(this.storageKey);
    return characters ? JSON.parse(characters) : [];
  }

  setCharacters(characters) {
    localStorage.setItem(this.storageKey, JSON.stringify(characters));
  }

  addCharacter(characterData) {
    const characters = this.getCharacters();
    const newId = Math.max(...characters.map(char => char.id), 0) + 1;
    const character = {
      id: newId,
      callsign: characterData.callsign || "New Character",
      bankedXP: characterData.bankedXP || 0,
      loadoutXP: characterData.loadoutXP || 0,
      pathXP: characterData.pathXP || 0,
      rank: characterData.rank || 1,
      path: characterData.path || "None", // Default to None for ranks 1-2
      createdAt: new Date().toISOString(),
      lastSaved: new Date().toISOString()
    };
    characters.push(character);
    this.setCharacters(characters);
    return character;
  }

  updateCharacter(id, updates) {
    const characters = this.getCharacters();
    const index = characters.findIndex(char => char.id === id);
    if (index !== -1) {
      characters[index] = { 
        ...characters[index], 
        ...updates, 
        lastSaved: new Date().toISOString() 
      };
      this.setCharacters(characters);
      return characters[index];
    }
    return null;
  }

  deleteCharacter(id) {
    const characters = this.getCharacters();
    const filteredCharacters = characters.filter(char => char.id !== id);
    this.setCharacters(filteredCharacters);
    
    // If deleted character was current, switch to first available
    if (this.getCurrentCharacterId() === id && filteredCharacters.length > 0) {
      this.setCurrentCharacter(filteredCharacters[0].id);
    }
    return true;
  }

  getCharacterById(id) {
    const characters = this.getCharacters();
    return characters.find(char => char.id === id) || null;
  }

  // Current character selection
  getCurrentCharacterId() {
    const id = localStorage.getItem(this.currentCharacterKey);
    return id ? parseInt(id) : null;
  }

  setCurrentCharacter(id) {
    localStorage.setItem(this.currentCharacterKey, id.toString());
    // Dispatch custom event to notify components of character change
    window.dispatchEvent(new CustomEvent('characterChanged', { 
      detail: { characterId: id } 
    }));
  }

  getCurrentCharacter() {
    const id = this.getCurrentCharacterId();
    return id ? this.getCharacterById(id) : null;
  }

  // Leveling system
  getLevelUpCost(currentRank) {
    if (currentRank >= 11) return null; // Max rank
    const nextRank = currentRank + 1;
    return nextRank * nextRank; // Cost = next rank squared
  }

  canLevelUp(character) {
    if (character.rank >= 11) return false;
    const cost = this.getLevelUpCost(character.rank);
    return character.bankedXP >= cost;
  }

  levelUpCharacter(id) {
    const character = this.getCharacterById(id);
    if (!character || !this.canLevelUp(character)) {
      return { success: false, message: 'Cannot level up' };
    }

    const cost = this.getLevelUpCost(character.rank);
    const updatedCharacter = {
      ...character,
      rank: character.rank + 1,
      bankedXP: character.bankedXP - cost
    };

    this.updateCharacter(id, updatedCharacter);
    return { 
      success: true, 
      character: updatedCharacter,
      message: `Leveled up to rank ${updatedCharacter.rank}! Cost: ${cost} XP`
    };
  }

  // Health check simulation
  async healthCheck() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'Character Builder Local Storage',
          version: '1.0.0',
          charactersCount: this.getCharacters().length
        });
      }, 100);
    });
  }

  // Simulate API delay for realistic feel
  async simulateDelay(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Save all data (manual save button functionality)
  saveAll() {
    // In localStorage, data is automatically saved, but this can be used for feedback
    return {
      success: true,
      message: 'All character data saved successfully!',
      timestamp: new Date().toISOString(),
      charactersCount: this.getCharacters().length
    };
  }

  // Ship selection persistence
  getCurrentShipSelection() {
    const currentCharacterId = this.getCurrentCharacterId();
    if (!currentCharacterId) return null;
    
    const shipSelectionKey = `${this.shipSelectionKey}_${currentCharacterId}`;
    const selection = localStorage.getItem(shipSelectionKey);
    return selection ? JSON.parse(selection) : null;
  }

  setCurrentShipSelection(shipKey, selectedUpgrades = {}, selectedRankUpgrades = {}, customUpgradeSlots = []) {
    const currentCharacterId = this.getCurrentCharacterId();
    if (!currentCharacterId) return null;
    
    const selectionData = {
      shipKey,
      selectedUpgrades,
      selectedRankUpgrades,
      customUpgradeSlots,
      timestamp: new Date().toISOString()
    };
    const shipSelectionKey = `${this.shipSelectionKey}_${currentCharacterId}`;
    localStorage.setItem(shipSelectionKey, JSON.stringify(selectionData));
    return selectionData;
  }

  clearShipSelection() {
    const currentCharacterId = this.getCurrentCharacterId();
    if (!currentCharacterId) return false;
    
    const shipSelectionKey = `${this.shipSelectionKey}_${currentCharacterId}`;
    localStorage.removeItem(shipSelectionKey);
    return true;
  }

  // Copy ship selection from one character to another
  copyShipSelection(sourceCharacterId, targetCharacterId) {
    if (!sourceCharacterId || !targetCharacterId) return false;
    
    const sourceKey = `${this.shipSelectionKey}_${sourceCharacterId}`;
    const targetKey = `${this.shipSelectionKey}_${targetCharacterId}`;
    
    const sourceSelection = localStorage.getItem(sourceKey);
    if (sourceSelection) {
      // Parse and update timestamp for the copy
      const selectionData = JSON.parse(sourceSelection);
      selectionData.timestamp = new Date().toISOString();
      
      localStorage.setItem(targetKey, JSON.stringify(selectionData));
      return true;
    }
    
    return false;
  }

  // Import/Export functionality
  exportCharacter(character) {
    try {
      // Create a clean export object without sensitive data
      const exportData = {
        version: '1.0.0',
        exported: new Date().toISOString(),
        character: {
          callsign: character.callsign,
          bankedXP: character.bankedXP,
          loadoutXP: character.loadoutXP,
          pathXP: character.pathXP,
          rank: character.rank,
          path: character.path,
          createdAt: character.createdAt
        }
      };
      
      // Convert to base64 for easy sharing
      const jsonString = JSON.stringify(exportData);
      const base64String = btoa(jsonString);
      
      return `CBX1_${base64String}`; // CBX1 = Character Builder Export v1
    } catch (error) {
      throw new Error('Failed to export character: ' + error.message);
    }
  }

  importCharacter(characterString) {
    try {
      // Validate format
      if (!characterString || !characterString.startsWith('CBX1_')) {
        throw new Error('Invalid character data format. Please ensure you copied the complete export string.');
      }
      
      // Extract and decode base64
      const base64Data = characterString.substring(5); // Remove 'CBX1_' prefix
      const jsonString = atob(base64Data);
      const importData = JSON.parse(jsonString);
      
      // Validate structure
      if (!importData.character || !importData.version) {
        throw new Error('Invalid character data structure.');
      }
      
      const char = importData.character;
      
      // Validate required fields
      if (!char.callsign || typeof char.rank !== 'number' || 
          typeof char.bankedXP !== 'number' || typeof char.loadoutXP !== 'number' || 
          typeof char.pathXP !== 'number') {
        throw new Error('Missing or invalid required character fields.');
      }
      
      // Validate ranges
      if (char.rank < 1 || char.rank > 11) {
        throw new Error('Invalid rank. Rank must be between 1 and 11.');
      }
      
      if (char.bankedXP < 0 || char.loadoutXP < 0 || char.pathXP < 0) {
        throw new Error('XP values cannot be negative.');
      }
      
      // Check if callsign already exists
      const existing = this.getCharacters().find(c => c.callsign === char.callsign);
      if (existing) {
        throw new Error(`A character with callsign "${char.callsign}" already exists. Please rename the existing character first.`);
      }
      
      // Create new character with imported data
      const newCharacter = this.addCharacter({
        callsign: char.callsign,
        bankedXP: char.bankedXP,
        loadoutXP: char.loadoutXP,
        pathXP: char.pathXP,
        rank: char.rank,
        path: char.path || 'None'
      });
      
      return {
        success: true,
        character: newCharacter,
        message: `Successfully imported character "${char.callsign}"`
      };
    } catch (error) {
      if (error.name === 'SyntaxError') {
        throw new Error('Invalid character data format. The import string appears to be corrupted.');
      }
      throw error;
    }
  }
}

const localDataServiceInstance = new LocalDataService();
export default localDataServiceInstance;