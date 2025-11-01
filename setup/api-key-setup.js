/**
 * API Key Setup Script
 * Handles the setup page functionality
 */

// Check if API key is already saved
window.addEventListener('load', () => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
        document.getElementById('api-key').value = savedKey;
        document.getElementById('status-card').className = 'status-card success';
        document.getElementById('status-card').innerHTML = 
            '<strong>✅ API Key Configured</strong>' +
            '<p style="margin-top: 10px;">You can update your key below or continue using StudySync.</p>';
    }
});

// Save API key
async function saveApiKey() {
    const apiKey = document.getElementById('api-key').value.trim();
    
    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }
    
    if (!apiKey.startsWith('AIza')) {
        if (!confirm('This doesn\'t look like a valid Gemini API key (should start with AIza). Continue anyway?')) {
            return;
        }
    }
    
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Verifying... <span class="loading"></span>';
    
    // Test the API key
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
        
        if (response.ok) {
            // Save to storage
            localStorage.setItem('geminiApiKey', apiKey);
            
            // Save to Chrome storage if available
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set({ 
                    geminiApiKey: apiKey,
                    geminiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
                });
            }
            
            // Show success
            document.getElementById('setup-form').style.display = 'none';
            document.getElementById('success-message').style.display = 'block';
            document.getElementById('status-card').style.display = 'none';
            
            // Notify parent window or extension
            if (window.opener) {
                window.opener.postMessage({ type: 'API_KEY_SAVED', apiKey }, '*');
            }
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({ type: 'API_KEY_SAVED', apiKey });
            }
        } else {
            const error = await response.json();
            throw new Error(error.error?.message || 'Invalid API key');
        }
    } catch (error) {
        alert(`Error: ${error.message}\n\nPlease check your API key and try again.`);
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save & Enable AI';
    }
}

// Skip setup
function skipSetup() {
    if (confirm('Without an API key, AI features won\'t work.\n\nAre you sure you want to skip?')) {
        closeSetup();
    }
}

// Close setup
function closeSetup() {
    if (window.opener) {
        window.close();
    } else if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Send message to close or navigate
        chrome.runtime.sendMessage({ type: 'SETUP_COMPLETE' });
        window.close();
    } else {
        // Redirect to main page
        window.location.href = '../popup/popup.html';
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Save button
    document.getElementById('save-btn').addEventListener('click', saveApiKey);
    
    // Skip button
    document.getElementById('skip-btn').addEventListener('click', skipSetup);
    
    // Close button (in success message)
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSetup);
    }
    
    // Handle Enter key
    document.getElementById('api-key').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });
});