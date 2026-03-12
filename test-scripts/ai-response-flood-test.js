/**
 * AI Response Flood Test
 * Tests response ordering and UI stability with rapid prompts
 * 
 * Usage:
 * 1. Open browser DevTools Console
 * 2. Navigate to Chat tab
 * 3. Make sure WebSocket is connected
 * 4. Copy and paste this entire script
 * 5. Results will be logged to console
 */

(async function aiResponseFloodTest() {
  console.log('🧪 AI RESPONSE FLOOD TEST STARTING...\n');
  console.log('Test Parameters:');
  console.log('- Prompts: 10');
  console.log('- Send interval: < 100ms (rapid fire)');
  console.log('- Expected duration: ~30-60 seconds\n');

  // Test prompts (short to get quick responses)
  const prompts = [
    'Count to 5',
    'Name 3 colors',
    'What is 2+2?',
    'Say hello',
    'Name a fruit',
    'What day is it?',
    'Pick a number 1-10',
    'Name an animal',
    'What is the sky color?',
    'Say goodbye'
  ];

  // Track results
  const results = {
    sent: [],
    received: [],
    chunks: [],
    errors: [],
    warnings: [],
    uiResponsive: true,
    orderCorrect: true
  };

  // Helper: Wait function
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper: Get send button and input
  const getInputAndButton = () => {
    const textarea = document.querySelector('textarea');
    const buttons = Array.from(document.querySelectorAll('button'));
    const sendButton = buttons.find(b => 
      b.textContent.includes('Send') || 
      b.textContent.includes('💬')
    );
    return { textarea, sendButton };
  };

  // Monitor WebSocket messages
  console.log('🔍 Setting up WebSocket monitoring...\n');
  
  let responseCount = 0;
  let currentResponseId = null;
  let lastResponseContent = '';

  // Intercept WebSocket messages (if accessible)
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    if (args[0]?.includes('/chat')) {
      console.log('📤 Chat request sent');
    }
    return response;
  };

  // Monitor console for errors/warnings
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = function(...args) {
    results.warnings.push(args.join(' '));
    originalWarn.apply(console, args);
  };
  console.error = function(...args) {
    results.errors.push(args.join(' '));
    originalError.apply(console, args);
  };

  // Monitor UI responsiveness
  let lastInteractionTime = Date.now();
  const checkUIResponsive = () => {
    const now = Date.now();
    const responsive = (now - lastInteractionTime) < 5000;
    if (!responsive && results.uiResponsive) {
      results.uiResponsive = false;
      console.warn('⚠️  UI became unresponsive (> 5s delay)');
    }
    return responsive;
  };

  // Phase 1: Send all prompts rapidly
  console.log('📤 PHASE 1: Sending 10 rapid prompts...\n');
  
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const { textarea, sendButton } = getInputAndButton();

    if (!textarea || !sendButton) {
      console.error('❌ Could not find input or send button. Make sure you\'re on the Chat tab.');
      results.errors.push('UI elements not found');
      break;
    }

    try {
      console.log(`  ${i + 1}. "${prompt}"`);
      
      // Set input value
      textarea.value = prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Record send time
      const sendTime = Date.now();
      results.sent.push({
        index: i,
        prompt,
        timestamp: sendTime
      });

      // Click send
      sendButton.click();
      lastInteractionTime = Date.now();

      // Very short delay between sends (rapid fire)
      await wait(50);

    } catch (error) {
      console.error(`  ❌ Error sending prompt ${i + 1}:`, error);
      results.errors.push(`Send ${i + 1}: ${error.message}`);
    }
  }

  console.log('\n✅ All prompts sent!\n');

  // Phase 2: Monitor responses
  console.log('📥 PHASE 2: Monitoring responses...\n');
  console.log('Waiting for all responses to complete (max 60 seconds)...\n');

  // Count messages in chat
  const countMessages = () => {
    const messageElements = document.querySelectorAll('[class*="message"], [class*="chat"]');
    return messageElements.length;
  };

  const initialMessageCount = countMessages();
  let lastMessageCount = initialMessageCount;
  let stableCount = 0;
  const maxWaitTime = 60000; // 60 seconds
  const checkInterval = 1000; // 1 second
  let elapsed = 0;

  while (elapsed < maxWaitTime) {
    await wait(checkInterval);
    elapsed += checkInterval;

    const currentMessageCount = countMessages();
    
    if (currentMessageCount > lastMessageCount) {
      console.log(`  📨 Messages received: ${currentMessageCount - initialMessageCount}`);
      lastMessageCount = currentMessageCount;
      stableCount = 0;
    } else {
      stableCount++;
    }

    // Check UI responsiveness
    checkUIResponsive();

    // If stable for 3 seconds, probably done
    if (stableCount >= 3) {
      console.log('\n✅ Responses appear complete (no new messages for 3s)\n');
      break;
    }
  }

  if (elapsed >= maxWaitTime) {
    console.warn('⚠️  Timeout: Max wait time reached\n');
  }

  // Restore console methods and fetch
  console.warn = originalWarn;
  console.error = originalError;
  window.fetch = originalFetch;

  // Phase 3: Analyze results
  console.log('\n' + '='.repeat(60));
  console.log('📊 AI RESPONSE FLOOD TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  const totalMessages = lastMessageCount - initialMessageCount;
  const expectedMessages = prompts.length * 2; // Each prompt + response

  console.log('📈 Summary:');
  console.log(`  - Prompts sent: ${results.sent.length}/${prompts.length}`);
  console.log(`  - Messages in chat: ${totalMessages}`);
  console.log(`  - Expected messages: ${expectedMessages} (10 prompts + 10 responses)`);
  console.log(`  - Test duration: ${(elapsed / 1000).toFixed(1)}s`);

  console.log('\n⚠️  Warnings: ' + results.warnings.length);
  if (results.warnings.length > 0) {
    console.log('   First 5 warnings:');
    results.warnings.slice(0, 5).forEach(w => console.log(`   - ${w}`));
  }

  console.log('\n❌ Errors: ' + results.errors.length);
  if (results.errors.length > 0) {
    console.log('   Errors:');
    results.errors.forEach(e => console.log(`   - ${e}`));
  }

  // Verdict
  console.log('\n' + '='.repeat(60));
  console.log('🎯 VERDICT:');
  console.log('='.repeat(60) + '\n');

  let passed = true;
  const issues = [];

  // Check all prompts sent
  if (results.sent.length < prompts.length) {
    passed = false;
    issues.push(`❌ Only ${results.sent.length}/${prompts.length} prompts sent`);
  } else {
    console.log(`✅ All ${prompts.length} prompts sent successfully`);
  }

  // Check for errors
  if (results.errors.length > 0) {
    passed = false;
    issues.push(`❌ ${results.errors.length} errors occurred`);
  } else {
    console.log('✅ No errors during test');
  }

  // Check UI responsiveness
  if (!results.uiResponsive) {
    passed = false;
    issues.push('❌ UI became unresponsive during test');
  } else {
    console.log('✅ UI remained responsive');
  }

  // Check excessive warnings
  if (results.warnings.length > 10) {
    issues.push(`⚠️  ${results.warnings.length} warnings (expected < 10)`);
  } else {
    console.log(`✅ Warnings acceptable: ${results.warnings.length}`);
  }

  // Manual checks needed
  console.log('\n🔍 Manual Verification Required:');
  console.log('   Please visually inspect the chat UI and verify:');
  console.log('   1. ✓ All 10 responses appeared in order');
  console.log('   2. ✓ No duplicate chunks (same text repeated)');
  console.log('   3. ✓ Each response is complete (not cut off)');
  console.log('   4. ✓ Responses are separated clearly in the UI');
  console.log('   5. ✓ No responses are interleaved or jumbled');

  console.log('\n' + '='.repeat(60));
  if (passed) {
    console.log('🎉 AUTOMATED CHECKS PASSED!');
    console.log('\n⚠️  Manual verification still required (see above)');
  } else {
    console.log('❌ AUTOMATED CHECKS FAILED:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  console.log('='.repeat(60) + '\n');

  console.log('💡 Next Steps:');
  console.log('1. Scroll through chat history and verify response order');
  console.log('2. Check for any duplicate or missing content');
  console.log('3. Verify streaming chunks appeared smoothly');
  console.log('4. Check Network tab for any failed requests');
  console.log('5. Review WebSocket messages in Network tab\n');

  return {
    passed,
    results,
    totalMessages,
    expectedMessages
  };
})();
