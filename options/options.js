/**
 * Options Script - Settings page logic
 */

console.log('✅ Options page loaded');

// DOM Elements
const summaryLengthEl = document.getElementById('summaryLength');
const questionCountEl = document.getElementById('questionCount');
const difficultyEl = document.getElementById('difficulty');
const defaultLanguageEl = document.getElementById('defaultLanguage');
const targetLanguageEl = document.getElementById('targetLanguage');
const autoSaveEl = document.getElementById('autoSave');
const shortcutsEl = document.getElementById('shortcuts');
const themeEl = document.getElementById('theme');
const saveSettingsBtn = document.getElementById('saveSettings');
const resetSettingsBtn = document.getElementById('resetSettings');
const dismissWelcomeBtn = document.getElementById('dismissWelcome');
const welcomeBanner = document.getElementById('welcomeBanner');

// Stats elements
const totalSummarizeEl = document.getElementById('totalSummarize');
const totalTranslateEl = document.getElementById('totalTranslate');
const totalQuestionsEl = document.getElementById('totalQuestions');
const totalFlashcardsEl = document.getElementById('totalFlashcards');

// Initialize
async function initialize() {
  console.log('🚀 Initializing options page...');
  
  try {
    // Check if welcome banner should be shown
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'true') {
      welcomeBanner.style.display = 'block';
    }
    
    // Load settings
    await loadSettings();
    
    // Load statistics
    await loadStatistics();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Options page initialized');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    showStatus('Failed to load settings', true);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);
  
  if (dismissWelcomeBtn) {
    dismissWelcomeBtn.addEventListener('click', () => {
      welcomeBanner.style.display = 'none';
      // Remove welcome param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('welcome');
      window.history.replaceState({}, '', url);
    });
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    
    if (response.success) {
      const settings = response.settings;
      
      // AI Settings
      summaryLengthEl.value = settings.summaryLength || 'medium';
      questionCountEl.value = settings.questionCount || 5;
      difficultyEl.value = settings.difficulty || 'medium';
      
      // Language Settings
      defaultLanguageEl.value = settings.defaultLanguage || 'en';
      targetLanguageEl.value = settings.targetLanguage || 'es';
      
      // App Settings
      autoSaveEl.checked = settings.autoSave !== false;
      shortcutsEl.checked = settings.shortcuts !== false;
      themeEl.value = settings.theme || 'light';
      
      console.log('✅ Settings loaded:', settings);
    }
  } catch (error) {
    console.error('❌ Failed to load settings:', error);
    showStatus('Failed to load settings', true);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    const settings = {
      summaryLength: summaryLengthEl.value,
      questionCount: parseInt(questionCountEl.value),
      difficulty: difficultyEl.value,
      defaultLanguage: defaultLanguageEl.value,
      targetLanguage: targetLanguageEl.value,
      autoSave: autoSaveEl.checked,
      shortcuts: shortcutsEl.checked,
      theme: themeEl.value
    };
    
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings
    });
    
    if (response.success) {
      console.log('✅ Settings saved:', settings);
      showStatus('Settings saved successfully!');
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (error) {
    console.error('❌ Failed to save settings:', error);
    showStatus('Failed to save settings', true);
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }
  
  try {
    const defaultSettings = {
      summaryLength: 'medium',
      questionCount: 5,
      difficulty: 'medium',
      defaultLanguage: 'en',
      targetLanguage: 'es',
      autoSave: true,
      shortcuts: true,
      theme: 'light'
    };
    
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: defaultSettings
    });
    
    if (response.success) {
      // Update UI
      summaryLengthEl.value = defaultSettings.summaryLength;
      questionCountEl.value = defaultSettings.questionCount;
      difficultyEl.value = defaultSettings.difficulty;
      defaultLanguageEl.value = defaultSettings.defaultLanguage;
      targetLanguageEl.value = defaultSettings.targetLanguage;
      autoSaveEl.checked = defaultSettings.autoSave;
      shortcutsEl.checked = defaultSettings.shortcuts;
      themeEl.value = defaultSettings.theme;
      
      console.log('✅ Settings reset to defaults');
      showStatus('Settings reset to defaults');
    } else {
      throw new Error('Failed to reset settings');
    }
  } catch (error) {
    console.error('❌ Failed to reset settings:', error);
    showStatus('Failed to reset settings', true);
  }
}

/**
 * Load statistics
 */
async function loadStatistics() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_STATS'
    });
    
    if (response.success) {
      const stats = response.stats;
      
      totalSummarizeEl.textContent = stats.summarize || 0;
      totalTranslateEl.textContent = stats.translate || 0;
      totalQuestionsEl.textContent = stats.questions || 0;
      totalFlashcardsEl.textContent = stats.flashcards || 0;
      
      console.log('✅ Statistics loaded:', stats);
    }
  } catch (error) {
    console.error('❌ Failed to load statistics:', error);
  }
}

/**
 * Show status message
 */
function showStatus(message, isError = false) {
  const statusMessage = document.getElementById('statusMessage');
  statusMessage.textContent = message;
  statusMessage.className = 'status-message' + (isError ? ' error' : '');
  statusMessage.style.display = 'block';
  
  setTimeout(() => {
    statusMessage.style.animation = 'slideOut 0.3s ease-in-out';
    setTimeout(() => {
      statusMessage.style.display = 'none';
      statusMessage.style.animation = '';
    }, 300);
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
