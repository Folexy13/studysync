/**
 * Service Worker - Background script for StudySync AI
 * Manages context menus, message passing, and AI session lifecycle
 */

// Import required libraries
importScripts('../lib/ai-manager.js');
importScripts('../lib/storage-manager.js');

// Initialize managers
const aiManager = new AIManager();
const storageManager = new StorageManager();

// Track installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🎉 StudySync AI installed!', details.reason);
  
  try {
    // Initialize AI capabilities
    await aiManager.initialize();
    
    // Create context menus
    createContextMenus();
    
    // Set default settings
    if (details.reason === 'install') {
      await storageManager.saveSettings({
        defaultLanguage: 'en',
        targetLanguage: 'es',
        summaryLength: 'medium',
        questionCount: 5,
        difficulty: 'medium',
        theme: 'light',
        autoSave: true,
        shortcuts: true
      });
      
      // Open welcome page
      chrome.tabs.create({
        url: chrome.runtime.getURL('options/options.html?welcome=true')
      });
    }
  } catch (error) {
    console.error('❌ Installation error:', error);
  }
});

/**
 * Create context menu items
 */
function createContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // Main menu
    chrome.contextMenus.create({
      id: 'studysync-main',
      title: 'StudySync AI',
      contexts: ['selection', 'page']
    });

    // Summarize
    chrome.contextMenus.create({
      id: 'summarize',
      parentId: 'studysync-main',
      title: '📄 Summarize',
      contexts: ['selection', 'page']
    });

    // Translate
    chrome.contextMenus.create({
      id: 'translate',
      parentId: 'studysync-main',
      title: '🌐 Translate',
      contexts: ['selection']
    });

    // Generate Questions
    chrome.contextMenus.create({
      id: 'questions',
      parentId: 'studysync-main',
      title: '❓ Generate Questions',
      contexts: ['selection', 'page']
    });

    // Generate Flashcards
    chrome.contextMenus.create({
      id: 'flashcards',
      parentId: 'studysync-main',
      title: '🗂️ Create Flashcards',
      contexts: ['selection', 'page']
    });

    // Proofread
    chrome.contextMenus.create({
      id: 'proofread',
      parentId: 'studysync-main',
      title: '✍️ Proofread',
      contexts: ['selection']
    });

    // Explain
    chrome.contextMenus.create({
      id: 'explain',
      parentId: 'studysync-main',
      title: '💡 Explain Simply',
      contexts: ['selection']
    });

    // Separator
    chrome.contextMenus.create({
      id: 'separator',
      parentId: 'studysync-main',
      type: 'separator',
      contexts: ['selection', 'page']
    });

    // Open Side Panel
    chrome.contextMenus.create({
      id: 'open-panel',
      parentId: 'studysync-main',
      title: '📚 Open Study Panel',
      contexts: ['selection', 'page']
    });

    console.log('✅ Context menus created');
  });
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('🖱️ Context menu clicked:', info.menuItemId);
  
  try {
    const selectedText = info.selectionText || '';
    
    switch (info.menuItemId) {
      case 'summarize':
        await handleSummarize(selectedText, tab);
        break;
      case 'translate':
        await handleTranslate(selectedText, tab);
        break;
      case 'questions':
        await handleGenerateQuestions(selectedText, tab);
        break;
      case 'flashcards':
        await handleGenerateFlashcards(selectedText, tab);
        break;
      case 'proofread':
        await handleProofread(selectedText, tab);
        break;
      case 'explain':
        await handleExplain(selectedText, tab);
        break;
      case 'open-panel':
        await chrome.sidePanel.open({ tabId: tab.id });
        break;
    }
  } catch (error) {
    console.error('❌ Context menu handler error:', error);
    await showNotification('Error', error.message);
  }
});

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('⌨️ Command triggered:', command);
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get selected text from content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_SELECTION'
    });
    
    const selectedText = response?.text || '';
    
    switch (command) {
      case 'summarize-selection':
        await handleSummarize(selectedText, tab);
        break;
      case 'translate-selection':
        await handleTranslate(selectedText, tab);
        break;
      case 'generate-questions':
        await handleGenerateQuestions(selectedText, tab);
        break;
    }
  } catch (error) {
    console.error('❌ Command handler error:', error);
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.type);
  
  // Handle async operations
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('❌ Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  // Return true to indicate async response
  return true;
});

/**
 * Async message handler
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case 'INITIALIZE_AI':
      const capabilities = await aiManager.initialize();
      return { success: true, capabilities };
    
    case 'SUMMARIZE':
      const summary = await aiManager.summarize(message.text, message.options);
      await storageManager.updateStats('summarize');
      return { success: true, result: summary };
    
    case 'TRANSLATE':
      const translation = await aiManager.translate(
        message.text,
        message.targetLanguage,
        message.sourceLanguage
      );
      await storageManager.updateStats('translate');
      return { success: true, result: translation };
    
    case 'GENERATE_QUESTIONS':
      const questions = await aiManager.generateQuestions(
        message.text,
        message.count,
        message.difficulty
      );
      await storageManager.updateStats('questions');
      return { success: true, result: questions };
    
    case 'GENERATE_FLASHCARDS':
      const flashcards = await aiManager.generateFlashcards(
        message.text,
        message.count
      );
      await storageManager.updateStats('flashcards');
      return { success: true, result: flashcards };
    
    case 'PROOFREAD':
      const proofread = await aiManager.proofread(message.text);
      await storageManager.updateStats('proofread');
      return { success: true, result: proofread };
    
    case 'EXPLAIN':
      const explanation = await aiManager.prompt(
        `Explain the following in simple terms that a beginner can understand:\n\n${message.text}`,
        { systemPrompt: 'You are an expert at explaining complex topics simply.' }
      );
      await storageManager.updateStats('explain');
      return { success: true, result: explanation };
    
    case 'STRUCTURE_NOTES':
      const structured = await aiManager.structureNotes(message.text);
      await storageManager.updateStats('structure');
      return { success: true, result: structured };
    
    case 'CUSTOM_PROMPT':
      const result = await aiManager.prompt(message.prompt, message.options);
      await storageManager.updateStats('custom');
      return { success: true, result };
    
    case 'SAVE_MATERIAL':
      const saved = await storageManager.saveStudyMaterial(message.material);
      return { success: true, material: saved };
    
    case 'GET_MATERIALS':
      const materials = await storageManager.getStudyMaterials(message.limit);
      return { success: true, materials };
    
    case 'DELETE_MATERIAL':
      await storageManager.deleteStudyMaterial(message.id);
      return { success: true };
    
    case 'GET_SETTINGS':
      const settings = await storageManager.getSettings();
      return { success: true, settings };
    
    case 'SAVE_SETTINGS':
      await storageManager.saveSettings(message.settings);
      return { success: true };
    
    case 'GET_STATS':
      const stats = await storageManager.getStats();
      return { success: true, stats };
    
    case 'GET_AI_STATUS':
      const status = aiManager.getStatus();
      return { success: true, status };
    
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

/**
 * Context menu action handlers
 */
async function handleSummarize(text, tab) {
  if (!text) {
    // Get full page content
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_CONTENT'
    });
    text = response?.content || '';
  }
  
  if (!text) {
    throw new Error('No content to summarize');
  }
  
  const settings = await storageManager.getSettings();
  const summary = await aiManager.summarize(text, {
    length: settings.summaryLength
  });
  
  // Send result to side panel
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.runtime.sendMessage({
    type: 'SHOW_RESULT',
    action: 'Summarize',
    result: summary,
    original: text
  });
  
  // Save if auto-save is enabled
  if (settings.autoSave) {
    await storageManager.saveStudyMaterial({
      type: 'summary',
      content: summary,
      original: text.substring(0, 500),
      url: tab.url,
      title: tab.title
    });
  }
  
  await storageManager.updateStats('summarize');
}

async function handleTranslate(text, tab) {
  if (!text) {
    throw new Error('Please select text to translate');
  }
  
  const settings = await storageManager.getSettings();
  const translation = await aiManager.translate(
    text,
    settings.targetLanguage,
    settings.defaultLanguage
  );
  
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.runtime.sendMessage({
    type: 'SHOW_RESULT',
    action: 'Translate',
    result: translation,
    original: text
  });
  
  if (settings.autoSave) {
    await storageManager.saveStudyMaterial({
      type: 'translation',
      content: translation,
      original: text,
      url: tab.url,
      title: tab.title
    });
  }
  
  await storageManager.updateStats('translate');
}

async function handleGenerateQuestions(text, tab) {
  if (!text) {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_CONTENT'
    });
    text = response?.content || '';
  }
  
  if (!text) {
    throw new Error('No content to generate questions from');
  }
  
  const settings = await storageManager.getSettings();
  const questions = await aiManager.generateQuestions(
    text,
    settings.questionCount,
    settings.difficulty
  );
  
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.runtime.sendMessage({
    type: 'SHOW_RESULT',
    action: 'Generate Questions',
    result: questions,
    original: text.substring(0, 500)
  });
  
  if (settings.autoSave) {
    await storageManager.saveStudyMaterial({
      type: 'questions',
      content: questions,
      original: text.substring(0, 500),
      url: tab.url,
      title: tab.title
    });
  }
  
  await storageManager.updateStats('questions');
}

async function handleGenerateFlashcards(text, tab) {
  if (!text) {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_CONTENT'
    });
    text = response?.content || '';
  }
  
  if (!text) {
    throw new Error('No content to generate flashcards from');
  }
  
  const flashcards = await aiManager.generateFlashcards(text, 10);
  
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.runtime.sendMessage({
    type: 'SHOW_RESULT',
    action: 'Generate Flashcards',
    result: flashcards,
    original: text.substring(0, 500)
  });
  
  const settings = await storageManager.getSettings();
  if (settings.autoSave) {
    await storageManager.saveStudyMaterial({
      type: 'flashcards',
      content: flashcards,
      original: text.substring(0, 500),
      url: tab.url,
      title: tab.title
    });
  }
  
  await storageManager.updateStats('flashcards');
}

async function handleProofread(text, tab) {
  if (!text) {
    throw new Error('Please select text to proofread');
  }
  
  const proofread = await aiManager.proofread(text);
  
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.runtime.sendMessage({
    type: 'SHOW_RESULT',
    action: 'Proofread',
    result: proofread,
    original: text
  });
  
  await storageManager.updateStats('proofread');
}

async function handleExplain(text, tab) {
  if (!text) {
    throw new Error('Please select text to explain');
  }
  
  const explanation = await aiManager.prompt(
    `Explain the following in simple terms that a beginner can understand:\n\n${text}`,
    { systemPrompt: 'You are an expert at explaining complex topics simply.' }
  );
  
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.runtime.sendMessage({
    type: 'SHOW_RESULT',
    action: 'Explain',
    result: explanation,
    original: text
  });
  
  const settings = await storageManager.getSettings();
  if (settings.autoSave) {
    await storageManager.saveStudyMaterial({
      type: 'explanation',
      content: explanation,
      original: text,
      url: tab.url,
      title: tab.title
    });
  }
  
  await storageManager.updateStats('explain');
}

/**
 * Show notification to user
 */
async function showNotification(title, message) {
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title,
      message
    });
  } catch (error) {
    console.error('❌ Notification error:', error);
  }
}

// Cleanup on shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log('👋 Service worker suspending, cleaning up...');
  aiManager.cleanup();
});

console.log('✅ Service worker loaded');
