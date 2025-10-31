# 🧪 Testing Guide for StudySync AI

## Prerequisites

Before testing, ensure you have:

1. ✅ Google Chrome Canary or Dev Channel installed
2. ✅ Chrome Built-in AI APIs enabled (see README.md)
3. ✅ Extension loaded in developer mode
4. ✅ AI model downloaded (check chrome://components/)

## Quick Test Checklist

### Installation Test
- [ ] Extension icon appears in toolbar
- [ ] No console errors on load
- [ ] Welcome page opens on first install
- [ ] Settings page accessible

### AI Capabilities Test
- [ ] Popup shows "AI Ready" status
- [ ] No "AI Not Available" errors
- [ ] All 6 APIs detected (check console)

### Core Features Test

#### 1. Summarization
- [ ] Select text on a webpage
- [ ] Right-click → StudySync AI → Summarize
- [ ] Summary appears in side panel
- [ ] Summary is accurate and concise
- [ ] Different lengths work (short/medium/long)
- [ ] Works with full page content

#### 2. Translation
- [ ] Select text to translate
- [ ] Right-click → StudySync AI → Translate
- [ ] Translation appears correctly
- [ ] Target language setting respected
- [ ] Multiple languages work

#### 3. Question Generation
- [ ] Select educational content
- [ ] Right-click → StudySync AI → Generate Questions
- [ ] Questions are relevant
- [ ] Number of questions matches settings
- [ ] Difficulty level appropriate

#### 4. Flashcard Creation
- [ ] Select content with facts/definitions
- [ ] Right-click → StudySync AI → Create Flashcards
- [ ] Flashcards formatted as Q: A:
- [ ] Content is appropriate

#### 5. Proofreading
- [ ] Select text with errors
- [ ] Right-click → StudySync AI → Proofread
- [ ] Errors are corrected
- [ ] Meaning preserved

#### 6. Explanation
- [ ] Select complex text
- [ ] Right-click → StudySync AI → Explain Simply
- [ ] Explanation is simpler
- [ ] Key concepts covered

### UI Components Test

#### Popup
- [ ] Opens when clicking extension icon
- [ ] All action buttons visible
- [ ] Selected text preview shows
- [ ] Custom input works
- [ ] Settings button opens options
- [ ] Stats display correctly

#### Side Panel
- [ ] Opens via context menu action
- [ ] Opens via popup button
- [ ] Tabs switch correctly (Result/Saved/Input)
- [ ] Results display properly
- [ ] Original text can be shown/hidden
- [ ] Copy, save, export buttons work
- [ ] Saved materials list loads
- [ ] Delete saved items works

#### Options Page
- [ ] All settings save correctly
- [ ] Reset to defaults works
- [ ] Statistics display correctly
- [ ] Theme selection works
- [ ] Toggle switches work

### Keyboard Shortcuts Test
- [ ] Ctrl+Shift+S summarizes selection
- [ ] Ctrl+Shift+T translates selection
- [ ] Ctrl+Shift+Q generates questions
- [ ] Shortcuts work on Mac (Cmd instead of Ctrl)

### Storage Test
- [ ] Settings persist after reload
- [ ] Saved materials persist
- [ ] Statistics update correctly
- [ ] Auto-save works if enabled
- [ ] Manual save works

### Error Handling Test
- [ ] No text selected → Shows helpful message
- [ ] AI API unavailable → Shows error message
- [ ] Network offline → Still works (on-device)
- [ ] Long text → Handles gracefully
- [ ] Invalid input → Doesn't crash

### Performance Test
- [ ] Popup loads quickly (<500ms)
- [ ] Side panel loads quickly
- [ ] AI responses within 3 seconds
- [ ] No memory leaks (check Task Manager)
- [ ] Smooth animations

### Cross-Site Test

Test on various websites:
- [ ] News sites (articles)
- [ ] Wikipedia (educational)
- [ ] GitHub (technical)
- [ ] Medium (blog posts)
- [ ] YouTube (with captions)
- [ ] PDF viewer
- [ ] Local HTML files

### Edge Cases

- [ ] Very long text (>10,000 characters)
- [ ] Very short text (<10 characters)
- [ ] Special characters and emojis
- [ ] Multiple languages mixed
- [ ] Code snippets
- [ ] Tables and structured data
- [ ] Images (should ignore gracefully)

## Automated Testing

### Console Checks

Open DevTools (F12) and check for:

```javascript
// No errors in:
- Background service worker console
- Popup console
- Content script console
- Side panel console
- Options page console
```

### Manual API Tests

Test each API individually in console:

```javascript
// Test in background service worker console
const aiManager = new AIManager();
await aiManager.initialize();
console.log(aiManager.getStatus());

// Test summarization
const summary = await aiManager.summarize("Your text here");
console.log(summary);

// Test translation
const translation = await aiManager.translate("Hello", "es", "en");
console.log(translation);
```

## Bug Reporting Template

When you find a bug, report with:

```
**Bug Description:**
Clear description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Chrome Version: 
- OS: 
- Extension Version: 
- AI Model Version: 

**Console Errors:**
(Paste any errors from console)

**Screenshots:**
(If applicable)
```

## Performance Benchmarks

Expected performance metrics:

| Operation | Time | Notes |
|-----------|------|-------|
| Extension Load | <500ms | First load |
| Popup Open | <200ms | Subsequent |
| AI Initialize | <1s | First time |
| Summarize (500 words) | 1-2s | On-device |
| Translate (100 words) | 1-2s | On-device |
| Generate Questions | 2-3s | Complex |
| Memory Usage | <100MB | With model loaded |

## Testing for Hackathon Submission

### Requirement Checklist

- [ ] Uses Chrome Built-in AI APIs ✅
- [ ] New project (not reused from 2024) ✅
- [ ] Includes text description ✅
- [ ] Demo video (<3 minutes) ⏳
- [ ] Public GitHub repository ✅
- [ ] Open source license ✅
- [ ] Working demo accessible ✅
- [ ] Instructions included ✅

### Demo Video Checklist

Record a video showing:

1. [ ] Extension installation
2. [ ] AI capability check
3. [ ] Summarize feature demo
4. [ ] Translation demo
5. [ ] Question generation demo
6. [ ] Flashcard creation demo
7. [ ] Side panel navigation
8. [ ] Settings configuration
9. [ ] Offline capability
10. [ ] Privacy benefits

### Documentation Checklist

- [ ] README.md complete
- [ ] CONTRIBUTING.md present
- [ ] LICENSE file included
- [ ] API usage documented
- [ ] Installation steps clear
- [ ] Screenshots/GIFs included
- [ ] Architecture explained

## Final Checks Before Submission

1. [ ] All code commented properly
2. [ ] No console.log statements (or minimal)
3. [ ] No TODO comments unresolved
4. [ ] All features working
5. [ ] No critical bugs
6. [ ] Performance acceptable
7. [ ] Icons present
8. [ ] README complete
9. [ ] Demo video uploaded
10. [ ] GitHub repo public

## Support & Questions

If you encounter issues during testing:

1. Check chrome://extensions/ for errors
2. Check service worker console for messages
3. Verify AI model is downloaded (chrome://components/)
4. Try reloading the extension
5. Try restarting Chrome

---

Happy Testing! 🚀
