/**
 * Content Script - Injected into web pages
 * Handles page content extraction and selection detection
 */

console.log('✅ StudySync AI content script loaded');

// Track current selection
let currentSelection = '';

// Listen for selection changes
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  currentSelection = selection.toString().trim();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message.type);
  
  try {
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
  
  return true; // Keep channel open for async response
});

/**
 * Extract readable content from page
 */
function extractPageContent() {
  // Try to find main content area
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post-content',
    '.entry-content',
    '#content',
    'body'
  ];
  
  let contentElement = null;
  for (const selector of selectors) {
    contentElement = document.querySelector(selector);
    if (contentElement) break;
  }
  
  if (!contentElement) {
    contentElement = document.body;
  }
  
  // Extract text content, removing scripts and styles
  const clone = contentElement.cloneNode(true);
  
  // Remove unwanted elements
  const unwantedSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    '.sidebar',
    '.advertisement',
    '.ad',
    '.menu',
    '.navigation'
  ];
  
  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Get clean text
  let text = clone.textContent || clone.innerText || '';
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Limit to reasonable size (50KB)
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
  
  // Remove existing highlights
  document.querySelectorAll('.studysync-highlight').forEach(el => {
    el.classList.remove('studysync-highlight');
  });
  
  // Find and highlight text
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
  // Remove existing tooltip
  const existing = document.getElementById('studysync-tooltip');
  if (existing) {
    existing.remove();
  }
  
  // Create tooltip
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
  
  // Position tooltip
  if (position) {
    tooltip.style.left = position.x + 'px';
    tooltip.style.top = position.y + 'px';
  }
  
  // Add to page
  document.body.appendChild(tooltip);
  
  // Add close handler
  tooltip.querySelector('.studysync-tooltip-close').addEventListener('click', () => {
    tooltip.remove();
  });
  
  // Auto-remove after 10 seconds
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
  // Only show on text selection
  document.addEventListener('mouseup', (e) => {
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

let floatingButton = null;

function showFloatingButton(x, y) {
  if (!floatingButton) {
    floatingButton = document.createElement('div');
    floatingButton.className = 'studysync-floating-btn';
    floatingButton.innerHTML = `
      <button title="StudySync AI - Quick Actions">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
        </svg>
      </button>
    `;
    
    floatingButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Open side panel
      await chrome.runtime.sendMessage({ type: 'OPEN_PANEL' });
    });
    
    document.body.appendChild(floatingButton);
  }
  
  floatingButton.style.left = x + 'px';
  floatingButton.style.top = (y - 40) + 'px';
  floatingButton.style.display = 'block';
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
