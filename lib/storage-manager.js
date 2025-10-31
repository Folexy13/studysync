/**
 * Storage Manager - Chrome Storage API wrapper
 * Handles all extension storage operations with error handling
 */

class StorageManager {
  constructor() {
    this.storage = chrome.storage.local;
    this.syncStorage = chrome.storage.sync;
  }

  /**
   * Get data from storage
   */
  async get(keys) {
    try {
      const result = await this.storage.get(keys);
      return result;
    } catch (error) {
      console.error('❌ Storage get error:', error);
      throw error;
    }
  }

  /**
   * Set data in storage
   */
  async set(data) {
    try {
      await this.storage.set(data);
      return true;
    } catch (error) {
      console.error('❌ Storage set error:', error);
      throw error;
    }
  }

  /**
   * Remove data from storage
   */
  async remove(keys) {
    try {
      await this.storage.remove(keys);
      return true;
    } catch (error) {
      console.error('❌ Storage remove error:', error);
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  async clear() {
    try {
      await this.storage.clear();
      return true;
    } catch (error) {
      console.error('❌ Storage clear error:', error);
      throw error;
    }
  }

  /**
   * Get user settings
   */
  async getSettings() {
    const defaults = {
      defaultLanguage: 'en',
      targetLanguage: 'es',
      summaryLength: 'medium',
      questionCount: 5,
      difficulty: 'medium',
      theme: 'light',
      autoSave: true,
      shortcuts: true
    };

    try {
      const result = await this.get('settings');
      return { ...defaults, ...result.settings };
    } catch (error) {
      console.error('❌ Failed to get settings:', error);
      return defaults;
    }
  }

  /**
   * Save user settings
   */
  async saveSettings(settings) {
    try {
      await this.set({ settings });
      return true;
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Save study material
   */
  async saveStudyMaterial(material) {
    try {
      const { studyMaterials = [] } = await this.get('studyMaterials');
      
      const newMaterial = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...material
      };

      studyMaterials.unshift(newMaterial);
      
      // Keep only last 100 items
      if (studyMaterials.length > 100) {
        studyMaterials.pop();
      }

      await this.set({ studyMaterials });
      return newMaterial;
    } catch (error) {
      console.error('❌ Failed to save study material:', error);
      throw error;
    }
  }

  /**
   * Get all study materials
   */
  async getStudyMaterials(limit = 50) {
    try {
      const { studyMaterials = [] } = await this.get('studyMaterials');
      return studyMaterials.slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get study materials:', error);
      return [];
    }
  }

  /**
   * Delete study material
   */
  async deleteStudyMaterial(id) {
    try {
      const { studyMaterials = [] } = await this.get('studyMaterials');
      const filtered = studyMaterials.filter(item => item.id !== id);
      await this.set({ studyMaterials: filtered });
      return true;
    } catch (error) {
      console.error('❌ Failed to delete study material:', error);
      throw error;
    }
  }

  /**
   * Update statistics
   */
  async updateStats(action) {
    try {
      const { stats = {} } = await this.get('stats');
      
      if (!stats[action]) {
        stats[action] = 0;
      }
      
      stats[action]++;
      stats.lastUsed = new Date().toISOString();
      
      await this.set({ stats });
      return stats;
    } catch (error) {
      console.error('❌ Failed to update stats:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const { stats = {} } = await this.get('stats');
      return stats;
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      return {};
    }
  }

  /**
   * Save to sync storage (cross-device)
   */
  async syncSet(data) {
    try {
      await this.syncStorage.set(data);
      return true;
    } catch (error) {
      console.error('❌ Sync storage set error:', error);
      throw error;
    }
  }

  /**
   * Get from sync storage
   */
  async syncGet(keys) {
    try {
      const result = await this.syncStorage.get(keys);
      return result;
    } catch (error) {
      console.error('❌ Sync storage get error:', error);
      throw error;
    }
  }
}

// Export singleton instance
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
