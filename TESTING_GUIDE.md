# StudySync AI Extension Testing Guide

## ✅ Current Status

### Fixed Issues:
1. **Chrome AI Model Not Downloading** ✅
   - Implemented Gemini API fallback system
   - Auto-prompts for API key when Chrome AI unavailable

2. **Gemini API Response Parsing** ✅
   - Added null checks for nested properties
   - Fixed "Cannot read properties of undefined" errors

3. **Content Script Communication** ✅
   - Fixed message type consistency (`OPEN_PANEL` → `open-panel`)
   - Added proper text passing to side panel

4. **Side Panel Integration** ✅
   - Added selected text retrieval on panel open
   - Implemented session and local storage fallback
   - Auto-loads selected text into input field

## 🧪 Testing Steps

### 1. Initial Setup
```bash
# 1. Open Chrome and navigate to:
chrome://extensions/

# 2. Enable Developer mode (toggle in top right)

# 3. Click "Load unpacked" and select the StudySync folder

# 4. Check that the extension loaded without errors
```

### 2. API Key Configuration

#### Test A: First-time Setup
1. Click the StudySync extension icon
2. You should see the API key setup page automatically open
3. Enter your Gemini API key
4. Click "Save and Continue"
5. Verify success message appears

#### Test B: Manual API Key Setup
1. Right-click the extension icon
2. Select "Options"
3. Navigate to API settings
4. Update/change your API key
5. Save changes

### 3. Text Selection Features

#### Test A: Floating Button
1. Navigate to any webpage with text
2. Select some text (more than 10 characters)
3. **Expected**: Small StudySync button appears near selection
4. Click the floating button
5. **Expected**: Side panel opens with selected text in input field

#### Test B: Context Menu
1. Select text on any webpage
2. Right-click the selected text
3. Navigate to "StudySync AI" menu
4. Choose any action (e.g., "Summarize")
5. **Expected**: Side panel opens with processing result

### 4. Side Panel Operations

#### Test A: Manual Input
1. Open side panel (click extension icon)
2. Go to "Input" tab
3. Enter or paste text
4. Select an action from dropdown
5. Click "Process"
6. **Expected**: Result appears in "Result" tab

#### Test B: Save and Retrieve
1. After getting a result, click "Save"
2. Go to "Saved" tab
3. **Expected**: Your saved result appears in the list
4. Click view icon to review
5. Click delete icon to remove

### 5. AI Features Testing

Test each feature with sample text:

```text
Sample Text: "Artificial intelligence is transforming how we interact with technology. 
Machine learning algorithms can now understand natural language, recognize images, 
and make predictions based on patterns in data."
```

#### Features to Test:
- **Summarize**: Should provide concise summary
- **Translate**: Should translate to selected language
- **Generate Questions**: Should create study questions
- **Create Flashcards**: Should generate Q&A pairs
- **Proofread**: Should check grammar/spelling
- **Explain Simply**: Should provide simple explanation

### 6. Keyboard Shortcuts

Test these shortcuts (if configured):
- `Alt+S`: Summarize selection
- `Alt+T`: Translate selection
- `Alt+Q`: Generate questions

## 🐛 Troubleshooting

### Issue: "Cannot read properties of undefined"
**Solution**: This has been fixed. If it persists:
1. Reload the extension
2. Clear Chrome storage: `chrome://settings/content/all`
3. Re-enter API key

### Issue: Side panel doesn't open
**Solution**: 
1. Check Chrome version (needs 114+)
2. Try fallback: Extension opens in new tab
3. Check console for errors: `chrome://extensions/` → Details → Inspect views

### Issue: No AI response
**Solution**:
1. Verify API key is saved
2. Check network connection
3. Test API key in test page: Open `test-gemini-working.html`
4. Check quota limits on Google AI Studio

### Issue: Text selection not detected
**Solution**:
1. Refresh the webpage
2. Check if content script is injected
3. Try on different website
4. Some sites (like Chrome Web Store) block extensions

## 📊 Verification Checklist

- [ ] Extension loads without errors
- [ ] API key setup page appears when needed
- [ ] Floating button appears on text selection
- [ ] Context menu items work
- [ ] Side panel opens and displays content
- [ ] All AI features return results
- [ ] Results can be saved and retrieved
- [ ] Export to markdown works
- [ ] Copy to clipboard works
- [ ] Settings are persisted

## 🚀 Performance Checks

1. **Response Time**: AI operations should complete within 2-5 seconds
2. **Memory Usage**: Check in Chrome Task Manager (`Shift+Esc`)
3. **Storage**: Verify saved materials persist across sessions
4. **Offline Mode**: Basic features should work without internet

## 📝 Test Log Template

```markdown
Date: [DATE]
Chrome Version: [VERSION]
Test Type: [FEATURE/BUG/PERFORMANCE]

Steps Taken:
1. 
2. 
3. 

Expected Result:

Actual Result:

Status: [PASS/FAIL]

Notes:
```

## 🎯 Next Steps

If all tests pass:
1. Package extension for submission
2. Create demo video showing all features
3. Document any known limitations
4. Prepare submission materials

If tests fail:
1. Check browser console for errors
2. Review error messages in extension logs
3. Verify API key and network connectivity
4. Report specific error messages for debugging

## 📧 Support

For hackathon-specific issues:
- Check the Discord channel
- Review the hackathon documentation
- Test with the provided examples

Remember: The deadline is November 1, 2025 @ 7:45am GMT+1