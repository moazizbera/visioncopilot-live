# VisionCopilot Live - Test Scripts

Automated test scripts for Phase 6C-T (Pre-Deployment Testing).

## 📋 Test Scripts

### 1. Streaming Stress Test
**File**: `streaming-stress-test.js`  
**Purpose**: Detect memory leaks and interval accumulation in live streaming  
**Duration**: ~100 seconds (20 cycles × 5 seconds)

**What it tests**:
- Memory stability over 20 start/stop cycles
- Interval cleanup (no accumulation)
- WebSocket connection stability
- Console errors/warnings

**How to run**:
1. Start the application (backend + frontend)
2. Open browser → Navigate to **Live Streaming** tab
3. Open DevTools Console (F12 → Console)
4. Copy entire contents of `streaming-stress-test.js`
5. Paste into console and press Enter
6. Watch the automated test run (do not interact)

**Expected Results**:
- ✅ Memory change < ±50MB
- ✅ No errors during 20 cycles
- ✅ All 20 cycles complete
- ✅ Warnings < 20

**Output**: Detailed console report with pass/fail verdict

---

### 2. AI Response Flood Test
**File**: `ai-response-flood-test.js`  
**Purpose**: Test response ordering and UI stability under rapid prompt load  
**Duration**: ~30-60 seconds

**What it tests**:
- Response ordering (FIFO)
- UI responsiveness during high load
- No duplicate chunks
- Message separation in UI

**How to run**:
1. Start the application (backend + frontend)
2. Open browser → Navigate to **Chat** tab
3. Ensure WebSocket is connected (green indicator)
4. Open DevTools Console (F12 → Console)
5. Copy entire contents of `ai-response-flood-test.js`
6. Paste into console and press Enter
7. Watch 10 prompts send rapidly

**Expected Results**:
- ✅ All 10 prompts sent
- ✅ UI remains responsive
- ✅ No errors
- ✅ Responses appear in order (manual check)
- ✅ No duplicate chunks (manual check)

**Output**: Automated checks + manual verification checklist

---

## 🚀 Quick Start

### Prerequisites
```powershell
# Backend running
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Frontend running (separate terminal)
cd frontend
npm run dev
```

### Run All Tests (Manual)
1. **Streaming Stress Test** (5 min)
   - Live Streaming tab → Run script → Wait for results
   
2. **AI Response Flood Test** (2 min)
   - Chat tab → Run script → Verify manually

---

## 📊 Interpreting Results

### Streaming Stress Test

**✅ PASS Criteria**:
```
✅ Memory stable: ±X MB (< 50MB threshold)
✅ No errors during test
✅ Warnings acceptable: X
✅ All 20 cycles completed
🎉 TEST PASSED: Streaming is stable!
```

**❌ FAIL Indicators**:
```
❌ Memory leak detected: +XXX MB growth
❌ X errors occurred
❌ Only X/20 cycles completed
```

**What to do if it fails**:
- Check browser console for React warnings
- Take heap snapshot in DevTools → Memory
- Look for detached media streams
- Verify interval cleanup in components

---

### AI Response Flood Test

**✅ PASS Criteria**:
```
✅ All 10 prompts sent successfully
✅ No errors during test
✅ UI remained responsive
✅ Warnings acceptable: X
🎉 AUTOMATED CHECKS PASSED!
```

**Manual Verification Required**:
- [ ] All 10 responses appeared in order
- [ ] No duplicate chunks (same text repeated)
- [ ] Each response is complete (not cut off)
- [ ] Responses are separated clearly in UI
- [ ] No responses are interleaved or jumbled

**❌ FAIL Indicators**:
```
❌ Only X/10 prompts sent
❌ X errors occurred
❌ UI became unresponsive during test
```

**What to do if it fails**:
- Check Network tab for failed requests
- Verify WebSocket message order
- Look for rate limiting or backend errors
- Check streaming response handler logic

---

## 🔧 Debugging

### Enable Verbose Logging

```javascript
// In browser console before running tests
localStorage.setItem('debug', 'true');

// Disable after testing
localStorage.removeItem('debug');
```

### Monitor WebSocket Messages

```javascript
// Add before running flood test
const ws = webSocketService.ws;
const original = ws.onmessage;
ws.onmessage = (e) => { 
  console.log('WS Message:', JSON.parse(e.data)); 
  original(e); 
};
```

### Check Active Intervals

```javascript
// Run during or after stress test
console.log('Active timers:', performance.getEntriesByType('mark'));
```

---

## 📁 Files

```
test-scripts/
├── README.md                      # This file
├── streaming-stress-test.js       # Stress test for live streaming
└── ai-response-flood-test.js      # Flood test for AI responses
```

---

## 🧪 Additional Manual Tests

Beyond these automated scripts, also perform:

### 1. Memory Leak Test
- DevTools → Performance → Memory
- Take heap snapshots before/after camera use
- Compare for detached streams

### 2. React DevTools Profiler
- Install React DevTools extension
- Profile component re-renders
- Verify memoized handlers work

### 3. WebSocket Stability
- Network tab → WebSocket connection
- Connect/disconnect 5 times
- Verify clean reconnection

### 4. Media Stream Cleanup
- Start camera → Navigate away
- Verify camera light turns off
- Check browser for warnings

---

## 📝 Test Report Template

After running tests, document results:

```markdown
## Phase 6C-T Test Results

**Date**: YYYY-MM-DD
**Browser**: Chrome/Firefox/Safari XX
**Environment**: Local/Staging/Production

### Streaming Stress Test
- Status: ✅ PASS / ❌ FAIL
- Memory baseline: XX MB
- Memory final: XX MB
- Memory delta: ±XX MB
- Errors: X
- Notes: [Any observations]

### AI Response Flood Test
- Status: ✅ PASS / ❌ FAIL
- Prompts sent: X/10
- UI responsive: Yes/No
- Response order: Correct/Incorrect
- Duplicate chunks: Yes/No
- Notes: [Any observations]

### Manual Tests
- Memory Leak Test: ✅ / ❌
- React Profiler: ✅ / ❌
- WebSocket Stability: ✅ / ❌
- Media Stream Cleanup: ✅ / ❌

### Overall Assessment
- **Ready for Production**: ✅ YES / ❌ NO
- **Issues Found**: [List any issues]
- **Recommendations**: [Any recommendations]
```

---

## 🆘 Troubleshooting

**Script won't run**:
- Make sure you're on the correct tab (Streaming/Chat)
- Check that app is fully loaded
- Verify WebSocket is connected
- Open console and check for syntax errors

**Test hangs or freezes**:
- Refresh page and try again
- Check Network tab for failed requests
- Verify backend is running
- Check browser console for errors

**Unexpected results**:
- Clear browser cache and reload
- Restart backend and frontend
- Try in incognito mode
- Test in different browser

---

**Created**: March 7, 2026  
**Phase**: 6C-T (Pre-Deployment Testing)  
**Status**: Ready for execution
