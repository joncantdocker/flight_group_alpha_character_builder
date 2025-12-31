import localDataService from './localDataService';

class ApiService {
  constructor() {
    this.service = localDataService;
  }

  async healthCheck() {
    return await this.service.healthCheck();
  }

  // Character management
  async getCharacters() {
    await this.service.simulateDelay();
    return this.service.getCharacters();
  }

  async createCharacter(characterData) {
    await this.service.simulateDelay();
    return this.service.addCharacter(characterData);
  }

  async updateCharacter(id, characterData) {
    await this.service.simulateDelay();
    return this.service.updateCharacter(id, characterData);
  }

  async deleteCharacter(id) {
    await this.service.simulateDelay();
    return this.service.deleteCharacter(id);
  }

  async getCharacterById(id) {
    await this.service.simulateDelay();
    return this.service.getCharacterById(id);
  }

  // Current character management
  getCurrentCharacter() {
    return this.service.getCurrentCharacter();
  }

  getCurrentCharacterId() {
    return this.service.getCurrentCharacterId();
  }

  setCurrentCharacter(id) {
    return this.service.setCurrentCharacter(id);
  }

  // Leveling system
  getLevelUpCost(currentRank) {
    return this.service.getLevelUpCost(currentRank);
  }

  canLevelUp(character) {
    return this.service.canLevelUp(character);
  }

  async levelUpCharacter(id) {
    await this.service.simulateDelay();
    return this.service.levelUpCharacter(id);
  }

  // Save functionality
  async saveAll() {
    await this.service.simulateDelay(100);
    return this.service.saveAll();
  }

  // Ship selection persistence
  getCurrentShipSelection() {
    return this.service.getCurrentShipSelection();
  }

  setCurrentShipSelection(shipKey, selectedUpgrades = {}, selectedRankUpgrades = {}) {
    return this.service.setCurrentShipSelection(shipKey, selectedUpgrades, selectedRankUpgrades);
  }

  clearShipSelection() {
    return this.service.clearShipSelection();
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;