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
    
    if (!this.getCharacters().length) {
      const sampleCharacters = [
        {
          id: 1,
          callsign: "Ghost",
          bankedXP: 15,
          loadoutXP: 8,
          pathXP: 12,
          rank: 3,
          path: "Ace", // Has chosen a path at rank 3
          createdAt: new Date().toISOString(),
          lastSaved: new Date().toISOString()
        },
        {
          id: 2,
          callsign: "Phoenix",
          bankedXP: 25,
          loadoutXP: 15,
          pathXP: 20,
          rank: 4,
          path: "Force User", // Has chosen a path at rank 3+
          createdAt: new Date().toISOString(),
          lastSaved: new Date().toISOString()
        }
      ];
      this.setCharacters(sampleCharacters);
      
      // Set first character as current if none selected
      if (!this.getCurrentCharacterId()) {
        this.setCurrentCharacter(sampleCharacters[0].id);
      }
    }
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
  }

  getCurrentCharacter() {
    const id = this.getCurrentCharacterId();
    return id ? this.getCharacterById(id) : null;
  }

  // Leveling system
  getLevelUpCost(currentRank) {
    if (currentRank >= 8) return null; // Max rank
    const nextRank = currentRank + 1;
    return nextRank * nextRank; // Cost = next rank squared
  }

  canLevelUp(character) {
    if (character.rank >= 8) return false;
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
    const selection = localStorage.getItem(this.shipSelectionKey);
    return selection ? JSON.parse(selection) : null;
  }

  setCurrentShipSelection(shipKey, selectedUpgrades = {}, selectedRankUpgrades = {}) {
    const selectionData = {
      shipKey,
      selectedUpgrades,
      selectedRankUpgrades,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(this.shipSelectionKey, JSON.stringify(selectionData));
    return selectionData;
  }

  clearShipSelection() {
    localStorage.removeItem(this.shipSelectionKey);
    return true;
  }
}

export default new LocalDataService();