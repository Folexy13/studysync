/**
 * AI Manager - Centralized handler for Chrome Built-in AI APIs
 * Handles initialization, capability checks, and error recovery
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
  }

  /**
   * Initialize and check all AI capabilities
   */
  async initialize() {
    console.log('🚀 Initializing AI Manager...');
    
    try {
      await this.checkCapabilities();
      console.log('✅ AI Manager initialized successfully');
      return this.capabilities;
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
   * Generate text using Prompt API
   */
  async prompt(text, options = {}) {
    const session = await this.getPromptSession(options);
    
    try {
      const result = await session.prompt(text);
      return result;
    } catch (error) {
      console.error('❌ Prompt API error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
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
    if (!this.capabilities.summarizer || this.capabilities.summarizer.available !== 'readily') {
      // Fallback to Prompt API
      console.warn('⚠️ Summarizer API not available, using Prompt API fallback');
      return await this.prompt(
        `Please summarize the following text concisely:\n\n${text}`,
        { systemPrompt: 'You are a text summarization assistant.' }
      );
    }

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
      console.error('❌ Summarizer API error:', error);
      throw new Error(`Failed to summarize: ${error.message}`);
    }
  }

  /**
   * Generate text using Writer API
   */
  async write(prompt, options = {}) {
    if (!this.capabilities.writer || this.capabilities.writer.available !== 'readily') {
      // Fallback to Prompt API
      console.warn('⚠️ Writer API not available, using Prompt API fallback');
      return await this.prompt(prompt, { 
        systemPrompt: 'You are a creative writing assistant.'
      });
    }

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
      console.error('❌ Writer API error:', error);
      throw new Error(`Failed to write: ${error.message}`);
    }
  }

  /**
   * Rewrite text using Rewriter API
   */
  async rewrite(text, options = {}) {
    if (!this.capabilities.rewriter || this.capabilities.rewriter.available !== 'readily') {
      // Fallback to Prompt API
      console.warn('⚠️ Rewriter API not available, using Prompt API fallback');
      return await this.prompt(
        `Please rewrite the following text in a ${options.tone || 'neutral'} tone:\n\n${text}`,
        { systemPrompt: 'You are a text rewriting assistant.' }
      );
    }

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
      console.error('❌ Rewriter API error:', error);
      throw new Error(`Failed to rewrite: ${error.message}`);
    }
  }

  /**
   * Proofread and fix grammar using Rewriter API
   */
  async proofread(text) {
    try {
      // Use rewriter with neutral tone for proofreading
      return await this.rewrite(text, { 
        tone: 'neutral',
        format: 'as-is',
        length: 'as-is'
      });
    } catch (error) {
      console.error('❌ Proofreader error:', error);
      throw new Error(`Failed to proofread: ${error.message}`);
    }
  }

  /**
   * Translate text using Translator API
   */
  async translate(text, targetLanguage, sourceLanguage = 'en') {
    if (!this.capabilities.translator) {
      // Fallback to Prompt API
      console.warn('⚠️ Translator API not available, using Prompt API fallback');
      return await this.prompt(
        `Translate the following text to ${targetLanguage}:\n\n${text}`,
        { systemPrompt: 'You are a professional translator.' }
      );
    }

    try {
      const canTranslate = await globalScope.translation.canTranslate({
        sourceLanguage,
        targetLanguage
      });

      if (canTranslate === 'no') {
        throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} is not supported`);
      }

      if (canTranslate === 'after-download') {
        console.log('⏳ Downloading translation model...');
      }

      const translator = await globalScope.translation.createTranslator({
        sourceLanguage,
        targetLanguage
      });

      const result = await translator.translate(text);
      
      return result;
    } catch (error) {
      console.error('❌ Translator API error:', error);
      throw new Error(`Failed to translate: ${error.message}`);
    }
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
      capabilities: this.capabilities,
      activeSessions: Object.entries(this.sessions)
        .filter(([_, session]) => session !== null)
        .map(([name]) => name)
    };
  }
}

// Export singleton instance
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIManager;
}
