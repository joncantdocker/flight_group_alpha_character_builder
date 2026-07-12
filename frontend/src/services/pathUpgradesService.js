// Path upgrades service for managing character paths and bonuses
class PathUpgradesService {
  constructor() {
    this.pathData = null;
    this.loadPathData();
  }

  async loadPathData() {
    try {
      const response = await fetch('./path_upgrades.json');
      this.pathData = await response.json();
    } catch (error) {
      console.error('Failed to load path upgrades data:', error);
      this.pathData = {};
    }
  }

  // Get all available paths (excluding "None")
  getAvailablePaths() {
    if (!this.pathData) return [];
    return Object.keys(this.pathData).filter(path => path !== "None");
  }

  // Get path data for a specific path
  getPathData(pathName) {
    return this.pathData ? this.pathData[pathName] : null;
  }

  // Get cumulative bonuses for a character up to their current rank
  getCharacterBonuses(character) {
    const pathName = character.path || "None";
    const pathData = this.getPathData(pathName);
    
    if (!pathData) {
      return {
        slots: [],
        actions: [],
        actionsWithRank: [], // Track actions with their source rank
        initiative: 1
      };
    }

    const bonuses = {
      slots: [],
      actions: [],
      actionsWithRank: [], // Track actions with their source rank
      initiative: 1
    };

    // Accumulate bonuses from rank 1 to current rank
    for (let rank = 1; rank <= character.rank; rank++) {
      const levelData = pathData[rank.toString()];
      if (levelData) {
        // Add slots and preserve duplicates (some pilots gain multiple of the same slot)
        if (levelData.slots) {
          levelData.slots.forEach(slot => {
            bonuses.slots.push(slot);
          });
        }
        
        // Add actions with rank tracking (include duplicates as they represent multiple instances)
        if (levelData.actions) {
          levelData.actions.forEach(action => {
            bonuses.actionsWithRank.push({ action, rank });
            bonuses.actions.push(action);
          });
        }
        
        // Take the highest initiative value
        if (levelData.initiative > bonuses.initiative) {
          bonuses.initiative = levelData.initiative;
        }
      }
    }

    return bonuses;
  }

  // Get bonuses for a specific rank on a path
  getRankBonuses(pathName, rank) {
    const pathData = this.getPathData(pathName);
    if (!pathData) return null;
    
    return pathData[rank.toString()] || null;
  }

  // Check if a character can select a path (rank 2+)
  canSelectPath(character) {
    return character.rank >= 2;
  }

  // Check if a character needs to select a path (rank 3+ with no path or "None")
  needsPathSelection(character) {
    return character.rank >= 3 && (!character.path || character.path === "None");
  }

  // Check if a character should select a path (rank 2 without path, to prepare for rank 3)
  shouldSelectPath(character) {
    return character.rank >= 2 && (!character.path || character.path === "None");
  }

  // Get formatted display text for bonuses
  formatBonuses(bonuses) {
    const parts = [];
    
    if (bonuses.slots && bonuses.slots.length > 0) {
      parts.push(`Slots: ${bonuses.slots.join(', ')}`);
    }
    
    if (bonuses.actions && bonuses.actions.length > 0) {
      parts.push(`Actions: ${bonuses.actions.join(', ')}`);
    }
    
    parts.push(`Initiative: ${bonuses.initiative}`);
    
    return parts.join(' | ');
  }

  // Get React elements for displaying bonuses with X-Wing symbols
  getBonusElements(bonuses) {
    const elements = [];
    
    if (bonuses.slots) {
      elements.push({
        type: 'slots',
        label: 'Upgrade Slots:',
        items: bonuses.slots.map(slot => ({ text: slot, isRed: false }))
      });
    }
    
    if (bonuses.actionsWithRank) {
      elements.push({
        type: 'actions',
        label: 'Actions:',
        items: bonuses.actionsWithRank.map(actionData => ({
          text: actionData.action,
          isRed: actionData.rank === 4 // Red for rank 4 actions
        }))
      });
    }
    
    elements.push({
      type: 'initiative',
      label: 'Initiative:',
      value: bonuses.initiative
    });
    
    return elements;
  }

  // Enhanced method to get bonuses with symbol rendering capability
  getCharacterBonusesWithSymbols(character) {
    const bonuses = this.getCharacterBonuses(character);
    bonuses.getBonusElements = () => this.getBonusElements(bonuses);
    return bonuses;
  }

  // Get bonuses for a single rank formatted for display
  getRankBonusesWithSymbols(pathName, rank) {
    const rankData = this.getRankBonuses(pathName, rank);
    if (!rankData) return null;

    // Convert single rank data to bonuses format
    const bonuses = {
      slots: rankData.slots || [],
      actions: rankData.actions || [],
      actionsWithRank: (rankData.actions || []).map(action => ({ action, rank })),
      initiative: rankData.initiative || 1
    };

    bonuses.getBonusElements = () => this.getBonusElements(bonuses);
    return bonuses;
  }

  // Get path description for display
  getPathDescription(pathName) {
    const descriptions = {
      "None": "No specialized path. Basic progression for ranks 1-2.",
      "Ace": "Elite pilot focused on advanced maneuvers and combat expertise.",
      "Force User": "Force-sensitive pilot with mystical abilities and enhanced perception.",
      "Coordinate": "Team-focused pilot specializing in battlefield coordination and support.",
      "Tech": "Technical specialist with advanced systems knowledge and electronic warfare capabilities."
    };
    
    return descriptions[pathName] || "Unknown path";
  }
}

// Create singleton instance
const pathUpgradesService = new PathUpgradesService();
export default pathUpgradesService;