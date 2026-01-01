// Ship service for managing ship data from ship_list.json
class ShipService {
  constructor() {
    this.shipData = null;
    this.isLoaded = false;
    this.loadShipData();
  }

  async loadShipData() {
    try {
      const response = await fetch('./ship_list.json');
      this.shipData = await response.json();
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load ship data:', error);
      this.shipData = {};
      this.isLoaded = true;
    }
  }

  // Get all ships as an array with their keys
  getShipList() {
    if (!this.shipData) return [];
    
    return Object.entries(this.shipData).map(([key, ship]) => ({
      key,
      ...ship
    }));
  }

  // Get ship data by key
  getShipByKey(key) {
    return this.shipData ? this.shipData[key] : null;
  }

  // Format upgrade slots for display
  formatUpgradeSlots(upgradeString) {
    if (!upgradeString) return [];
    return upgradeString.split('').map(slot => slot.trim()).filter(slot => slot);
  }

  // Get ship display name with key
  getShipDisplayName(key, name) {
    return `${name}`;
  }

  // Check if ship has hyperdrive
  hasHyperdrive(ship) {
    return ship.hyperdrive === true;
  }

  // Wait for ship data to be loaded
  async waitForLoad() {
    while (!this.isLoaded) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

// Create singleton instance
const shipService = new ShipService();
export default shipService;