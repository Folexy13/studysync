/**
 * Quick Action Popup - Alternative to side panel for user gesture restrictions
 */

let selectedText = '';

// Initialize popup
async function initialize() {
  console.log('🚀 Initializing quick action popup...');
  
  try {
    // Check for selected text in storage
    const sessionData = await chrome.storage.session.get(['selectedText']);
    const localData = await chrome.storage.local.get(['selectedText', 'timestamp']);
    
    // Use session storage first, then local storage if recent
    if (sessionData.selectedText) {
      selectedText = sessionData.selectedText;
    } else if (localData.selectedText && localData.timestamp) {
      const age = Date.now() - localData.timestamp;
      if (age < 5 * 60 * 1000) { // Within 5 minutes
        selectedText = localData.selectedText;
      }
    }
    
    // If no stored text, try to get from active tab
    if (!selectedText) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' });
        if (response?.text) {
          selectedText = response.text;
        }
      } catch (error) {
        console.log('Could not get selection from tab:', error);
      }
    }
    
    // Render UI based on whether we have text
    renderUI();
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    showError('Failed to initialize. Please try again.');
  }
}

// Render the UI
function renderUI() {
  const contentArea = document.getElementById('contentArea');
  
  if (selectedText) {
    // Show selected text and actions
    contentArea.innerHTML = `
      <div class="selected-text">
        <h3>Selected Text</h3>
        <p>${escapeHtml(truncate(selectedText, 200))}</p>
      </div>
      
      <div class="actions">
        <button class="action-btn" data-action="summarize">
          <span class="icon">📄</span>
          <span>Summarize</span>
        </button>
        
        <button class="action-btn" data-action="translate">
          <span class="icon">🌐</span>
          <span>Translate</span>
        </button>
        
        <button class="action-btn" data-action="questions">
          <span class="icon">❓</span>
          <span>Questions</span>
        </button>
        
        <button class="action-btn" data-action="flashcards">
          <span class="icon">🗂️</span>
          <span>Flashcards</span>
        </button>
        
        <button class="action-btn" data-action="proofread">
          <span class="icon">✍️</span>
          <span>Proofread</span>
        </button>
        
        <button class="action-btn" data-action="explain">
          <span class="icon">💡</span>
          <span>Explain</span>
        </button>
        
        <button class="action-btn open-panel-btn" data-action="open-panel">
          <span class="icon">📚</span>
          <span>Open Full Panel</span>
        </button>
      </div>
    `;
    
    // Add event listeners to action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });
    
  } else {
    // Show input area for manual text entry
    contentArea.innerHTML = `
      <div class="no-text">
        <p>No text selected. Enter text below or select text on a webpage.</p>
      </div>
      
      <div class="input-area">
        <textarea id="textInput" placeholder="Enter or paste your text here..."></textarea>
      </div>
      
      <div class="actions">
        <button class="action-btn" data-action="process-input">
          <span class="icon">🚀</span>
          <span>Process</span>
        </button>
        
        <button class="action-btn open-panel-btn" data-action="open-panel">
          <span class="icon">📚</span>
          <span>Open Full Panel</span>
        </button>
      </div>
    `;
    
    // Add event listeners
    document.querySelector('[data-action="process-input"]').addEventListener('click', () => {
      const input = document.getElementById('textInput').value.trim();
      if (input) {
        selectedText = input;
        renderUI();
      }
    });
    
    document.querySelector('[data-action="open-panel"]').addEventListener('click', handleAction);
  }
}

// Handle action button clicks
async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  console.log('🎯 Action clicked:', action);
  
  if (action === 'open-panel') {
    // Try to open side panel
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Store text for side panel
      if (selectedText) {
        await chrome.storage.session.set({
          selectedText: selectedText,
          sourceUrl: tab.url,
          sourceTitle: tab.title
        });
      }
      
      // Try to open side panel
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close(); // Close popup after opening panel
    } catch (error) {
      console.error('Failed to open side panel:', error);
      // Fallback: open in new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL('sidepanel/sidepanel.html')
      });
    }
    return;
  }
  
  // Show loading state
  showLoading(true);
  
  try {
    let response;
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    
    switch (action) {
      case 'summarize':
        response = await chrome.runtime.sendMessage({
          type: 'SUMMARIZE',
          text: selectedText,
          options: { length: settings.settings?.summaryLength || 'medium' }
        });
        break;
        
      case 'translate':
        response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE',
          text: selectedText,
          targetLanguage: settings.settings?.targetLanguage || 'es',
          sourceLanguage: settings.settings?.defaultLanguage || 'en'
        });
        break;
        
      case 'questions':
        response = await chrome.runtime.sendMessage({
          type: 'GENERATE_QUESTIONS',
          text: selectedText,
          count: settings.settings?.questionCount || 5,
          difficulty: settings.settings?.difficulty || 'medium'
        });
        break;
        
      case 'flashcards':
        response = await chrome.runtime.sendMessage({
          type: 'GENERATE_FLASHCARDS',
          text: selectedText,
          count: 10
        });
        break;
        
      case 'proofread':
        response = await chrome.runtime.sendMessage({
          type: 'PROOFREAD',
          text: selectedText
        });
        break;
        
      case 'explain':
        response = await chrome.runtime.sendMessage({
          type: 'EXPLAIN',
          text: selectedText
        });
        break;
    }
    
    showLoading(false);
    
    if (response?.success) {
      // Store result and open side panel to show it
      await chrome.storage.session.set({
        lastResult: {
          type: 'SHOW_RESULT',
          action: action.charAt(0).toUpperCase() + action.slice(1),
          result: response.result,
          original: selectedText
        }
      });
      
      // Try to open side panel to show result
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.sidePanel.open({ tabId: tab.id });
        window.close();
      } catch (error) {
        // Show result in popup
        showResult(response.result, action);
      }
    } else {
      throw new Error(response?.error || 'Processing failed');
    }
    
  } catch (error) {
    showLoading(false);
    console.error('❌ Action error:', error);
    
    // Check if it's an API key error
    if (error.message?.includes('API key') || error.message?.includes('Gemini')) {
      // Show setup prompt
      showError('API key required. Click to configure.', async () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL('setup/api-key-setup.html')
        });
      });
    } else {
      showError(error.message);
    }
  }
}

// Show result in popup
function showResult(result, action) {
  const contentArea = document.getElementById('contentArea');
  
  contentArea.innerHTML = `
    <div class="selected-text">
      <h3>${action.charAt(0).toUpperCase() + action.slice(1)} Result</h3>
      <p style="max-height: 300px; white-space: pre-wrap;">${escapeHtml(result)}</p>
    </div>
    
    <div class="actions">
      <button class="action-btn" id="copyBtn">
        <span class="icon">📋</span>
        <span>Copy</span>
      </button>
      
      <button class="action-btn" id="backBtn">
        <span class="icon">⬅️</span>
        <span>Back</span>
      </button>
      
      <button class="action-btn open-panel-btn" data-action="open-panel">
        <span class="icon">📚</span>
        <span>Open Full Panel</span>
      </button>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('copyBtn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(result);
    showToast('Copied to clipboard!');
  });
  
  document.getElementById('backBtn').addEventListener('click', () => {
    renderUI();
  });
  
  document.querySelector('[data-action="open-panel"]').addEventListener('click', handleAction);
}

// Show loading state
function showLoading(show) {
  const loading = document.getElementById('loading');
  const contentArea = document.getElementById('contentArea');
  
  if (show) {
    loading.classList.add('active');
    contentArea.style.display = 'none';
  } else {
    loading.classList.remove('active');
    contentArea.style.display = 'block';
  }
}

// Show error message
function showError(message, onClick) {
  const contentArea = document.getElementById('contentArea');
  
  contentArea.innerHTML = `
    <div class="no-text" ${onClick ? 'style="cursor: pointer;"' : ''}>
      <p style="color: #fee;">⚠️ ${message}</p>
      ${onClick ? '<p style="font-size: 12px;">Click here to fix</p>' : ''}
    </div>
  `;
  
  if (onClick) {
    contentArea.querySelector('.no-text').addEventListener('click', onClick);
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncate(text, length) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translate(-50%, 100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}