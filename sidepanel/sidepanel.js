/**
 * Side Panel Script - Study panel logic
 */

console.log('✅ Side panel loaded');

// State
let currentResult = null;
let savedMaterials = [];

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const refreshBtn = document.getElementById('refreshBtn');

// Result Tab Elements
const emptyState = document.getElementById('emptyState');
const resultContent = document.getElementById('resultContent');
const resultAction = document.getElementById('resultAction');
const resultTime = document.getElementById('resultTime');
const resultText = document.getElementById('resultText');
const originalText = document.getElementById('originalText');
const toggleOriginalBtn = document.getElementById('toggleOriginal');
const copyResultBtn = document.getElementById('copyResult');
const saveResultBtn = document.getElementById('saveResult');
const exportResultBtn = document.getElementById('exportResult');

// Saved Tab Elements
const savedEmpty = document.getElementById('savedEmpty');
const savedList = document.getElementById('savedList');

// Input Tab Elements
const customTextInput = document.getElementById('customTextInput');
const actionSelect = document.getElementById('actionSelect');
const processInputBtn = document.getElementById('processInput');

// Loading
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize
async function initialize() {
  console.log('🚀 Initializing side panel...');
  
  try {
    // Check for selected text from content script
    await checkForSelectedText();
    
    // Check for last result from session storage
    await checkForLastResult();
    
    // Load saved materials
    await loadSavedMaterials();
    
    // Setup event listeners
    setupEventListeners();
    
    // Listen for results from background
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Also check for text every time panel becomes visible
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        await checkForSelectedText();
      }
    });
    
    console.log('✅ Side panel initialized');
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

/**
 * Check for selected text when panel opens
 */
async function checkForSelectedText() {
  try {
    // Check session storage first (priority)
    const sessionData = await chrome.storage.session.get(['selectedText', 'sourceUrl', 'sourceTitle']);
    if (sessionData.selectedText) {
      console.log('📝 Found selected text in session:', sessionData.selectedText.substring(0, 50) + '...');
      
      // Display in the input tab
      const inputElement = document.getElementById('customTextInput');
      if (inputElement) {
        inputElement.value = sessionData.selectedText;
        
        // Show a toast notification
        showToast('✅ Text loaded from selection!');
        
        // Switch to input tab
        switchTab('input');
        
        // Focus on the action select
        const actionSelect = document.getElementById('actionSelect');
        if (actionSelect) {
          actionSelect.focus();
        }
      }
      
      // Clear the session storage after use
      await chrome.storage.session.remove(['selectedText', 'sourceUrl', 'sourceTitle']);
      return true;
    }
    
    // Check local storage as fallback
    const localData = await chrome.storage.local.get(['selectedText', 'timestamp']);
    if (localData.selectedText && localData.timestamp) {
      // Only use if it's recent (within last 10 minutes)
      const age = Date.now() - localData.timestamp;
      if (age < 10 * 60 * 1000) {
        console.log('📝 Found selected text in local storage:', localData.selectedText.substring(0, 50) + '...');
        
        // Display in the input tab
        const inputElement = document.getElementById('customTextInput');
        if (inputElement) {
          inputElement.value = localData.selectedText;
          
          // Show a toast notification
          showToast('✅ Text loaded from selection!');
          
          // Switch to input tab
          switchTab('input');
          
          // Focus on the action select
          const actionSelect = document.getElementById('actionSelect');
          if (actionSelect) {
            actionSelect.focus();
          }
        }
        
        // Clear the local storage after use
        await chrome.storage.local.remove(['selectedText', 'timestamp']);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for selected text:', error);
    return false;
  }
}

/**
 * Check for last result from context menu action
 */
async function checkForLastResult() {
  try {
    const data = await chrome.storage.session.get('lastResult');
    if (data.lastResult) {
      console.log('📊 Found last result:', data.lastResult.action);
      showResult(data.lastResult);
      
      // Clear the session storage
      await chrome.storage.session.remove('lastResult');
    }
  } catch (error) {
    console.error('Error checking for last result:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // Refresh button
  refreshBtn.addEventListener('click', async () => {
    await loadSavedMaterials();
    showToast('Refreshed!');
  });
  
  // Result actions
  toggleOriginalBtn.addEventListener('click', () => {
    if (originalText.style.display === 'none') {
      originalText.style.display = 'block';
      toggleOriginalBtn.textContent = 'Hide';
    } else {
      originalText.style.display = 'none';
      toggleOriginalBtn.textContent = 'Show';
    }
  });
  
  copyResultBtn.addEventListener('click', async () => {
    await copyToClipboard(currentResult.result);
    showToast('Copied to clipboard!');
  });
  
  saveResultBtn.addEventListener('click', async () => {
    await saveCurrentResult();
    showToast('Saved!');
  });
  
  exportResultBtn.addEventListener('click', () => {
    exportResult(currentResult);
    showToast('Exported!');
  });
  
  // Input processing
  processInputBtn.addEventListener('click', async () => {
    await processCustomInput();
  });
}

/**
 * Handle messages from background script
 */
function handleMessage(message, sender, sendResponse) {
  console.log('📨 Side panel received message:', message.type);
  
  if (message.type === 'SHOW_RESULT') {
    showResult(message);
    sendResponse({ success: true });
  }
  
  return true;
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
  tabs.forEach(tab => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  tabContents.forEach(content => {
    if (content.id === `${tabName}Tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

/**
 * Show result in panel
 */
function showResult(data) {
  currentResult = {
    action: data.action,
    result: data.result,
    original: data.original,
    timestamp: new Date()
  };
  
  // Update UI
  emptyState.style.display = 'none';
  resultContent.style.display = 'block';
  
  resultAction.textContent = data.action;
  resultTime.textContent = formatTime(currentResult.timestamp);
  resultText.innerHTML = formatResult(data.result);
  originalText.textContent = data.original;
  
  // Reset original text visibility
  originalText.style.display = 'none';
  toggleOriginalBtn.textContent = 'Show';
  
  // Switch to result tab
  switchTab('result');
}

/**
 * Format result with markdown support
 */
function formatResult(text) {
  if (!text) return '';
  
  // First escape HTML to prevent XSS
  let formatted = escapeHtml(text);
  
  // Process headers (from most specific to least)
  formatted = formatted.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
  formatted = formatted.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^# (.*?)$/gm, '<h2>$1</h2>');
  
  // Bold and italic
  formatted = formatted.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Process lists more carefully
  const lines = formatted.split('\n');
  let inList = false;
  let listType = null;
  let processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    const bulletMatch = line.match(/^[\*\-\+]\s+(.*)$/);
    
    if (numberedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      processedLines.push(`<li>${numberedMatch[2]}</li>`);
    } else if (bulletMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      processedLines.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      
      // Handle paragraphs - don't wrap headers or empty lines
      if (line.trim() && !line.match(/^<h[1-6]>/)) {
        // Check if this line and next line form a paragraph
        if (!line.match(/^<[uo]l>/) && !line.match(/^<\/[uo]l>/)) {
          processedLines.push(`<p>${line}</p>`);
        } else {
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    }
  }
  
  // Close any open list
  if (inList) {
    processedLines.push(`</${listType}>`);
  }
  
  formatted = processedLines.join('\n');
  
  // Clean up empty paragraphs and fix nesting
  formatted = formatted.replace(/<p>\s*<\/p>/g, '');
  formatted = formatted.replace(/<p>(<h[1-6]>)/g, '$1');
  formatted = formatted.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  formatted = formatted.replace(/<p>(<[uo]l>)/g, '$1');
  formatted = formatted.replace(/(<\/[uo]l>)<\/p>/g, '$1');
  
  // Add some spacing between elements for readability
  formatted = formatted.replace(/(<\/[hpuo][^>]*>)/g, '$1\n');
  
  return formatted;
}

/**
 * Load saved materials
 */
async function loadSavedMaterials() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_MATERIALS',
      limit: 50
    });
    
    if (response.success) {
      savedMaterials = response.materials;
      renderSavedMaterials();
      
      // Update tab count
      const savedTab = document.querySelector('[data-tab="saved"]');
      savedTab.textContent = `Saved (${savedMaterials.length})`;
    }
  } catch (error) {
    console.error('❌ Failed to load saved materials:', error);
  }
}

/**
 * Render saved materials list
 */
function renderSavedMaterials() {
  if (savedMaterials.length === 0) {
    savedEmpty.style.display = 'block';
    savedList.style.display = 'none';
    return;
  }
  
  savedEmpty.style.display = 'none';
  savedList.style.display = 'block';
  
  savedList.innerHTML = savedMaterials.map(material => `
    <div class="saved-item" data-id="${material.id}">
      <div class="saved-header">
        <span class="saved-type">${material.type}</span>
        <div class="saved-actions">
          <button class="icon-btn view-btn" data-id="${material.id}" title="View">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3C4.5 3 1.7 5.6 1 8c.7 2.4 3.5 5 7 5s6.3-2.6 7-5c-.7-2.4-3.5-5-7-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
            </svg>
          </button>
          <button class="icon-btn delete-btn" data-id="${material.id}" title="Delete">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M5 2a1 1 0 011-1h4a1 1 0 011 1v1h3a1 1 0 110 2h-1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V5H2a1 1 0 110-2h3V2zm2 3a1 1 0 00-1 1v6a1 1 0 102 0V6a1 1 0 00-1-1zm3 1a1 1 0 112 0v6a1 1 0 11-2 0V6z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="saved-content">${escapeHtml(material.content)}</div>
      <div class="saved-meta">
        <span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style="margin-right: 2px;">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a1 1 0 011 1v2.586l1.707 1.707a1 1 0 01-1.414 1.414L5 6.414V3a1 1 0 011-1z"/>
          </svg>
          ${formatDate(material.timestamp)}
        </span>
        ${material.url ? `
        <span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style="margin-right: 2px;">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm1 8.5L3 6l4-2.5v5z"/>
          </svg>
          ${truncate(material.title || material.url, 30)}
        </span>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  savedList.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      viewSavedMaterial(id);
    });
  });
  
  savedList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      await deleteSavedMaterial(id);
    });
  });
}

/**
 * View saved material
 */
function viewSavedMaterial(id) {
  const material = savedMaterials.find(m => m.id === id);
  if (material) {
    showResult({
      action: material.type.charAt(0).toUpperCase() + material.type.slice(1),
      result: material.content,
      original: material.original || ''
    });
  }
}

/**
 * Delete saved material
 */
async function deleteSavedMaterial(id) {
  if (!confirm('Are you sure you want to delete this material?')) {
    return;
  }
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DELETE_MATERIAL',
      id
    });
    
    await loadSavedMaterials();
    showToast('Deleted!');
  } catch (error) {
    console.error('❌ Failed to delete material:', error);
    showToast('Failed to delete', true);
  }
}

/**
 * Save current result
 */
async function saveCurrentResult() {
  if (!currentResult) return;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.runtime.sendMessage({
      type: 'SAVE_MATERIAL',
      material: {
        type: currentResult.action.toLowerCase(),
        content: currentResult.result,
        original: currentResult.original,
        url: tab.url,
        title: tab.title
      }
    });
    
    await loadSavedMaterials();
  } catch (error) {
    console.error('❌ Failed to save result:', error);
    throw error;
  }
}

/**
 * Process custom input
 */
async function processCustomInput() {
  const text = customTextInput.value.trim();
  const action = actionSelect.value;
  
  if (!text) {
    showToast('Please enter some text', true);
    return;
  }
  
  try {
    showLoading(true);
    
    const settings = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    
    let response;
    
    switch (action) {
      case 'summarize':
        response = await chrome.runtime.sendMessage({
          type: 'SUMMARIZE',
          text,
          options: { length: settings.settings.summaryLength }
        });
        break;
      
      case 'translate':
        response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE',
          text,
          targetLanguage: settings.settings.targetLanguage,
          sourceLanguage: settings.settings.defaultLanguage
        });
        break;
      
      case 'questions':
        response = await chrome.runtime.sendMessage({
          type: 'GENERATE_QUESTIONS',
          text,
          count: settings.settings.questionCount,
          difficulty: settings.settings.difficulty
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
      
      case 'structure':
        response = await chrome.runtime.sendMessage({
          type: 'STRUCTURE_NOTES',
          text
        });
        break;
    }
    
    showLoading(false);
    
    if (response.success) {
      showResult({
        action: action.charAt(0).toUpperCase() + action.slice(1),
        result: response.result,
        original: text
      });
      
      customTextInput.value = '';
      showToast('Processing complete!');
    } else {
      throw new Error(response.error || 'Processing failed');
    }
  } catch (error) {
    showLoading(false);
    console.error('❌ Processing error:', error);
    showToast('Processing failed: ' + error.message, true);
  }
}

/**
 * Copy to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('❌ Clipboard error:', error);
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Export result as markdown file
 */
function exportResult(result) {
  if (!result) return;
  
  const markdown = `# ${result.action}\n\n**Generated:** ${formatDate(result.timestamp)}\n\n## Result\n\n${result.result}\n\n## Original Text\n\n${result.original}`;
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studysync-${result.action.toLowerCase()}-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

/**
 * Show toast notification
 */
function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' toast-error' : '');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${isError ? '#ef4444' : '#10b981'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-in-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Utility functions
 */
function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function truncate(text, length) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
