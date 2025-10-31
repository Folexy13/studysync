/**
 * Popup Script - Main popup logic
 */

console.log('✅ Popup loaded');

// State
let selectedText = '';
let currentTab = null;
let aiStatus = null;

// DOM Elements
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const statusDot = document.querySelector('.status-dot');
const selectionPreview = document.getElementById('selectionPreview');
const selectionText = document.getElementById('selectionText');
const customInput = document.getElementById('customInput');
const processBtn = document.getElementById('processBtn');
const openPanelBtn = document.getElementById('openPanel');
const clearSelectionBtn = document.getElementById('clearSelection');
const settingsBtn = document.getElementById('settingsBtn');
const actionButtons = document.querySelectorAll('.action-btn');
const totalActionsEl = document.getElementById('totalActions');
const savedMaterialsEl = document.getElementById('savedMaterials');
const helpLink = document.getElementById('helpLink');
const feedbackLink = document.getElementById('feedbackLink');

// Initialize popup
async function initialize() {
  console.log('🚀 Initializing popup...');
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    // Check AI status
    await checkAIStatus();
    
    // Get selected text from page
    await getSelectedText();
    
    // Load stats
    await loadStats();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Popup initialized');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    showError('Failed to initialize. Please refresh the page.');
  }
}

/**
 * Check AI capabilities
 */
async function checkAIStatus() {
  try {
    statusText.textContent = 'Checking AI availability...';
    
    const response = await chrome.runtime.sendMessage({
      type: 'INITIALIZE_AI'
    });
    
    if (response.success) {
      aiStatus = response.capabilities;
      
      // Check if any APIs are available
      const hasAnyAPI = Object.values(aiStatus).some(cap => 
        cap && (cap.available === 'readily' || cap.available)
      );
      
      if (hasAnyAPI) {
        statusText.textContent = 'AI Ready';
        statusDot.classList.add('ready');
      } else {
        statusText.textContent = 'AI Not Available';
        statusDot.classList.add('error');
        showWarning('Chrome Built-in AI is not available. Please enable it in chrome://flags');
      }
    } else {
      throw new Error('Failed to check AI status');
    }
  } catch (error) {
    console.error('❌ AI status check failed:', error);
    statusText.textContent = 'AI Check Failed';
    statusDot.classList.add('error');
    showError('Failed to check AI status. Please try again.');
  }
}

/**
 * Get selected text from current page
 */
async function getSelectedText() {
  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'GET_SELECTION'
    });
    
    if (response && response.text) {
      selectedText = response.text;
      showSelectionPreview(selectedText);
    }
  } catch (error) {
    console.warn('⚠️ Could not get selected text:', error);
  }
}

/**
 * Show selection preview
 */
function showSelectionPreview(text) {
  if (text && text.length > 0) {
    selectionText.textContent = text.length > 200 
      ? text.substring(0, 200) + '...' 
      : text;
    selectionPreview.style.display = 'block';
  } else {
    selectionPreview.style.display = 'none';
  }
}

/**
 * Load statistics
 */
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_STATS'
    });
    
    if (response.success) {
      const stats = response.stats;
      const totalActions = Object.values(stats)
        .filter(val => typeof val === 'number')
        .reduce((sum, val) => sum + val, 0);
      
      totalActionsEl.textContent = totalActions;
      
      // Get materials count
      const materialsResponse = await chrome.runtime.sendMessage({
        type: 'GET_MATERIALS',
        limit: 1
      });
      
      if (materialsResponse.success) {
        savedMaterialsEl.textContent = materialsResponse.materials.length;
      }
    }
  } catch (error) {
    console.error('❌ Failed to load stats:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Action buttons
  actionButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      await handleAction(action);
    });
  });
  
  // Process button
  processBtn.addEventListener('click', async () => {
    const text = customInput.value.trim();
    if (text) {
      await processCustomText(text);
    } else {
      showWarning('Please enter some text to process');
    }
  });
  
  // Open panel button
  openPanelBtn.addEventListener('click', async () => {
    await chrome.sidePanel.open({ windowId: currentTab.windowId });
    window.close();
  });
  
  // Clear selection
  clearSelectionBtn.addEventListener('click', () => {
    selectedText = '';
    customInput.value = '';
    selectionPreview.style.display = 'none';
  });
  
  // Settings button
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
  
  // Help link
  helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/studysync-ai/help'
    });
  });
  
  // Feedback link
  feedbackLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/studysync-ai/feedback'
    });
  });
}

/**
 * Handle action button clicks
 */
async function handleAction(action) {
  try {
    const text = selectedText || customInput.value.trim();
    
    if (!text) {
      showWarning('Please select text on the page or enter text in the input field');
      return;
    }
    
    // Show loading state
    setLoading(true);
    
    // Get settings
    const settingsResponse = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    const settings = settingsResponse.settings;
    
    let response;
    
    switch (action) {
      case 'summarize':
        response = await chrome.runtime.sendMessage({
          type: 'SUMMARIZE',
          text,
          options: { length: settings.summaryLength }
        });
        break;
      
      case 'translate':
        response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE',
          text,
          targetLanguage: settings.targetLanguage,
          sourceLanguage: settings.defaultLanguage
        });
        break;
      
      case 'questions':
        response = await chrome.runtime.sendMessage({
          type: 'GENERATE_QUESTIONS',
          text,
          count: settings.questionCount,
          difficulty: settings.difficulty
        });
        break;
      
      case 'flashcards':
        response = await chrome.runtime.sendMessage({
          type: 'GENERATE_FLASHCARDS',
          text,
          count: 10
        });
        break;
      
      case 'proofread':
        response = await chrome.runtime.sendMessage({
          type: 'PROOFREAD',
          text
        });
        break;
      
      case 'explain':
        response = await chrome.runtime.sendMessage({
          type: 'EXPLAIN',
          text
        });
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    setLoading(false);
    
    if (response.success) {
      // Open side panel with result
      await chrome.sidePanel.open({ windowId: currentTab.windowId });
      
      // Send result to side panel
      await chrome.runtime.sendMessage({
        type: 'SHOW_RESULT',
        action: action.charAt(0).toUpperCase() + action.slice(1),
        result: response.result,
        original: text
      });
      
      // Reload stats
      await loadStats();
      
      window.close();
    } else {
      throw new Error(response.error || 'Action failed');
    }
  } catch (error) {
    setLoading(false);
    console.error('❌ Action error:', error);
    showError(`Failed to ${action}: ${error.message}`);
  }
}

/**
 * Process custom text input
 */
async function processCustomText(text) {
  selectedText = text;
  showSelectionPreview(text);
  showInfo('Text loaded! Now select an action above.');
}

/**
 * Set loading state
 */
function setLoading(loading) {
  if (loading) {
    document.body.classList.add('loading');
    processBtn.disabled = true;
    actionButtons.forEach(btn => btn.disabled = true);
  } else {
    document.body.classList.remove('loading');
    processBtn.disabled = false;
    actionButtons.forEach(btn => btn.disabled = false);
  }
}

/**
 * Show notifications
 */
function showError(message) {
  statusText.textContent = message;
  statusDot.classList.remove('ready');
  statusDot.classList.add('error');
  setTimeout(() => checkAIStatus(), 3000);
}

function showWarning(message) {
  statusText.textContent = message;
  statusDot.classList.remove('ready', 'error');
  setTimeout(() => checkAIStatus(), 3000);
}

function showInfo(message) {
  statusText.textContent = message;
  statusDot.classList.add('ready');
  setTimeout(() => checkAIStatus(), 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
