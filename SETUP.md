# 🚀 Quick Setup Guide - StudySync AI

## Step 1: Enable Chrome Built-in AI

**Time Required: 5-10 minutes**

### 1.1 Install Chrome Canary or Dev

Download from: https://www.google.com/chrome/canary/ or https://www.google.com/chrome/dev/

### 1.2 Enable AI Features

1. Open Chrome and navigate to flags:

```
chrome://flags/#optimization-guide-on-device-model
```

2. Set to: **Enabled BypassPerfRequirement**

3. Navigate to:

```
chrome://flags/#prompt-api-for-gemini-nano
```

4. Set to: **Enabled**

5. Navigate to:

```
chrome://flags/#summarization-api-for-gemini-nano
```

6. Set to: **Enabled**

7. Navigate to:

```
chrome://flags/#writer-api-for-gemini-nano
```

8. Set to: **Enabled**

9. Navigate to:

```
chrome://flags/#rewriter-api-for-gemini-nano
```

10. Set to: **Enabled**

11. Navigate to:

```
chrome://flags/#translation-api
```

12. Set to: **Enabled**

### 1.3 Download AI Model

1. Navigate to:

```
chrome://components/
```

2. Find "**Optimization Guide On Device Model**"

3. Click "**Check for update**"

4. Wait for download to complete (may take 5-10 minutes, ~1.5GB)

5. Verify status shows "**Up-to-date**"

### 1.4 Restart Chrome

Close and restart Chrome Canary/Dev completely.

## Step 2: Generate Extension Icons

**Time Required: 2 minutes**

1. Open `generate-icons.html` in your browser:

```bash
# On Windows (PowerShell)
start generate-icons.html

# On Mac
open generate-icons.html

# On Linux
xdg-open generate-icons.html
```

2. Icons will be generated automatically

3. Download each icon by clicking the download buttons

4. Save them to: `assets/icons/` folder with these filenames:
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`

## Step 3: Load Extension

**Time Required: 1 minute**

1. Open Chrome and navigate to:

```
chrome://extensions/
```

2. Enable "**Developer mode**" (toggle in top-right)

3. Click "**Load unpacked**"

4. Select the `lorem` folder (this project root)

5. The extension should now appear in your toolbar!

## Step 4: Verify Installation

**Time Required: 2 minutes**

### 4.1 Check Extension Status

1. Click the StudySync AI icon in toolbar
2. Popup should open
3. Status should show "**AI Ready**" (green dot)

If you see "AI Not Available":
- Verify AI model is downloaded (chrome://components/)
- Check all flags are enabled
- Restart Chrome completely

### 4.2 Test Basic Function

1. Go to any website (e.g., Wikipedia article)
2. Select some text
3. Right-click → StudySync AI → Summarize
4. Side panel should open with summary

If it works: ✅ **You're all set!**

If not: See troubleshooting below

## Step 5: Configure Settings (Optional)

**Time Required: 2 minutes**

1. Click extension icon → Settings button (gear icon)
2. Configure:
   - **Summary Length**: Short / Medium / Long
   - **Question Count**: 3-20
   - **Difficulty**: Easy / Medium / Hard
   - **Languages**: Source and target languages
   - **Auto-save**: Enable to save all results
3. Click "**Save Settings**"

## Troubleshooting

### Problem: "AI Not Available"

**Solution:**
1. Check chrome://components/ - model must be downloaded
2. Verify all flags are enabled in chrome://flags/
3. Restart Chrome completely (quit and reopen)
4. Check you're using Chrome Canary/Dev (not stable)

### Problem: Icons Not Showing

**Solution:**
1. Generate icons using `generate-icons.html`
2. Save to correct location: `assets/icons/`
3. Refresh extension in chrome://extensions/

### Problem: Context Menu Not Appearing

**Solution:**
1. Reload extension in chrome://extensions/
2. Refresh the webpage
3. Check that you selected text before right-clicking

### Problem: Side Panel Not Opening

**Solution:**
1. Check browser console for errors (F12)
2. Verify manifest.json has side_panel permission
3. Try clicking the side panel icon in toolbar

### Problem: Slow Performance

**Solution:**
1. First AI call downloads model (slow once)
2. Subsequent calls should be fast (1-3 seconds)
3. Check CPU/RAM usage - model needs ~2GB RAM
4. Close other tabs to free resources

## Verification Checklist

Before using, verify:

- ✅ Chrome Canary/Dev installed
- ✅ All AI flags enabled
- ✅ AI model downloaded (chrome://components/)
- ✅ Chrome restarted
- ✅ Extension loaded
- ✅ Icons present
- ✅ Status shows "AI Ready"
- ✅ Test summarization works

## Next Steps

Once installed:

1. 📖 Read [README.md](README.md) for full documentation
2. 🧪 Follow [TESTING.md](TESTING.md) for comprehensive testing
3. 💡 Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
4. 🎥 Record your demo video
5. 📝 Prepare hackathon submission

## Quick Reference

| Feature | Keyboard Shortcut | Context Menu |
|---------|-------------------|--------------|
| Summarize | Ctrl+Shift+S | ✅ |
| Translate | Ctrl+Shift+T | ✅ |
| Questions | Ctrl+Shift+Q | ✅ |
| Flashcards | - | ✅ |
| Proofread | - | ✅ |
| Explain | - | ✅ |

## Support

Need help?

- 📖 Check [TESTING.md](TESTING.md) for detailed tests
- 🐛 Report bugs on GitHub Issues
- 💬 Ask questions in Discussions
- 📧 Email: support@studysync-ai.com

---

**Estimated Total Setup Time: 10-15 minutes**

Happy studying! 📚✨
