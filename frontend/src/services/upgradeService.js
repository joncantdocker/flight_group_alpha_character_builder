// Upgrade service for managing upgrade data from upgrades.json
class UpgradeService {
  constructor() {
    this.upgradeData = null;
    this.loadUpgradeData();
  }

  async loadUpgradeData() {
    try {
      const response = await fetch('/upgrades.json');
      this.upgradeData = await response.json();
    } catch (error) {
      console.error('Failed to load upgrade data:', error);
      this.upgradeData = {};
    }
  }

  // Get all upgrades flattened into a single array with category info
  getAllUpgrades() {
    if (!this.upgradeData) return [];
    
    const allUpgrades = [];
    Object.entries(this.upgradeData).forEach(([categoryKey, upgrades]) => {
      if (Array.isArray(upgrades)) {
        upgrades.forEach(upgrade => {
          allUpgrades.push({
            ...upgrade,
            categoryKey
          });
        });
      }
    });
    
    return allUpgrades;
  }

  // Get upgrades by category
  getUpgradesByCategory(categoryKey) {
    return this.upgradeData ? this.upgradeData[categoryKey] || [] : [];
  }

  // Get upgrades filtered by upgrade slot code
  getUpgradesForSlotCode(slotCode) {
    const allUpgrades = this.getAllUpgrades();
    
    // Map slot codes to upgrade categories
    const slotToCategory = {
      'E': 'elite_talents',
      'M': 'Missile Upgrades',
      'P': 'Torpedo Upgrades',
      'S': 'Sensor Upgrades',
      'C': 'Cannon Upgrades',
      'B': 'Payload Upgrades',
      'W': 'Crew Upgrades',
      'Y': 'Gunner Upgrades',
      'F': 'Force Talents',
      'X': 'Tech Upgrades',
      'I': 'Illicit Upgrades',
      'n': 'Configuration Upgrades',
      'V': 'Command Talents',
      'A': 'Astromech Upgrades',
      'U': 'Turret Upgrades',
      'm': 'Modification Upgrades',
      'x': 'Rebel Pilot Abilities',
      'y': 'imperial_pilot_abilities'
    };

    // Handle compound slots like "E/y" or "m/S"
    if (slotCode.includes('/')) {
      const codes = slotCode.split('/');
      const upgrades = [];
      codes.forEach(code => {
        const category = slotToCategory[code];
        if (category) {
          upgrades.push(...this.getUpgradesByCategory(category));
        }
      });
      return upgrades;
    }

    const category = slotToCategory[slotCode];
    return category ? this.getUpgradesByCategory(category) : [];
  }

  // Get upgrade by name
  getUpgradeByName(name) {
    const allUpgrades = this.getAllUpgrades();
    return allUpgrades.find(upgrade => upgrade.name === name);
  }

  // Get formatted slot name for display
  getSlotDisplayName(slotCode) {
    const slotNames = {
      'E': 'Elite Talents',
      'M': 'Missile Upgrades',
      'P': 'Torpedo Upgrades',
      'S': 'Sensor Upgrades',
      'C': 'Cannon Upgrades',
      'B': 'Payload Upgrades',
      'W': 'Crew Upgrades',
      'Y': 'Gunner Upgrades',
      'F': 'Force Talents',
      'X': 'Tech Upgrades',
      'I': 'Illicit Upgrades',
      'n': 'Configuration Upgrades',
      'V': 'Command Talents',
      'A': 'Astromech Upgrades',
      'U': 'Turret Upgrades',
      'm': 'Modification Upgrades',
      'x': 'Rebel Pilot Abilities',
      'y': 'Imperial Pilot Abilities'
    };

    // Handle compound slots
    if (slotCode.includes('/')) {
      const codes = slotCode.split('/');
      return codes.map(code => slotNames[code] || code).join(' / ');
    }

    return slotNames[slotCode] || slotCode;
  }

  // Calculate total cost for selected upgrades
  calculateTotalCost(selectedUpgrades) {
    let total = 0;
    Object.values(selectedUpgrades).forEach(upgradeName => {
      if (upgradeName) {
        const upgrade = this.getUpgradeByName(upgradeName);
        if (upgrade && upgrade.cpp_cost) {
          total += upgrade.cpp_cost;
        }
      }
    });
    return total;
  }

  // Check if upgrade meets minimum initiative requirement
  canSelectUpgrade(upgrade, characterInitiative) {
    if (!upgrade.minimum_in) return true;
    return characterInitiative >= upgrade.minimum_in;
  }

  // Check if a slot code represents a compound slot (like BB, MM, etc.)
  isCompoundSlot(slotCode) {
    return slotCode && slotCode.length > 1 && slotCode.split('').every(char => char === slotCode[0]);
  }

  // Get the base slot type for compound slots (BB -> B, MM -> M)
  getBaseSlotType(slotCode) {
    if (this.isCompoundSlot(slotCode)) {
      return slotCode[0];
    }
    return slotCode;
  }

  // Get the number of slots required for a compound slot
  getSlotCount(slotCode) {
    if (this.isCompoundSlot(slotCode)) {
      return slotCode.length;
    }
    return 1;
  }

  // Check if ship has enough available slots for a compound upgrade
  canSelectCompoundUpgrade(shipSlots, selectedUpgrades, slotIndex, upgradeName) {
    const upgrade = this.getUpgradeByName(upgradeName);
    if (!upgrade || !upgrade.code) return true;
    
    const slotCode = upgrade.code;
    if (!this.isCompoundSlot(slotCode)) return true;
    
    const baseSlotType = this.getBaseSlotType(slotCode);
    const requiredCount = this.getSlotCount(slotCode);
    
    // Count available slots of the base type
    let availableCount = 0;
    shipSlots.forEach((slot, index) => {
      if (slot === baseSlotType && (!selectedUpgrades[index] || index === slotIndex)) {
        availableCount++;
      }
    });
    
    return availableCount >= requiredCount;
  }

  // Get slots that should be blocked when a compound upgrade is selected
  getBlockedSlots(shipSlots, slotIndex, upgradeName) {
    const upgrade = this.getUpgradeByName(upgradeName);
    if (!upgrade || !upgrade.code || !this.isCompoundSlot(upgrade.code)) {
      return [];
    }
    
    const baseSlotType = this.getBaseSlotType(upgrade.code);
    const requiredCount = this.getSlotCount(upgrade.code);
    const blockedSlots = [];
    
    let foundCount = 0;
    for (let i = 0; i < shipSlots.length && foundCount < requiredCount; i++) {
      if (shipSlots[i] === baseSlotType) {
        blockedSlots.push(i);
        foundCount++;
      }
    }
    
    return blockedSlots;
  }

  // Check if a slot is blocked by a compound upgrade
  isSlotBlocked(shipSlots, selectedUpgrades, slotIndex) {
    // Check if any other selected upgrade blocks this slot
    for (let i = 0; i < shipSlots.length; i++) {
      if (i !== slotIndex && selectedUpgrades[i]) {
        const blockedSlots = this.getBlockedSlots(shipSlots, i, selectedUpgrades[i]);
        if (blockedSlots.includes(slotIndex)) {
          return true;
        }
      }
    }
    return false;
  }

  // Check if a slot code represents a special resource (charges/force)
  isSpecialResource(slotCode) {
    return slotCode === 'g' || slotCode === 'h`';
  }

  // Get display name for special resources
  getSpecialResourceName(slotCode) {
    const resourceNames = {
      'g': 'Charge',
      'h`': 'Force'
    };
    return resourceNames[slotCode] || slotCode;
  }

  // Count special resources from an array of slot codes
  countSpecialResources(slots) {
    const resources = { charges: 0, force: 0 };
    slots.forEach(slot => {
      if (slot === 'g') resources.charges++;
      if (slot === 'h`') resources.force++;
    });
    return resources;
  }

  // Check if an upgrade is a "path upgrade" (taken from path XP)
  isPathUpgrade(upgrade) {
    if (!upgrade || !upgrade.category) return false;
    const pathUpgradeCategories = [
      'Elite Talent',
      'Imperial Pilot Ability', 
      'Rebel Pilot Ability',
      'Force Talent',
      'Command Talent'
    ];
    return pathUpgradeCategories.includes(upgrade.category);
  }

  // Calculate total cost split between path and loadout XP
  calculateSplitCosts(selectedUpgrades) {
    let pathCost = 0;
    let loadoutCost = 0;
    
    Object.values(selectedUpgrades).forEach(upgradeName => {
      if (upgradeName) {
        const upgrade = this.getUpgradeByName(upgradeName);
        if (upgrade && upgrade.cpp_cost) {
          if (this.isPathUpgrade(upgrade)) {
            pathCost += upgrade.cpp_cost;
          } else {
            loadoutCost += upgrade.cpp_cost;
          }
        }
      }
    });
    
    return { pathCost, loadoutCost };
  }

  // Calculate total path XP cost only
  calculatePathCost(selectedUpgrades) {
    return this.calculateSplitCosts(selectedUpgrades).pathCost;
  }

  // Calculate total loadout XP cost only  
  calculateLoadoutCost(selectedUpgrades) {
    return this.calculateSplitCosts(selectedUpgrades).loadoutCost;
  }
}

// Create singleton instance
const upgradeService = new UpgradeService();
export default upgradeService;