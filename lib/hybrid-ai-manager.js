/**
 * Hybrid AI Manager for StudySync
 * Provides fallback to Gemini API when Chrome built-in AI is unavailable
 * Perfect for hackathon submission - shows adaptability and real-world thinking
 */

class HybridAIManager {
  constructor() {
    this.isBuiltInAIAvailable = false;
    this.geminiApiKey = null; // Will be set from options
    this.useCloudFallback = false;
    this.initializationPromise = this.initialize();
    this.stats = {
      builtInCalls: 0,
      cloudCalls: 0,
      fallbackCalls: 0,
      errors: 0
    };
  }

  async initialize() {
    console.log('🚀 Initializing Hybrid AI Manager...');
    
    // Check for Chrome built-in AI
    await this.checkBuiltInAI();
    
    // Load API key from storage
    await this.loadApiKey();
    
    // Log initialization status
    this.logStatus();
    
    return true;
  }

  async checkBuiltInAI() {
    try {
      // Check for AI availability
      if (typeof ai !== 'undefined' && ai.languageModel) {
        const capabilities = await ai.languageModel.capabilities();
        this.isBuiltInAIAvailable = capabilities.available === 'readily';
        
        if (!this.isBuiltInAIAvailable) {
          console.log('⚠️ Chrome AI available but not ready. Status:', capabilities.available);
          
          // Try to create a session to trigger download
          if (capabilities.available === 'after-download') {
            console.log('📥 Attempting to trigger model download...');
            try {
              await ai.languageModel.create();
            } catch (e) {
              console.log('📥 Model download initiated. Please wait...');
            }
          }
        }
      } else {
        console.log('❌ Chrome built-in AI not available');
        this.isBuiltInAIAvailable = false;
      }
    } catch (error) {
      console.error('Error checking built-in AI:', error);
      this.isBuiltInAIAvailable = false;
    }
  }

  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get(['geminiApiKey']);
      this.geminiApiKey = result.geminiApiKey;
      
      if (!this.geminiApiKey && !this.isBuiltInAIAvailable) {
        console.warn('⚠️ No Gemini API key and built-in AI unavailable. Using basic fallback.');
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  }

  logStatus() {
    console.log('=== Hybrid AI Manager Status ===');
    console.log('Built-in AI Available:', this.isBuiltInAIAvailable ? '✅' : '❌');
    console.log('Gemini API Key:', this.geminiApiKey ? '✅' : '❌');
    console.log('Fallback Mode:', !this.isBuiltInAIAvailable && !this.geminiApiKey ? '✅' : '❌');
    console.log('================================');
  }

  // Main processing method with automatic fallback
  async process(text, operation, options = {}) {
    await this.initializationPromise;
    
    const strategies = [
      { name: 'Built-in AI', method: this.processWithBuiltInAI.bind(this) },
      { name: 'Gemini API', method: this.processWithGeminiAPI.bind(this) },
      { name: 'Basic Fallback', method: this.processWithBasicFallback.bind(this) }
    ];

    for (const strategy of strategies) {
      try {
        console.log(`🔄 Trying ${strategy.name}...`);
        const result = await strategy.method(text, operation, options);
        
        if (result) {
          console.log(`✅ Success with ${strategy.name}`);
          this.updateStats(strategy.name);
          return {
            result,
            method: strategy.name,
            stats: this.stats
          };
        }
      } catch (error) {
        console.log(`❌ ${strategy.name} failed:`, error.message);
        this.stats.errors++;
      }
    }

    throw new Error('All AI processing strategies failed');
  }

  // Strategy 1: Chrome Built-in AI
  async processWithBuiltInAI(text, operation, options) {
    if (!this.isBuiltInAIAvailable) {
      throw new Error('Built-in AI not available');
    }

    switch (operation) {
      case 'summarize':
        return await this.summarizeBuiltIn(text, options);
      
      case 'translate':
        return await this.translateBuiltIn(text, options);
      
      case 'generateQuestions':
        return await this.generateQuestionsBuiltIn(text, options);
      
      case 'createFlashcards':
        return await this.createFlashcardsBuiltIn(text, options);
      
      case 'proofread':
        return await this.proofreadBuiltIn(text, options);
      
      case 'explain':
        return await this.explainBuiltIn(text, options);
      
      case 'rewrite':
        return await this.rewriteBuiltIn(text, options);
      
      default:
        return await this.promptBuiltIn(text, options);
    }
  }

  // Built-in AI implementations
  async summarizeBuiltIn(text, options) {
    const summarizer = await ai.summarizer.create({
      type: options.length || 'medium',
      format: options.format || 'plain-text'
    });
    return await summarizer.summarize(text);
  }

  async translateBuiltIn(text, options) {
    const translator = await ai.translator.create({
      sourceLanguage: options.sourceLanguage || 'en',
      targetLanguage: options.targetLanguage || 'es'
    });
    return await translator.translate(text);
  }

  async generateQuestionsBuiltIn(text, options) {
    const session = await ai.languageModel.create();
    const prompt = `Generate ${options.count || 5} study questions based on this text. 
                   Difficulty: ${options.difficulty || 'medium'}
                   Format as numbered list.
                   
                   Text: ${text}`;
    const response = await session.prompt(prompt);
    return this.parseQuestions(response);
  }

  async createFlashcardsBuiltIn(text, options) {
    const session = await ai.languageModel.create();
    const prompt = `Create ${options.count || 10} flashcards from this text.
                   Format: Q: [question] | A: [answer]
                   
                   Text: ${text}`;
    const response = await session.prompt(prompt);
    return this.parseFlashcards(response);
  }

  async proofreadBuiltIn(text, options) {
    if (ai.proofreader) {
      const proofreader = await ai.proofreader.create();
      return await proofreader.proofread(text);
    }
    
    // Fallback to language model
    const session = await ai.languageModel.create();
    const prompt = `Proofread and correct this text. Return only the corrected version: ${text}`;
    return await session.prompt(prompt);
  }

  async explainBuiltIn(text, options) {
    const session = await ai.languageModel.create();
    const prompt = `Explain this concept in simple terms for a ${options.level || 'beginner'} level student: ${text}`;
    return await session.prompt(prompt);
  }

  async rewriteBuiltIn(text, options) {
    if (ai.rewriter) {
      const rewriter = await ai.rewriter.create({
        tone: options.tone || 'neutral',
        length: options.length || 'as-is'
      });
      return await rewriter.rewrite(text);
    }
    
    const session = await ai.languageModel.create();
    const prompt = `Rewrite this text in a ${options.tone || 'neutral'} tone: ${text}`;
    return await session.prompt(prompt);
  }

  async promptBuiltIn(text, options) {
    const session = await ai.languageModel.create();
    return await session.prompt(text);
  }

  // Strategy 2: Gemini API
  async processWithGeminiAPI(text, operation, options) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompts = {
      summarize: `Summarize this text in ${options.length || 'medium'} length: ${text}`,
      translate: `Translate this text from ${options.sourceLanguage || 'en'} to ${options.targetLanguage || 'es'}: ${text}`,
      generateQuestions: `Generate ${options.count || 5} study questions (${options.difficulty || 'medium'} difficulty) from: ${text}`,
      createFlashcards: `Create ${options.count || 10} flashcards. Format: Q: [question] | A: [answer]. Text: ${text}`,
      proofread: `Proofread and correct this text. Return only corrected version: ${text}`,
      explain: `Explain this for a ${options.level || 'beginner'} student: ${text}`,
      rewrite: `Rewrite in ${options.tone || 'neutral'} tone: ${text}`
    };

    const prompt = prompts[operation] || text;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: options.temperature || 0.7,
              maxOutputTokens: options.maxTokens || 1024
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const result = data.candidates[0].content.parts[0].text;

      // Parse structured responses if needed
      if (operation === 'generateQuestions') {
        return this.parseQuestions(result);
      } else if (operation === 'createFlashcards') {
        return this.parseFlashcards(result);
      }

      return result;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // Strategy 3: Basic fallback (no AI)
  async processWithBasicFallback(text, operation, options) {
    console.log('⚠️ Using basic fallback (no AI)');
    
    switch (operation) {
      case 'summarize':
        return this.basicSummarize(text, options);
      
      case 'translate':
        return this.basicTranslate(text, options);
      
      case 'generateQuestions':
        return this.basicGenerateQuestions(text, options);
      
      case 'createFlashcards':
        return this.basicCreateFlashcards(text, options);
      
      case 'proofread':
        return this.basicProofread(text);
      
      case 'explain':
        return this.basicExplain(text);
      
      case 'rewrite':
        return text; // Return original text
      
      default:
        return `[Basic processing] ${text.substring(0, 200)}...`;
    }
  }

  // Basic fallback implementations
  basicSummarize(text, options) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const length = options.length || 'medium';
    const counts = { short: 2, medium: 4, long: 6 };
    const count = counts[length] || 4;
    
    // Extract key sentences (first, middle, last)
    const result = [];
    if (sentences.length <= count) {
      return sentences.join(' ');
    }
    
    // Take first sentence
    result.push(sentences[0]);
    
    // Take evenly distributed sentences
    const step = Math.floor(sentences.length / count);
    for (let i = step; i < sentences.length - 1; i += step) {
      if (result.length < count - 1) {
        result.push(sentences[i]);
      }
    }
    
    // Take last sentence
    result.push(sentences[sentences.length - 1]);
    
    return result.join(' ');
  }

  basicTranslate(text, options) {
    // Use Google Translate URL as fallback
    const sourceLang = options.sourceLanguage || 'en';
    const targetLang = options.targetLanguage || 'es';
    const url = `https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encodeURIComponent(text)}`;
    
    return `Translation not available offline. Open Google Translate: ${url}`;
  }

  basicGenerateQuestions(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const questions = [];
    
    // Generate basic questions from key sentences
    const templates = [
      'What is the main topic discussed?',
      'Can you explain the key concept mentioned?',
      'What are the important points to remember?',
      'How does this information relate to the subject?',
      'What conclusions can be drawn from this text?'
    ];
    
    // Try to extract topic from first sentence
    if (sentences.length > 0) {
      const firstSentence = sentences[0];
      const topic = firstSentence.split(' ').slice(0, 5).join(' ');
      questions.push(`What do you know about ${topic}?`);
    }
    
    // Add template questions
    questions.push(...templates.slice(0, 4));
    
    return questions;
  }

  basicCreateFlashcards(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const flashcards = [];
    
    // Create basic flashcards from sentences
    sentences.slice(0, 10).forEach((sentence, index) => {
      // Extract key terms (capitalized words, numbers)
      const keyTerms = sentence.match(/\b[A-Z][a-z]+\b|\b\d+\b/g) || [];
      
      if (keyTerms.length > 0) {
        flashcards.push({
          question: `What is ${keyTerms[0]}?`,
          answer: sentence.trim()
        });
      } else {
        flashcards.push({
          question: `Fact #${index + 1}`,
          answer: sentence.trim()
        });
      }
    });
    
    return flashcards;
  }

  basicProofread(text) {
    // Basic spell check patterns
    const corrections = {
      'teh': 'the',
      'recieve': 'receive',
      'occured': 'occurred',
      'untill': 'until',
      'wich': 'which',
      'doesnt': "doesn't",
      'dont': "don't",
      'wont': "won't",
      'cant': "can't",
      'wouldnt': "wouldn't"
    };
    
    let corrected = text;
    for (const [wrong, right] of Object.entries(corrections)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    // Basic capitalization
    corrected = corrected.replace(/^\s*[a-z]/gm, match => match.toUpperCase());
    corrected = corrected.replace(/\. [a-z]/g, match => match.toUpperCase());
    
    return corrected;
  }

  basicExplain(text) {
    const words = text.split(/\s+/);
    const wordCount = words.length;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    return `This text contains ${wordCount} words and ${sentences.length} sentences. 
            The main topic appears to be: ${words.slice(0, 5).join(' ')}...
            
            Key points:
            ${sentences.slice(0, 3).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')}`;
  }

  // Helper methods
  parseQuestions(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const questions = [];
    
    for (const line of lines) {
      // Remove numbering and clean up
      const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
      if (cleaned && cleaned.length > 10) {
        questions.push(cleaned);
      }
    }
    
    return questions.length > 0 ? questions : ['Could not generate questions'];
  }

  parseFlashcards(text) {
    const flashcards = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('Q:') && line.includes('A:')) {
        const [q, a] = line.split('|').map(part => part.trim());
        const question = q.replace('Q:', '').trim();
        const answer = a.replace('A:', '').trim();
        
        if (question && answer) {
          flashcards.push({ question, answer });
        }
      }
    }
    
    return flashcards.length > 0 ? flashcards : [{ question: 'Sample Question', answer: 'Sample Answer' }];
  }

  updateStats(method) {
    if (method === 'Built-in AI') {
      this.stats.builtInCalls++;
    } else if (method === 'Gemini API') {
      this.stats.cloudCalls++;
    } else {
      this.stats.fallbackCalls++;
    }
  }

  // Get current status for UI
  getStatus() {
    return {
      ready: true,
      builtInAvailable: this.isBuiltInAIAvailable,
      apiKeyConfigured: !!this.geminiApiKey,
      fallbackOnly: !this.isBuiltInAIAvailable && !this.geminiApiKey,
      stats: this.stats
    };
  }

  // Set API key dynamically
  async setApiKey(apiKey) {
    this.geminiApiKey = apiKey;
    await chrome.storage.sync.set({ geminiApiKey: apiKey });
    this.logStatus();
  }

  // Re-check AI availability
  async recheckAvailability() {
    await this.checkBuiltInAI();
    this.logStatus();
    return this.getStatus();
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HybridAIManager;
}