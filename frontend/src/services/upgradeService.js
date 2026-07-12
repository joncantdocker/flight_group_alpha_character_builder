// Upgrade service for managing upgrade data from upgrades.json
class UpgradeService {
  constructor() {
    this.upgradeData = null;
    this.upgradeIndexes = null;
    this.loadUpgradeData();
  }

  async loadUpgradeData() {
    try {
      const response = await fetch('./upgrades.json');
      this.upgradeData = await response.json();
      this.upgradeIndexes = null;
    } catch (error) {
      console.error('Failed to load upgrade data:', error);
      this.upgradeData = {};
      this.upgradeIndexes = null;
    }
  }

  getUpgradeIndexes() {
    if (!this.upgradeData) {
      return {
        allUpgrades: [],
        nameCounts: new Map(),
        byId: new Map(),
        byName: new Map(),
        bySelectionValue: new Map()
      };
    }

    if (this.upgradeIndexes) {
      return this.upgradeIndexes;
    }

    const allUpgrades = [];
    const nameCounts = new Map();
    const byId = new Map();
    const byName = new Map();

    Object.entries(this.upgradeData).forEach(([categoryKey, upgrades]) => {
      if (Array.isArray(upgrades)) {
        upgrades.forEach((upgrade, index) => {
          const normalizedUpgrade = {
            ...upgrade,
            categoryKey,
            upgradeId: this.createUpgradeId(categoryKey, upgrade, index)
          };

          allUpgrades.push(normalizedUpgrade);
          byId.set(normalizedUpgrade.upgradeId, normalizedUpgrade);
          if (!byName.has(normalizedUpgrade.name)) {
            byName.set(normalizedUpgrade.name, normalizedUpgrade);
          }
          nameCounts.set(
            normalizedUpgrade.name,
            (nameCounts.get(normalizedUpgrade.name) || 0) + 1
          );
        });
      }
    });

    const bySelectionValue = new Map();
    allUpgrades.forEach((upgrade) => {
      const selectionValue = nameCounts.get(upgrade.name) > 1
        ? upgrade.upgradeId
        : upgrade.name;
      bySelectionValue.set(selectionValue, upgrade);
    });

    this.upgradeIndexes = {
      allUpgrades,
      nameCounts,
      byId,
      byName,
      bySelectionValue
    };

    return this.upgradeIndexes;
  }

  // Get all upgrades flattened into a single array with category info
  getAllUpgrades() {
    return this.getUpgradeIndexes().allUpgrades;
  }

  createUpgradeId(categoryKey, upgrade, index) {
    return `${categoryKey}::${index}::${upgrade.code || ''}::${upgrade.name || ''}`;
  }

  // Get upgrades by category
  getUpgradesByCategory(categoryKey) {
    if (!this.upgradeData) return [];
    const upgrades = this.upgradeData[categoryKey] || [];
    return upgrades.map((upgrade, index) => ({
      ...upgrade,
      categoryKey,
      upgradeId: this.createUpgradeId(categoryKey, upgrade, index)
    }));
  }

  hasDuplicateUpgradeName(name) {
    if (!name) return false;
    const { nameCounts } = this.getUpgradeIndexes();
    return (nameCounts.get(name) || 0) > 1;
  }

  // Use unique IDs only when a name is duplicated to preserve old selections for unique upgrades.
  getUpgradeSelectionValue(upgrade) {
    if (!upgrade) return '';
    if (this.hasDuplicateUpgradeName(upgrade.name)) {
      return upgrade.upgradeId;
    }
    return upgrade.name;
  }

  // Get upgrades filtered by upgrade slot code
  getUpgradesForSlotCode(slotCode) {
    
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
    const { byId, bySelectionValue, byName } = this.getUpgradeIndexes();

    // Prefer exact unique IDs when present.
    if (byId.has(name)) return byId.get(name);

    // Support stored selection values used by the dropdown.
    if (bySelectionValue.has(name)) return bySelectionValue.get(name);

    // Backward compatibility for older saved data that stores plain names.
    return byName.get(name);
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
    if (!upgrade || !upgrade.categoryKey) return false;
    const pathUpgradeCategories = [
      'elite_talents',
      'imperial_pilot_abilities', 
      'Rebel Pilot Abilities',
      'Force Talents',
      'Command Talents'
    ];
    return pathUpgradeCategories.includes(upgrade.categoryKey);
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