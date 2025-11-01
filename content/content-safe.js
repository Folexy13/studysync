/**
 * Content Script - Safe version with better error handling
 * Handles page content extraction and selection detection
 */

(function() {
  'use strict';
  
  // Check if extension is still valid
  if (!chrome.runtime?.id) {
    console.warn('StudySync AI: Extension context not available');
    return;
  }

  console.log('✅ StudySync AI content script loaded');

  // Track current selection
  let currentSelection = '';
  let floatingButton = null;
  let isExtensionValid = true;

  // Check extension validity periodically
  function checkExtensionValidity() {
    isExtensionValid = !!(chrome.runtime?.id);
    if (!isExtensionValid) {
      console.warn('StudySync AI: Extension context lost');
      cleanup();
    }
    return isExtensionValid;
  }

  // Cleanup function
  function cleanup() {
    if (floatingButton && floatingButton.parentNode) {
      floatingButton.remove();
    }
    floatingButton = null;
  }

  // Safe chrome API call wrapper
  async function safeChromCall(fn) {
    try {
      if (!checkExtensionValidity()) {
        throw new Error('Extension context invalidated');
      }
      return await fn();
    } catch (error) {
      console.error('StudySync AI: Chrome API error:', error);
      if (error.message?.includes('Extension context invalidated')) {
        cleanup();
      }
      throw error;
    }
  }

  // Listen for selection changes
  document.addEventListener('selectionchange', () => {
    if (!isExtensionValid) return;
    const selection = window.getSelection();
    currentSelection = selection.toString().trim();
  });

  // Listen for messages from background script
  if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Content script received message:', message.type);
      
      // Wrap in try-catch for safety
      (async () => {
        try {
          if (!checkExtensionValidity()) {
            sendResponse({ error: 'Extension context invalidated' });
            return;
          }
          
          switch (message.type) {
            case 'GET_SELECTION':
              sendResponse({ text: currentSelection });
              break;
            
            case 'GET_PAGE_CONTENT':
              const content = extractPageContent();
              sendResponse({ content });
              break;
            
            case 'HIGHLIGHT_TEXT':
              highlightText(message.text);
              sendResponse({ success: true });
              break;
            
            case 'SHOW_TOOLTIP':
              showTooltip(message.text, message.position);
              sendResponse({ success: true });
              break;
            
            default:
              sendResponse({ error: 'Unknown message type' });
          }
        } catch (error) {
          console.error('❌ Content script error:', error);
          sendResponse({ error: error.message });
        }
      })();
      
      return true; // Keep channel open for async response
    });
  }

  /**
   * Extract readable content from page
   */
  function extractPageContent() {
    const selectors = [
      'article', 'main', '[role="main"]', '.content',
      '.post-content', '.entry-content', '#content', 'body'
    ];
    
    let contentElement = null;
    for (const selector of selectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }
    
    if (!contentElement) {
      contentElement = document.body;
    }
    
    const clone = contentElement.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer',
      'aside', '.sidebar', '.advertisement', '.ad',
      '.menu', '.navigation'
    ];
    
    unwantedSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    let text = clone.textContent || clone.innerText || '';
    text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    
    if (text.length > 50000) {
      text = text.substring(0, 50000) + '...';
    }
    
    return text;
  }

  /**
   * Highlight text on page
   */
  function highlightText(text) {
    if (!text) return;
    
    document.querySelectorAll('.studysync-highlight').forEach(el => {
      el.classList.remove('studysync-highlight');
    });
    
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes(text)) {
        const parent = node.parentElement;
        if (parent && !parent.classList.contains('studysync-highlight')) {
          parent.classList.add('studysync-highlight');
          parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }
  }

  /**
   * Show tooltip with result
   */
  function showTooltip(text, position) {
    const existing = document.getElementById('studysync-tooltip');
    if (existing) {
      existing.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.id = 'studysync-tooltip';
    tooltip.className = 'studysync-tooltip';
    tooltip.innerHTML = `
      <div class="studysync-tooltip-header">
        <span>StudySync AI</span>
        <button class="studysync-tooltip-close">×</button>
      </div>
      <div class="studysync-tooltip-content">
        ${escapeHtml(text)}
      </div>
    `;
    
    if (position) {
      tooltip.style.left = position.x + 'px';
      tooltip.style.top = position.y + 'px';
    }
    
    document.body.appendChild(tooltip);
    
    tooltip.querySelector('.studysync-tooltip-close').addEventListener('click', () => {
      tooltip.remove();
    });
    
    setTimeout(() => {
      if (tooltip.parentElement) {
        tooltip.remove();
      }
    }, 10000);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create floating action button for quick access
   */
  function createFloatingButton() {
    document.addEventListener('mouseup', (e) => {
      if (!isExtensionValid) return;
      
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && selectedText.length > 10) {
          showFloatingButton(e.pageX, e.pageY);
        } else {
          hideFloatingButton();
        }
      }, 10);
    });
  }

  function showFloatingButton(x, y) {
    if (!checkExtensionValidity()) return;
    
    if (!floatingButton) {
      floatingButton = document.createElement('div');
      floatingButton.className = 'studysync-floating-btn';
      floatingButton.innerHTML = `
        <button title="StudySync AI - Save text for processing">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
          </svg>
        </button>
      `;
      
      floatingButton.addEventListener('click', handleFloatingButtonClick);
      document.body.appendChild(floatingButton);
    }
    
    floatingButton.style.left = x + 'px';
    floatingButton.style.top = (y - 40) + 'px';
    floatingButton.style.display = 'block';
  }

  async function handleFloatingButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText) {
      showTooltip('No text selected', { x: e.pageX, y: e.pageY - 50 });
      return;
    }
    
    try {
      // Try to save to storage
      await safeChromCall(async () => {
        await chrome.storage.local.set({
          selectedText: selectedText,
          timestamp: Date.now()
        });
      });
      
      // Show success message
      showTooltip('✅ Text saved! Click the StudySync extension icon in your toolbar to process it.', {
        x: e.pageX,
        y: e.pageY - 50
      });
      
      hideFloatingButton();
      
    } catch (error) {
      console.error('Error saving text:', error);
      
      // Show fallback message
      showTooltip('📋 Text copied! Click the StudySync extension icon and paste it there.', {
        x: e.pageX,
        y: e.pageY - 50
      });
      
      // Try to copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(selectedText);
      } catch (clipError) {
        console.error('Clipboard error:', clipError);
      }
    }
  }

  function hideFloatingButton() {
    if (floatingButton) {
      floatingButton.style.display = 'none';
    }
  }

  // Initialize floating button
  createFloatingButton();

  // Handle clicks outside to hide floating button
  document.addEventListener('mousedown', (e) => {
    if (floatingButton && !floatingButton.contains(e.target)) {
      const selection = window.getSelection();
      if (!selection.toString().trim()) {
        hideFloatingButton();
      }
    }
  });

  // Check extension validity every 5 seconds
  setInterval(checkExtensionValidity, 5000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);

})();