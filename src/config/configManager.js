import { WEIGHT_CONFIG as DEFAULT_WEIGHT_CONFIG } from "./weightConfig.js";

class ConfigManager {
  constructor() {
    this.currentConfig = structuredClone(DEFAULT_WEIGHT_CONFIG);
    this.listeners = [];
  }

  getWeightConfig() {
    return this.currentConfig;
  }

  updateWeightConfig(newConfig, validate = true) {
    if (validate) {
      this.validateConfig(newConfig);
    }

    this.currentConfig = {
      ...this.currentConfig,
      ...newConfig,
    };

    this.notifyListeners();
  }

  resetToDefault() {
    this.currentConfig = structuredClone(DEFAULT_WEIGHT_CONFIG);
    this.notifyListeners();
  }

  validateConfig(config) {
    if (config.rankWeights && !Array.isArray(config.rankWeights.values)) {
      throw new Error("Invalid rankWeights configuration: values must be an array");
    }
    if (config.scaleWeights && !Array.isArray(config.scaleWeights.values)) {
      throw new Error("Invalid scaleWeights configuration: values must be an array");
    }
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.getWeightConfig());
      } catch {
        // listener errors are silently caught to avoid cascading failures
      }
    }
  }
}

export const configManager = new ConfigManager();
