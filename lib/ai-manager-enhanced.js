/**
 * Enhanced AI Manager - Hybrid approach with Chrome Built-in AI and Gemini API fallback
 * Maintains compatibility with existing code while adding robust fallback mechanisms
 */

// Use globalThis for cross-context compatibility
const globalScope = typeof globalThis !== 'undefined' ? globalThis : self;

class AIManagerEnhanced {
  constructor() {
    this.capabilities = {
      prompt: null,
      summarizer: null,
      writer: null,
      rewriter: null,
      translator: null,
      proofreader: null
    };
    
    this.sessions = {
      prompt: null,
      summarizer: null,
      writer: null,
      rewriter: null,
      translator: null,
      proofreader: null
    };
    
    // Hybrid mode configuration
    this.hybridConfig = {
      enabled: true,
      geminiApiKey: null,
      preferBuiltIn: true,
      autoFallback: true
    };
    
    // Usage statistics
    this.stats = {
      builtInCalls: 0,
      geminiCalls: 0,
      fallbackCalls: 0,
      errors: 0,
      lastMethod: null
    };
  }

  /**
   * Initialize and check all AI capabilities
   */
  async initialize() {
    console.log('🚀 Initializing Enhanced AI Manager (Hybrid Mode)...');
    
    try {
      // Check built-in capabilities
      await this.checkCapabilities();
      
      // Load Gemini API key for hybrid mode
      await this.loadGeminiConfig();
      
      // Log status
      this.logStatus();
      
      console.log('✅ Enhanced AI Manager initialized successfully');
      return this.getStatus();
    } catch (error) {
      console.error('❌ AI Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check availability of all AI APIs
   */
  async checkCapabilities() {
    // Check Prompt API
    if (globalScope.ai && globalScope.ai.languageModel) {
      try {
        this.capabilities.prompt = await globalScope.ai.languageModel.capabilities();
        console.log('✅ Prompt API available:', this.capabilities.prompt);
      } catch (error) {
        console.warn('⚠️ Prompt API check failed:', error);
        this.capabilities.prompt = null;
      }
    }

    // Check Summarizer API
    if (globalScope.ai && globalScope.ai.summarizer) {
      try {
        this.capabilities.summarizer = await globalScope.ai.summarizer.capabilities();
        console.log('✅ Summarizer API available:', this.capabilities.summarizer);
      } catch (error) {
        console.warn('⚠️ Summarizer API check failed:', error);
        this.capabilities.summarizer = null;
      }
    }

    // Check Writer API
    if (globalScope.ai && globalScope.ai.writer) {
      try {
        this.capabilities.writer = await globalScope.ai.writer.capabilities();
        console.log('✅ Writer API available:', this.capabilities.writer);
      } catch (error) {
        console.warn('⚠️ Writer API check failed:', error);
        this.capabilities.writer = null;
      }
    }

    // Check Rewriter API
    if (globalScope.ai && globalScope.ai.rewriter) {
      try {
        this.capabilities.rewriter = await globalScope.ai.rewriter.capabilities();
        console.log('✅ Rewriter API available:', this.capabilities.rewriter);
      } catch (error) {
        console.warn('⚠️ Rewriter API check failed:', error);
        this.capabilities.rewriter = null;
      }
    }

    // Check Translator API
    if (globalScope.translation && globalScope.translation.canTranslate) {
      try {
        this.capabilities.translator = { available: 'readily' };
        console.log('✅ Translator API available');
      } catch (error) {
        console.warn('⚠️ Translator API check failed:', error);
        this.capabilities.translator = null;
      }
    }

    // Check Proofreader API (part of rewriter)
    if (globalScope.ai && globalScope.ai.rewriter) {
      this.capabilities.proofreader = this.capabilities.rewriter;
    }

    return this.capabilities;
  }

  /**
   * Load Gemini API configuration
   */
  async loadGeminiConfig() {
    try {
      const storage = await chrome.storage.sync.get(['geminiApiKey', 'hybridMode']);
      this.hybridConfig.geminiApiKey = storage.geminiApiKey;
      this.hybridConfig.enabled = storage.hybridMode !== false; // Default to true
      
      if (this.hybridConfig.geminiApiKey) {
        console.log('✅ Gemini API key loaded for hybrid fallback');
      } else {
        console.log('⚠️ No Gemini API key configured - using basic fallback');
      }
    } catch (error) {
      console.warn('⚠️ Could not load Gemini config:', error);
    }
  }

  /**
   * Log current status
   */
  logStatus() {
    const builtInAvailable = this.isBuiltInAvailable();
    const geminiAvailable = !!this.hybridConfig.geminiApiKey;
    
    console.log('=== AI Manager Status ===');
    console.log('Mode: Hybrid (Enhanced)');
    console.log('Built-in AI:', builtInAvailable ? '✅ Available' : '❌ Not Available');
    console.log('Gemini API:', geminiAvailable ? '✅ Configured' : '❌ Not Configured');
    console.log('Fallback:', !builtInAvailable && !geminiAvailable ? '✅ Basic Mode' : '❌ Not Needed');
    console.log('========================');
  }

  /**
   * Check if built-in AI is available
   */
  isBuiltInAvailable() {
    return this.capabilities.prompt?.available === 'readily' ||
           this.capabilities.summarizer?.available === 'readily' ||
           this.capabilities.writer?.available === 'readily' ||
           this.capabilities.rewriter?.available === 'readily';
  }

  /**
   * Create or get Prompt API session with multimodal support
   */
  async getPromptSession(options = {}) {
    if (!this.capabilities.prompt || this.capabilities.prompt.available !== 'readily') {
      if (!this.hybridConfig.enabled) {
        throw new Error('Prompt API is not available. Please enable Chrome AI features.');
      }
      return null; // Will use fallback
    }

    try {
      if (!this.sessions.prompt || options.forceNew) {
        const sessionOptions = {
          systemPrompt: options.systemPrompt || 'You are a helpful AI study assistant.',
          ...options
        };
        
        this.sessions.prompt = await globalScope.ai.languageModel.create(sessionOptions);
        console.log('✅ Prompt API session created');
      }

      return this.sessions.prompt;
    } catch (error) {
      console.error('❌ Failed to create Prompt API session:', error);
      if (!this.hybridConfig.enabled) {
        throw new Error(`Prompt API error: ${error.message}`);
      }
      return null; // Will use fallback
    }
  }

  /**
   * Generate text using Prompt API with hybrid fallback
   */
  async prompt(text, options = {}) {
    // Try built-in first
    try {
      const session = await this.getPromptSession(options);
      if (session) {
        const result = await session.prompt(text);
        this.stats.builtInCalls++;
        this.stats.lastMethod = 'built-in';
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Built-in prompt failed:', error);
      this.stats.errors++;
    }

    // Try Gemini API fallback
    if (this.hybridConfig.enabled && this.hybridConfig.geminiApiKey) {
      try {
        const result = await this.geminiPrompt(text, options);
        this.stats.geminiCalls++;
        this.stats.lastMethod = 'gemini';
        return result;
      } catch (error) {
        console.warn('⚠️ Gemini API failed:', error);
        this.stats.errors++;
      }
    }

    // Basic fallback
    this.stats.fallbackCalls++;
    this.stats.lastMethod = 'fallback';
    return this.basicPrompt(text, options);
  }

  /**
   * Gemini API prompt
   */
  async geminiPrompt(text, options = {}) {
    // Try multiple endpoints to find working one
    const endpoints = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(
          `${endpoint}?key=${this.hybridConfig.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: options.systemPrompt ? `${options.systemPrompt}\n\n${text}` : text }]
              }],
              generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || 1024
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.candidates[0].content.parts[0].text;
        } else {
          const error = await response.json();
          lastError = error.error?.message || response.statusText;
          continue; // Try next endpoint
        }
      } catch (error) {
        lastError = error.message;
        continue; // Try next endpoint
      }
    }

    // If all endpoints failed
    throw new Error(`Gemini API error: ${lastError}`);
  }

  /**
   * Basic prompt fallback
   */
  basicPrompt(text, options = {}) {
    console.log('⚠️ Using basic fallback (no AI)');
    return `[Basic response - AI not available]\nYour input: ${text.substring(0, 100)}...\n\nPlease configure Gemini API key for better results.`;
  }

  /**
   * Stream text generation using Prompt API
   */
  async promptStreaming(text, onChunk, options = {}) {
    // Try built-in streaming
    try {
      const session = await this.getPromptSession(options);
      if (session && session.promptStreaming) {
        const stream = await session.promptStreaming(text);
        let fullResponse = '';

        for await (const chunk of stream) {
          fullResponse = chunk;
          if (onChunk) {
            onChunk(chunk);
          }
        }

        this.stats.builtInCalls++;
        this.stats.lastMethod = 'built-in-streaming';
        return fullResponse;
      }
    } catch (error) {
      console.warn('⚠️ Built-in streaming failed:', error);
    }

    // Fallback to non-streaming
    const result = await this.prompt(text, options);
    if (onChunk) {
      onChunk(result);
    }
    return result;
  }

  /**
   * Summarize text using Summarizer API with hybrid fallback
   */
  async summarize(text, options = {}) {
    // Try built-in summarizer
    if (this.capabilities.summarizer?.available === 'readily') {
      try {
        const summarizer = await globalScope.ai.summarizer.create({
          type: options.type || 'tl;dr',
          format: options.format || 'plain-text',
          length: options.length || 'medium',
          ...options
        });

        const summary = await summarizer.summarize(text);
        summarizer.destroy();
        
        this.stats.builtInCalls++;
        this.stats.lastMethod = 'built-in-summarizer';
        return summary;
      } catch (error) {
        console.warn('⚠️ Built-in summarizer failed:', error);
        this.stats.errors++;
      }
    }

    // Fallback to prompt-based summarization
    return await this.prompt(
      `Please summarize the following text concisely:\n\n${text}`,
      { systemPrompt: 'You are a text summarization assistant.' }
    );
  }

  /**
   * Generate text using Writer API with hybrid fallback
   */
  async write(prompt, options = {}) {
    // Try built-in writer
    if (this.capabilities.writer?.available === 'readily') {
      try {
        const writer = await globalScope.ai.writer.create({
          tone: options.tone || 'neutral',
          format: options.format || 'plain-text',
          length: options.length || 'medium',
          ...options
        });

        const result = await writer.write(prompt);
        writer.destroy();
        
        this.stats.builtInCalls++;
        this.stats.lastMethod = 'built-in-writer';
        return result;
      } catch (error) {
        console.warn('⚠️ Built-in writer failed:', error);
        this.stats.errors++;
      }
    }

    // Fallback to prompt
    return await this.prompt(prompt, { 
      systemPrompt: 'You are a creative writing assistant.'
    });
  }

  /**
   * Rewrite text using Rewriter API with hybrid fallback
   */
  async rewrite(text, options = {}) {
    // Try built-in rewriter
    if (this.capabilities.rewriter?.available === 'readily') {
      try {
        const rewriter = await globalScope.ai.rewriter.create({
          tone: options.tone || 'as-is',
          format: options.format || 'as-is',
          length: options.length || 'as-is',
          ...options
        });

        const result = await rewriter.rewrite(text);
        rewriter.destroy();
        
        this.stats.builtInCalls++;
        this.stats.lastMethod = 'built-in-rewriter';
        return result;
      } catch (error) {
        console.warn('⚠️ Built-in rewriter failed:', error);
        this.stats.errors++;
      }
    }

    // Fallback to prompt
    return await this.prompt(
      `Please rewrite the following text in a ${options.tone || 'neutral'} tone:\n\n${text}`,
      { systemPrompt: 'You are a text rewriting assistant.' }
    );
  }

  /**
   * Proofread and fix grammar
   */
  async proofread(text) {
    try {
      return await this.rewrite(text, { 
        tone: 'neutral',
        format: 'as-is',
        length: 'as-is'
      });
    } catch (error) {
      console.error('❌ Proofreader error:', error);
      
      // Basic fallback
      if (this.hybridConfig.enabled) {
        return await this.prompt(
          `Please proofread and correct any errors in this text:\n\n${text}`,
          { systemPrompt: 'You are a proofreading assistant.' }
        );
      }
      
      throw new Error(`Failed to proofread: ${error.message}`);
    }
  }

  /**
   * Translate text using Translator API with hybrid fallback
   */
  async translate(text, targetLanguage, sourceLanguage = 'en') {
    // Try built-in translator
    if (this.capabilities.translator) {
      try {
        const canTranslate = await globalScope.translation.canTranslate({
          sourceLanguage,
          targetLanguage
        });

        if (canTranslate !== 'no') {
          if (canTranslate === 'after-download') {
            console.log('⏳ Downloading translation model...');
          }

          const translator = await globalScope.translation.createTranslator({
            sourceLanguage,
            targetLanguage
          });

          const result = await translator.translate(text);
          
          this.stats.builtInCalls++;
          this.stats.lastMethod = 'built-in-translator';
          return result;
        }
      } catch (error) {
        console.warn('⚠️ Built-in translator failed:', error);
        this.stats.errors++;
      }
    }

    // Fallback to prompt-based translation
    return await this.prompt(
      `Translate the following text from ${sourceLanguage} to ${targetLanguage}:\n\n${text}`,
      { systemPrompt: 'You are a professional translator.' }
    );
  }

  /**
   * Generate study questions from content
   */
  async generateQuestions(content, count = 5, difficulty = 'medium') {
    const prompt = `Based on the following content, generate ${count} ${difficulty} difficulty study questions. Format as a numbered list with clear, concise questions.

Content:
${content}

Generate ${count} questions:`;

    const result = await this.prompt(prompt, {
      systemPrompt: 'You are an educational assessment expert who creates effective study questions.'
    });

    // Track method used
    console.log(`Questions generated using: ${this.stats.lastMethod}`);
    return result;
  }

  /**
   * Generate flashcards from content
   */
  async generateFlashcards(content, count = 10) {
    const prompt = `Create ${count} flashcards from the following content. Format as:

Q: [Question]
A: [Answer]

Content:
${content}

Generate ${count} flashcards:`;

    const result = await this.prompt(prompt, {
      systemPrompt: 'You are an educational content creator specializing in flashcard creation.'
    });

    // Track method used
    console.log(`Flashcards generated using: ${this.stats.lastMethod}`);
    return result;
  }

  /**
   * Convert lecture notes to structured format
   */
  async structureNotes(rawNotes) {
    const prompt = `Convert these raw lecture notes into a well-structured study guide with:
1. Main topics (use ## headings)
2. Key concepts (use bullet points)
3. Important definitions (use bold)
4. Examples (use > blockquotes)

Raw notes:
${rawNotes}

Structured notes:`;

    const result = await this.prompt(prompt, {
      systemPrompt: 'You are an expert at organizing educational content into clear, structured notes.'
    });

    // Track method used
    console.log(`Notes structured using: ${this.stats.lastMethod}`);
    return result;
  }

  /**
   * Set Gemini API key
   */
  async setGeminiApiKey(apiKey) {
    this.hybridConfig.geminiApiKey = apiKey;
    await chrome.storage.sync.set({ geminiApiKey: apiKey });
    console.log('✅ Gemini API key updated');
    this.logStatus();
  }

  /**
   * Enable/disable hybrid mode
   */
  async setHybridMode(enabled) {
    this.hybridConfig.enabled = enabled;
    await chrome.storage.sync.set({ hybridMode: enabled });
    console.log(`Hybrid mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Cleanup and destroy all sessions
   */
  async cleanup() {
    console.log('🧹 Cleaning up AI sessions...');
    
    try {
      if (this.sessions.prompt) {
        this.sessions.prompt.destroy();
        this.sessions.prompt = null;
      }
      
      // Reset other sessions
      Object.keys(this.sessions).forEach(key => {
        this.sessions[key] = null;
      });
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  /**
   * Get status of all AI capabilities
   */
  getStatus() {
    const builtInAvailable = this.isBuiltInAvailable();
    const geminiAvailable = !!this.hybridConfig.geminiApiKey;
    
    return {
      mode: 'hybrid-enhanced',
      capabilities: this.capabilities,
      hybridConfig: {
        enabled: this.hybridConfig.enabled,
        geminiConfigured: geminiAvailable,
        preferBuiltIn: this.hybridConfig.preferBuiltIn
      },
      stats: this.stats,
      activeSessions: Object.entries(this.sessions)
        .filter(([_, session]) => session !== null)
        .map(([name]) => name),
      recommendation: this.getRecommendation(builtInAvailable, geminiAvailable)
    };
  }

  /**
   * Get recommendation based on current status
   */
  getRecommendation(builtInAvailable, geminiAvailable) {
    if (builtInAvailable && geminiAvailable) {
      return '✅ Optimal: Both built-in AI and Gemini API available';
    } else if (builtInAvailable) {
      return '⚠️ Good: Built-in AI available, consider adding Gemini API for redundancy';
    } else if (geminiAvailable) {
      return '⚠️ Good: Using Gemini API fallback, Chrome AI not available';
    } else {
      return '❌ Limited: Using basic fallback, please configure Gemini API or enable Chrome AI';
    }
  }
}

// Export singleton instance
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIManagerEnhanced;
}

// Also make available globally for browser context
if (typeof window !== 'undefined') {
  window.AIManagerEnhanced = AIManagerEnhanced;
}