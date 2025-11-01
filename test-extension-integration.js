/**
 * Test Script for StudySync Extension with Gemini API
 * Run this in your extension's background script or console
 */

// Your API Key
const GEMINI_API_KEY = 'AIzaSyAvl2p-wW20plRkb6EZgVCCgX-PuV1JK7o';

// Test Configuration
const config = {
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    testText: 'The Google Chrome Built-in AI Challenge 2025 is an exciting opportunity for developers.',
    operations: ['summarize', 'questions', 'explain']
};

// Color codes for console output
const colors = {
    success: 'color: #28a745; font-weight: bold;',
    error: 'color: #dc3545; font-weight: bold;',
    info: 'color: #007bff; font-weight: bold;',
    warning: 'color: #ffc107; font-weight: bold;'
};

// Main test function
async function runExtensionTests() {
    console.log('%c🚀 Starting StudySync Extension Tests', colors.info);
    console.log('API Key:', GEMINI_API_KEY.substring(0, 10) + '...');
    
    // Test 1: Check Chrome AI availability
    await testChromeAI();
    
    // Test 2: Test Gemini API
    await testGeminiAPI();
    
    // Test 3: Test storage
    await testStorage();
    
    // Test 4: Test hybrid system
    await testHybridSystem();
    
    console.log('%c✅ All tests completed!', colors.success);
    console.log('%c📋 Next steps: Integrate the hybrid AI manager into your extension', colors.info);
}

// Test Chrome built-in AI
async function testChromeAI() {
    console.log('\n%c📍 Test 1: Chrome Built-in AI', colors.info);
    
    try {
        if (typeof ai !== 'undefined' && ai.languageModel) {
            const capabilities = await ai.languageModel.capabilities();
            console.log('%c✅ Chrome AI detected', colors.success);
            console.log('Status:', capabilities.available);
            
            if (capabilities.available === 'readily') {
                console.log('%c✅ Chrome AI is ready to use!', colors.success);
                
                // Try a simple prompt
                try {
                    const session = await ai.languageModel.create();
                    const result = await session.prompt('Say hello');
                    console.log('Test prompt result:', result.substring(0, 50) + '...');
                    session.destroy();
                } catch (e) {
                    console.log('%c⚠️ Chrome AI available but session creation failed', colors.warning);
                }
            } else if (capabilities.available === 'after-download') {
                console.log('%c⚠️ Chrome AI needs model download', colors.warning);
                console.log('Visit chrome://components/ and check "Optimization Guide On Device Model"');
            } else {
                console.log('%c❌ Chrome AI not available', colors.error);
            }
        } else {
            console.log('%c❌ Chrome AI APIs not found', colors.error);
            console.log('This is expected if the model isn\'t downloaded - Gemini fallback will be used');
        }
    } catch (error) {
        console.log('%c❌ Chrome AI test failed:', colors.error, error.message);
    }
}

// Test Gemini API
async function testGeminiAPI() {
    console.log('\n%c📍 Test 2: Gemini API', colors.info);
    
    try {
        const response = await fetch(`${config.apiUrl}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Say "Hello StudySync" if this works'
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 50
                }
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('%c✅ Gemini API is working!', colors.success);
            console.log('Response:', data.candidates[0].content.parts[0].text);
        } else {
            console.log('%c❌ Gemini API error:', colors.error, data.error?.message);
            console.log('Full error:', data);
            
            // Provide solutions
            if (data.error?.message?.includes('API key not valid')) {
                console.log('%c💡 Solution:', colors.warning);
                console.log('1. Check if the key is correct');
                console.log('2. Regenerate at https://makersuite.google.com/app/apikey');
                console.log('3. Make sure Gemini API is enabled in your Google Cloud project');
            }
        }
    } catch (error) {
        console.log('%c❌ Network error:', colors.error, error.message);
        console.log('Check your internet connection and try again');
    }
}

// Test Chrome storage
async function testStorage() {
    console.log('\n%c📍 Test 3: Chrome Storage', colors.info);
    
    try {
        // Save API key
        await chrome.storage.sync.set({ 
            geminiApiKey: GEMINI_API_KEY,
            hybridMode: true 
        });
        console.log('%c✅ API key saved to storage', colors.success);
        
        // Read it back
        const result = await chrome.storage.sync.get(['geminiApiKey', 'hybridMode']);
        console.log('Storage contents:', {
            hasApiKey: !!result.geminiApiKey,
            hybridMode: result.hybridMode
        });
        
        console.log('%c✅ Storage working correctly', colors.success);
    } catch (error) {
        console.log('%c❌ Storage test failed:', colors.error, error.message);
        console.log('Make sure this is running in an extension context');
    }
}

// Test hybrid system
async function testHybridSystem() {
    console.log('\n%c📍 Test 4: Hybrid AI System', colors.info);
    
    // Create a simple hybrid processor
    class SimpleHybridAI {
        async process(text, operation) {
            const methods = [
                { name: 'Chrome AI', fn: () => this.useChromeAI(text, operation) },
                { name: 'Gemini API', fn: () => this.useGeminiAPI(text, operation) },
                { name: 'Basic Fallback', fn: () => this.useBasicFallback(text, operation) }
            ];
            
            for (const method of methods) {
                try {
                    console.log(`Trying ${method.name}...`);
                    const result = await method.fn();
                    console.log(`%c✅ Success with ${method.name}`, colors.success);
                    return { result, method: method.name };
                } catch (error) {
                    console.log(`%c⚠️ ${method.name} failed:`, colors.warning, error.message);
                }
            }
            
            throw new Error('All methods failed');
        }
        
        async useChromeAI(text, operation) {
            if (typeof ai === 'undefined') throw new Error('Chrome AI not available');
            
            const session = await ai.languageModel.create();
            const result = await session.prompt(`${operation}: ${text}`);
            session.destroy();
            return result;
        }
        
        async useGeminiAPI(text, operation) {
            const prompts = {
                summarize: `Summarize in one sentence: ${text}`,
                questions: `Generate 2 questions about: ${text}`,
                explain: `Explain simply: ${text}`
            };
            
            const response = await fetch(`${config.apiUrl}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompts[operation] || text }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Gemini API failed');
            }
            
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        }
        
        useBasicFallback(text, operation) {
            const responses = {
                summarize: `Summary: ${text.substring(0, 50)}...`,
                questions: '1. What is the main topic?\n2. Why is this important?',
                explain: `This text is about: ${text.substring(0, 30)}...`
            };
            return responses[operation] || 'Basic processing completed';
        }
    }
    
    // Test the hybrid system
    const hybrid = new SimpleHybridAI();
    
    try {
        const result = await hybrid.process(config.testText, 'summarize');
        console.log('%c✅ Hybrid system working!', colors.success);
        console.log(`Used method: ${result.method}`);
        console.log(`Result: ${result.result.substring(0, 100)}...`);
    } catch (error) {
        console.log('%c❌ Hybrid system test failed:', colors.error, error.message);
    }
}

// Helper function to test specific operations
async function testOperation(operation, text = config.testText) {
    console.log(`\n%c📍 Testing ${operation}`, colors.info);
    
    const prompts = {
        summarize: `Summarize this text: ${text}`,
        translate: `Translate to Spanish: ${text}`,
        questions: `Generate 3 study questions from: ${text}`,
        flashcards: `Create 2 flashcards from: ${text}`,
        proofread: `Proofread: ${text}`,
        explain: `Explain simply: ${text}`
    };
    
    try {
        const response = await fetch(`${config.apiUrl}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompts[operation] }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`%c✅ ${operation} successful`, colors.success);
            console.log('Result:', data.candidates[0].content.parts[0].text);
            return data.candidates[0].content.parts[0].text;
        } else {
            console.log(`%c❌ ${operation} failed:`, colors.error, data.error?.message);
            return null;
        }
    } catch (error) {
        console.log(`%c❌ ${operation} error:`, colors.error, error.message);
        return null;
    }
}

// Quick test function for console
window.testStudySync = {
    runAll: runExtensionTests,
    testChrome: testChromeAI,
    testGemini: testGeminiAPI,
    testStorage: testStorage,
    testHybrid: testHybridSystem,
    testOp: testOperation,
    
    // Quick operation tests
    summarize: (text) => testOperation('summarize', text),
    questions: (text) => testOperation('questions', text),
    explain: (text) => testOperation('explain', text),
    flashcards: (text) => testOperation('flashcards', text),
    
    // API key management
    setApiKey: async (key) => {
        await chrome.storage.sync.set({ geminiApiKey: key });
        console.log('%c✅ API key updated', colors.success);
    },
    
    getApiKey: async () => {
        const result = await chrome.storage.sync.get('geminiApiKey');
        console.log('Current API key:', result.geminiApiKey?.substring(0, 10) + '...');
        return result.geminiApiKey;
    }
};

// Instructions
console.log('%c=== StudySync Extension Test Suite ===', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%cHow to use:', colors.info);
console.log('1. Run all tests: testStudySync.runAll()');
console.log('2. Test Chrome AI: testStudySync.testChrome()');
console.log('3. Test Gemini API: testStudySync.testGemini()');
console.log('4. Test summarization: testStudySync.summarize("your text")');
console.log('5. Test questions: testStudySync.questions("your text")');
console.log('\n%cYour API Key is already configured in this script', colors.success);
console.log('To start, run: testStudySync.runAll()');

// Auto-run if in extension context
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    console.log('\n%c🚀 Auto-running tests in 2 seconds...', colors.warning);
    setTimeout(() => {
        runExtensionTests().catch(console.error);
    }, 2000);
}