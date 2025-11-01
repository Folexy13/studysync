/**
 * AI Manager - Hybrid handler for Chrome Built-in AI and Gemini API
 * Supports multimodal features with automatic fallback
 */

// Use globalThis for cross-context compatibility (works in both service workers and pages)
const globalScope = typeof globalThis !== 'undefined' ? globalThis : self;

class AIManager {
  constructor() {
    this.capabilities = {
      prompt: null,
      summarizer: null,
      writer: null,
      rewriter: null,
      translator: null,
      proofreader: null,
      multimodal: false // Track multimodal support
    };
    
    this.sessions = {
      prompt: null,
      summarizer: null,
      writer: null,
      rewriter: null,
      translator: null,
      proofreader: null
    };
    
    // Gemini API configuration for fallback
    this.geminiConfig = {
      apiKey: null,
      endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',
      model: 'gemini-2.5-flash',
      enabled: true
    };
    
    // Track which method is being used
    this.currentMethod = 'checking';
  }

  /**
   * Initialize and check all AI capabilities
   */
  async initialize() {
    console.log('🚀 Initializing Hybrid AI Manager with Multimodal Support...');
    
    try {
      // Check Chrome built-in AI
      await this.checkCapabilities();
      
      // Load Gemini API configuration
      await this.loadGeminiConfig();
      
      // Determine which method to use
      this.determineMethod();
      
      // If no AI method is available, prompt for API key
      if (this.currentMethod === 'none') {
        await this.promptForApiKey();
      }
      
      console.log(`✅ AI Manager initialized (Method: ${this.currentMethod})`);
      return this.capabilities;
    } catch (error) {
      console.error('❌ AI Manager initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Prompt user for Gemini API key when no AI is available
   */
  async promptForApiKey() {
    console.log('🔑 No AI method available, prompting for API key...');
    
    // In service worker context, open the setup page
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      // We're in the service worker
      try {
        await chrome.tabs.create({
          url: chrome.runtime.getURL('setup/api-key-setup.html')
        });
      } catch (error) {
        console.error('Error opening setup page:', error);
      }
      return null;
    }
    
    // In content script or popup context, try to use modal
    if (typeof document !== 'undefined') {
      try {
        // Dynamically import modal prompt
        const ModalPrompt = (await import('./modal-prompt.js')).default || window.ModalPrompt;
        const modal = new ModalPrompt();
        const apiKey = await modal.promptForApiKey();
        
        if (apiKey) {
          await this.setGeminiApiKey(apiKey);
          console.log('✅ API key saved via modal!');
          return apiKey;
        }
      } catch (error) {
        console.error('Error showing modal:', error);
      }
    }
    
    return null;
  }
  
  /**
   * Load Gemini API configuration from storage
   */
  async loadGeminiConfig() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['geminiApiKey', 'geminiEndpoint']);
        if (result.geminiApiKey) {
          this.geminiConfig.apiKey = result.geminiApiKey;
          this.geminiConfig.endpoint = result.geminiEndpoint || this.geminiConfig.endpoint;
          console.log('✅ Gemini API configured for multimodal fallback');
          this.capabilities.multimodal = true;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load Gemini config:', error);
    }
  }
  
  /**
   * Determine which AI method to use
   */
  determineMethod() {
    const hasBuiltInAI = this.capabilities.prompt?.available === 'readily';
    const hasGeminiAPI = !!this.geminiConfig.apiKey;
    
    if (hasBuiltInAI) {
      this.currentMethod = 'chrome-ai';
    } else if (hasGeminiAPI) {
      this.currentMethod = 'gemini-api';
    } else {
      this.currentMethod = 'none';
    }
    
    console.log(`🎯 Using method: ${this.currentMethod}`);
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

    // Check Proofreader API (part of rewriter with tone)
    if (globalScope.ai && globalScope.ai.rewriter) {
      this.capabilities.proofreader = this.capabilities.rewriter;
    }

    return this.capabilities;
  }

  /**
   * Create or get Prompt API session with multimodal support
   */
  async getPromptSession(options = {}) {
    if (!this.capabilities.prompt || this.capabilities.prompt.available !== 'readily') {
      throw new Error('Prompt API is not available. Please enable Chrome AI features.');
    }

    try {
      // Create new session if needed
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
      throw new Error(`Prompt API error: ${error.message}`);
    }
  }

  /**
   * Generate text using Prompt API with Gemini fallback
   */
  async prompt(text, options = {}) {
    // Try Chrome built-in AI first
    if (this.currentMethod === 'chrome-ai') {
      try {
        const session = await this.getPromptSession(options);
        const result = await session.prompt(text);
        return result;
      } catch (error) {
        console.warn('⚠️ Chrome AI failed, trying Gemini:', error);
        if (this.geminiConfig.apiKey) {
          return await this.geminiPrompt(text, options);
        }
        // Chrome AI failed and no Gemini key, prompt for it
        await this.promptForApiKey();
        if (this.geminiConfig.apiKey) {
          return await this.geminiPrompt(text, options);
        }
        throw error;
      }
    }
    
    // Use Gemini API if available
    if (this.geminiConfig.apiKey) {
      return await this.geminiPrompt(text, options);
    }
    
    // No API key available, prompt for it
    await this.promptForApiKey();
    if (this.geminiConfig.apiKey) {
      return await this.geminiPrompt(text, options);
    }
    
    throw new Error('AI features require Gemini API key. Please configure in extension settings.');
  }
  
  /**
   * Multimodal prompt with image support (Gemini only)
   */
  async promptWithImage(text, imageData, options = {}) {
    if (!this.geminiConfig.apiKey) {
      await this.promptForApiKey();
      if (!this.geminiConfig.apiKey) {
        throw new Error('Multimodal features require Gemini API. Please configure API key.');
      }
    }
    
    console.log('🖼️ Processing multimodal request with image...');
    
    try {
      const response = await fetch(`${this.geminiConfig.endpoint}?key=${this.geminiConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: text },
              {
                inline_data: {
                  mime_type: imageData.mimeType || 'image/jpeg',
                  data: imageData.base64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 1024
          }
        })
      });
      
      const data = await response.json();
      
      // Log the full response for debugging
      console.log('📊 Gemini Multimodal Response:', JSON.stringify(data, null, 2));
      
      if (response.ok && data.candidates?.length > 0) {
        // Safely access nested properties with null checks
        const candidate = data.candidates[0];
        if (candidate?.content?.parts?.length > 0) {
          const text = candidate.content.parts[0].text;
          if (text) {
            console.log('✅ Gemini multimodal text found:', text.substring(0, 100) + '...');
            return text;
          }
        }
        
        console.error('❌ Unexpected multimodal response structure:', data);
        throw new Error('Invalid response structure from Gemini API');
      } else {
        console.error('❌ Gemini multimodal error:', data);
        throw new Error(data.error?.message || 'Multimodal request failed');
      }
    } catch (error) {
      console.error('❌ Multimodal error:', error);
      throw error;
    }
  }
  
  /**
   * Gemini API prompt fallback
   */
  async geminiPrompt(text, options = {}) {
    console.log('🌟 Using Gemini API...');
    
    try {
      const response = await fetch(`${this.geminiConfig.endpoint}?key=${this.geminiConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: options.systemPrompt ? `${options.systemPrompt}\n\n${text}` : text
            }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 1024
          }
        })
      });
      
      const data = await response.json();
      
      // Log the full response for debugging
      console.log('📊 Gemini API Response:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        // Check multiple possible response structures
        if (data.candidates?.length > 0) {
          const candidate = data.candidates[0];
          
          // Try different paths for the text
          if (candidate?.content?.parts?.length > 0) {
            const text = candidate.content.parts[0].text;
            if (text) {
              console.log('✅ Gemini response text found:', text.substring(0, 100) + '...');
              return text;
            }
          }
          
          // Alternative structure
          if (candidate?.output) {
            console.log('✅ Gemini response output found:', candidate.output.substring(0, 100) + '...');
            return candidate.output;
          }
        }
        
        // Log the structure for debugging
        console.error('❌ Unexpected Gemini response structure:', {
          hasData: !!data,
          hasCandidates: !!data.candidates,
          candidatesLength: data.candidates?.length,
          firstCandidate: data.candidates?.[0],
          structure: Object.keys(data)
        });
        
        throw new Error('Invalid response structure from Gemini API - check console for details');
      } else {
        console.error('❌ Gemini API error response:', data);
        throw new Error(data.error?.message || `Gemini API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Stream text generation using Prompt API
   */
  async promptStreaming(text, onChunk, options = {}) {
    const session = await this.getPromptSession(options);
    
    try {
      const stream = await session.promptStreaming(text);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse = chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('❌ Prompt API streaming error:', error);
      throw new Error(`Failed to stream response: ${error.message}`);
    }
  }

  /**
   * Summarize text using Summarizer API
   */
  async summarize(text, options = {}) {
    // Try Chrome built-in summarizer if available
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
        
        return summary;
      } catch (error) {
        console.warn('⚠️ Built-in summarizer failed, using fallback:', error);
      }
    }
    
    // Fallback to Gemini/prompt-based summarization
    const lengthPrompt = {
      'short': 'in 2-3 sentences',
      'medium': 'in a paragraph',
      'long': 'in detail with key points'
    }[options.length || 'medium'];
    
    return await this.prompt(
      `Summarize the following text ${lengthPrompt}:\n\n${text}`,
      { systemPrompt: 'You are a concise text summarization assistant. Provide clear, accurate summaries.' }
    );
  }

  /**
   * Generate text using Writer API
   */
  async write(prompt, options = {}) {
    // Try Chrome Writer API if available
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
        
        return result;
      } catch (error) {
        console.warn('⚠️ Writer API failed, using fallback:', error);
      }
    }
    
    // Fallback to Gemini/Prompt API
    const toneInstructions = {
      'formal': 'Use formal, professional language',
      'casual': 'Use casual, conversational language',
      'neutral': 'Use clear, neutral language'
    }[options.tone || 'neutral'];
    
    return await this.prompt(prompt, {
      systemPrompt: `You are a creative writing assistant. ${toneInstructions}. Generate engaging, original content.`
    });
  }

  /**
   * Rewrite text using Rewriter API
   */
  async rewrite(text, options = {}) {
    // Try Chrome Rewriter API if available
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
        
        return result;
      } catch (error) {
        console.warn('⚠️ Rewriter API failed, using fallback:', error);
      }
    }
    
    // Fallback to Gemini/Prompt API
    const instructions = [];
    if (options.tone && options.tone !== 'as-is') {
      instructions.push(`tone: ${options.tone}`);
    }
    if (options.length && options.length !== 'as-is') {
      instructions.push(`length: ${options.length}`);
    }
    
    const instructionText = instructions.length > 0
      ? `Rewrite with ${instructions.join(', ')}`
      : 'Rewrite to improve clarity and flow';
    
    return await this.prompt(
      `${instructionText}:\n\n${text}`,
      { systemPrompt: 'You are a professional text rewriting assistant. Maintain the original meaning while improving the text.' }
    );
  }

  /**
   * Proofread and fix grammar using Rewriter API
   */
  async proofread(text) {
    // Try Chrome Rewriter API for proofreading
    if (this.capabilities.rewriter?.available === 'readily') {
      try {
        return await this.rewrite(text, {
          tone: 'neutral',
          format: 'as-is',
          length: 'as-is'
        });
      } catch (error) {
        console.warn('⚠️ Proofreader failed, using fallback:', error);
      }
    }
    
    // Fallback to Gemini for grammar correction
    return await this.prompt(
      `Proofread and correct any grammar, spelling, or punctuation errors in the following text. Return the corrected version:\n\n${text}`,
      { systemPrompt: 'You are a professional proofreader. Fix errors while maintaining the original style and meaning.' }
    );
  }

  /**
   * Translate text using Translator API
   */
  async translate(text, targetLanguage, sourceLanguage = 'en') {
    // Try Chrome Translator API if available
    if (this.capabilities.translator && globalScope.translation) {
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
          return result;
        }
      } catch (error) {
        console.warn('⚠️ Translator API failed, using fallback:', error);
      }
    }
    
    // Fallback to Gemini for translation
    const langNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese'
    };
    
    const targetLang = langNames[targetLanguage] || targetLanguage;
    const sourceLang = langNames[sourceLanguage] || sourceLanguage;
    
    return await this.prompt(
      `Translate the following text from ${sourceLang} to ${targetLang}. Provide only the translation without any explanations:\n\n${text}`,
      { systemPrompt: 'You are a professional translator. Provide accurate, natural-sounding translations.' }
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

    return await this.prompt(prompt, {
      systemPrompt: 'You are an educational assessment expert who creates effective study questions.'
    });
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

    return await this.prompt(prompt, {
      systemPrompt: 'You are an educational content creator specializing in flashcard creation.'
    });
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

    return await this.prompt(prompt, {
      systemPrompt: 'You are an expert at organizing educational content into clear, structured notes.'
    });
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
      
      // Other session cleanups as needed
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  /**
   * Get status of all AI capabilities
   */
  getStatus() {
    return {
      method: this.currentMethod,
      capabilities: this.capabilities,
      multimodal: this.capabilities.multimodal,
      geminiConfigured: !!this.geminiConfig.apiKey,
      activeSessions: Object.entries(this.sessions)
        .filter(([_, session]) => session !== null)
        .map(([name]) => name)
    };
  }
  
  /**
   * Set Gemini API key for multimodal support
   */
  async setGeminiApiKey(apiKey) {
    this.geminiConfig.apiKey = apiKey;
    this.capabilities.multimodal = true;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.sync.set({
        geminiApiKey: apiKey,
        geminiEndpoint: this.geminiConfig.endpoint
      });
    }
    
    this.determineMethod();
    console.log('✅ Gemini API key set - multimodal features enabled');
  }
  
  /**
   * Process image for multimodal input
   */
  async processImage(imageUrl) {
    return new Promise((resolve, reject) => {
      if (imageUrl.startsWith('data:')) {
        // Already base64
        const [header, base64] = imageUrl.split(',');
        const mimeType = header.match(/data:([^;]+)/)[1];
        resolve({ base64, mimeType });
      } else {
        // Convert URL to base64
        fetch(imageUrl)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result.split(',')[1];
              resolve({ base64, mimeType: blob.type });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      }
    });
  }
  
  /**
   * Analyze image with AI
   */
  async analyzeImage(imageUrl, prompt = 'What is in this image?') {
    const imageData = await this.processImage(imageUrl);
    return await this.promptWithImage(prompt, imageData);
  }
}

// Export singleton instance
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIManager;
}
