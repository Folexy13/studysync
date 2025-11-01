/**
 * Modal Prompt System for API Key Input
 * Creates an in-extension modal for seamless user experience
 */

class ModalPrompt {
  constructor() {
    this.modalContainer = null;
    this.resolvePromise = null;
  }

  /**
   * Show modal prompt for API key
   */
  async promptForApiKey() {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.createModal();
    });
  }

  /**
   * Create and show the modal
   */
  createModal() {
    // Remove any existing modal
    this.removeModal();

    // Create modal container
    this.modalContainer = document.createElement('div');
    this.modalContainer.id = 'studysync-modal';
    this.modalContainer.innerHTML = `
      <style>
        #studysync-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          margin-bottom: 20px;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0 0 10px 0;
        }

        .modal-subtitle {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        .modal-body {
          margin: 20px 0;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 500;
          font-size: 14px;
        }

        .api-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          font-family: monospace;
          transition: border-color 0.3s;
        }

        .api-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .api-input.error {
          border-color: #dc3545;
        }

        .error-message {
          color: #dc3545;
          font-size: 13px;
          margin-top: 5px;
          display: none;
        }

        .error-message.show {
          display: block;
        }

        .help-text {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #555;
        }

        .help-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .help-link:hover {
          text-decoration: underline;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .modal-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5a67d8;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }

        .loading-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>

      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">🔑 AI Setup Required</h2>
          <p class="modal-subtitle">
            Chrome's built-in AI is not available. Configure Gemini API to enable AI features.
          </p>
        </div>

        <div class="modal-body">
          <div class="help-text">
            📌 <strong>Quick Setup:</strong><br>
            1. Get your free API key from 
            <a href="https://makersuite.google.com/app/apikey" target="_blank" class="help-link">Google AI Studio</a><br>
            2. Paste it below (starts with AIza...)<br>
            3. Click Save to enable all AI features
          </div>

          <div class="input-group">
            <label class="input-label" for="api-key-input">Gemini API Key</label>
            <input 
              type="text" 
              id="api-key-input" 
              class="api-input" 
              placeholder="AIza..."
              autocomplete="off"
            >
            <div class="error-message" id="error-message"></div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-btn btn-secondary" id="skip-btn">Skip for Now</button>
          <button class="modal-btn btn-primary" id="save-btn">
            Save & Enable AI
          </button>
        </div>
      </div>
    `;

    // Add to page
    document.body.appendChild(this.modalContainer);

    // Add event listeners
    this.setupEventListeners();

    // Focus input
    setTimeout(() => {
      document.getElementById('api-key-input').focus();
    }, 100);
  }

  /**
   * Setup event listeners for modal
   */
  setupEventListeners() {
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-btn');
    const skipBtn = document.getElementById('skip-btn');
    const errorMsg = document.getElementById('error-message');

    // Save button click
    saveBtn.addEventListener('click', async () => {
      const apiKey = input.value.trim();
      
      if (!apiKey) {
        this.showError('Please enter your API key');
        return;
      }

      if (!apiKey.startsWith('AIza')) {
        this.showError('Invalid API key format (should start with AIza...)');
        return;
      }

      // Disable button and show loading
      saveBtn.disabled = true;
      saveBtn.innerHTML = 'Validating<span class="loading-spinner"></span>';

      try {
        // Validate API key
        const isValid = await this.validateApiKey(apiKey);
        
        if (isValid) {
          // Save to storage
          await chrome.storage.sync.set({ 
            geminiApiKey: apiKey,
            geminiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
          });

          // Resolve with API key
          this.removeModal();
          if (this.resolvePromise) {
            this.resolvePromise(apiKey);
          }
        } else {
          this.showError('Invalid API key. Please check and try again.');
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Save & Enable AI';
        }
      } catch (error) {
        this.showError('Error validating API key: ' + error.message);
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save & Enable AI';
      }
    });

    // Skip button click
    skipBtn.addEventListener('click', () => {
      this.removeModal();
      if (this.resolvePromise) {
        this.resolvePromise(null);
      }
    });

    // Enter key in input
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
    });

    // Clear error on input
    input.addEventListener('input', () => {
      input.classList.remove('error');
      errorMsg.classList.remove('show');
    });

    // Click outside to close
    this.modalContainer.addEventListener('click', (e) => {
      if (e.target === this.modalContainer) {
        skipBtn.click();
      }
    });
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }]
          })
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('API validation error:', error);
      return false;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const input = document.getElementById('api-key-input');
    const errorMsg = document.getElementById('error-message');
    
    input.classList.add('error');
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
  }

  /**
   * Remove modal from DOM
   */
  removeModal() {
    if (this.modalContainer && this.modalContainer.parentNode) {
      this.modalContainer.parentNode.removeChild(this.modalContainer);
      this.modalContainer = null;
    }
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalPrompt;
}