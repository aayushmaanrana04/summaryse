# Quick Setup Guide

## 30-Second Setup

### Step 1: Open Chrome Extensions Page
```
chrome://extensions/
```

### Step 2: Enable Developer Mode
Toggle the **Developer mode** switch in the top-right corner.

### Step 3: Load Extension
1. Click **Load unpacked**
2. Select the `summaryse` folder (this directory)
3. Done! ✅

## Verify Installation

After loading:
1. Look for "Summaryse" in your extensions list
2. The extension icon should appear in your toolbar
3. Navigate to any webpage
4. Select any text and the blue **Summarize** button should appear

## First Use

1. **Select Text** - Highlight any text on a webpage
2. **Click Button** - Click the floating summarize button
3. **Wait for Model** - First time takes ~10-30s to download AI model
4. **View Summary** - Read the streamed summary result
5. **Copy** - Click "Copy" to copy to clipboard

## System Requirements

- ✅ Chrome/Chromium 94+
- ✅ WebGPU support (most modern hardware)
- ✅ 8GB+ RAM (recommended)
- ✅ 300MB+ disk space (for model cache)
- ✅ Working internet (first use only)

## Troubleshooting First Use

### Model Download Fails
```
Error: "Failed to load model"
```
**Solution:**
- Check internet connection
- Ensure 300MB+ free storage
- Try again in 1-2 minutes
- Check `chrome://gpu` for WebGPU support

### Extension Doesn't Appear
```
Extension not showing in toolbar
```
**Solution:**
- Refresh the webpage (Cmd+R / Ctrl+R)
- Check `chrome://extensions/` - it should be there
- Restart Chrome if needed

### Floating Button Not Showing
```
Selected text but no button appears
```
**Solution:**
- Make sure text selection is 5+ characters
- Wait ~200ms after selecting
- Check if page blocks extensions
- Try a different website (news.google.com, wikipedia.org)

## Enable in Incognito (Optional)

To use Summaryse in private/incognito mode:

1. Go to `chrome://extensions/`
2. Find Summaryse
3. Click **Details**
4. Toggle **Allow in Incognito**

## Update Extension

Chrome automatically checks for updates. To manually update:

1. Go to `chrome://extensions/`
2. Click **Update** button
3. Or reload: Press the refresh icon

To clear cached model and re-download:

1. Go to `chrome://settings/privacy`
2. Click **Clear browsing data**
3. Select **IndexedDB** and **Cookies and other site data**
4. Next time you summarize, model will re-download

## Disable/Uninstall

### Disable (Keep files)
- Go to `chrome://extensions/`
- Toggle off Summaryse

### Uninstall (Remove completely)
- Go to `chrome://extensions/`
- Click **Remove** on Summaryse card
- Confirm removal

## Next Steps

### For Daily Use
- Pin extension to toolbar: Click extension icon → Pin
- Create keyboard shortcut (optional):
  - `chrome://extensions/shortcuts`
  - Set shortcut for Summaryse
  - Use Alt+Shift+S (or your preference)

### For Development
- View logs: Right-click extension → Inspect popup
- Edit code: Any text editor, save, then reload in `chrome://extensions/`
- Debug: F12 on popup window for console logs

### Customization
- **Change prompt**: Edit `background.js` lines 130-150
- **Use different model**: Change `MODEL_ID` in `background.js` line 11
- **Style changes**: Edit `styles.css`

## Performance Tips

For faster performance:

1. **Close other apps** - Free up RAM
2. **Use WebGPU** - Check `chrome://gpu` for GPU availability
3. **Reuse model** - Subsequent runs skip download
4. **Shorter texts** - Test with small selections first

## Hardware Performance Matrix

| Hardware | First Use | Subsequent | Large Text |
|----------|-----------|-----------|-----------|
| M1/M2 Mac | ~15s | ~500ms | ~3s |
| Modern Desktop | ~20s | ~700ms | ~4s |
| Older Hardware | ~30s | ~1.5s | ~8s |

*Actual times vary by network and system load*

## FAQ

**Q: Is my data sent to the cloud?**
A: No. Everything runs locally in your browser. No data leaves your computer.

**Q: Can I use it offline?**
A: After the first use (model download), yes! Complete offline operation.

**Q: How much storage does it use?**
A: ~300-350MB total (code + cached model)

**Q: Can I use a different AI model?**
A: Yes! Edit the MODEL_ID in `background.js`

**Q: Why is the first use slow?**
A: The model is downloading (~220MB) and initializing (~10-20 seconds)

**Q: Can I delete the model and re-download?**
A: Yes, clear IndexedDB in Chrome settings (see above)

## Getting Help

### Debug Console
Right-click the extension popup and select "Inspect"
Look for errors in the Console tab (red messages)

### Enable Verbose Logging
Edit `background.js` and add:
```javascript
console.log("Debug:", message);
```

### Common Errors

**Error: "WebGPU not available"**
- Check GPU: `chrome://gpu`
- Update Chrome to latest version
- Ensure GPU driver is up to date

**Error: "Cannot connect to model provider"**
- Check internet connection
- Try a different network
- Clear cache and retry

**Error: "Out of memory"**
- Close other browser tabs
- Restart Chrome
- Use shorter text selections

## Success Indicators

✅ Extension appears in toolbar
✅ Floating button shows on text selection
✅ Popup opens when button clicked
✅ "Initializing AI model..." appears on first use
✅ Summary displays with streaming text
✅ Copy button works
✅ Can create new summaries

If all above work, you're set! 🎉

## Advanced: Manual Model Management

### Pre-download Model
On first load, model automatically downloads. To verify completion:

1. Open DevTools (F12)
2. Go to Application → Storage → IndexedDB
3. Look for WebLLM model cache
4. Should show ~220MB+ cached

### Switch Models
1. Edit `background.js` line 11:
   ```javascript
   const MODEL_ID = "Mistral-7B-Instruct-v0.2-q4f32_1"; // Different model
   ```
2. Reload extension in `chrome://extensions/`
3. Available models: https://huggingface.co/webllm

## Performance Profiling

To measure latency:

1. Open DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Click Summarize
5. Stop recording
6. Analyze flamechart

Look for:
- Model load time
- Token generation time
- UI render time

---

**Ready?** Select some text and start summarizing! 🚀

Questions? Check README.md for full documentation.
