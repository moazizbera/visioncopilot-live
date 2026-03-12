/**
 * Streaming Stress Test
 * Tests streaming stability by starting/stopping 20 times
 * 
 * Usage:
 * 1. Open browser DevTools Console
 * 2. Navigate to Live Streaming tab
 * 3. Copy and paste this entire script
 * 4. Results will be logged to console
 */

(async function streamingStressTest() {
  console.log('🧪 STREAMING STRESS TEST STARTING...\n');
  console.log('Test Parameters:');
  console.log('- Cycles: 20');
  console.log('- Stream duration: 3 seconds');
  console.log('- Rest duration: 2 seconds');
  console.log('- Expected duration: ~100 seconds\n');

  // Find the streaming controls
  const startButton = document.querySelector('button:not([disabled])');
  if (!startButton) {
    console.error('❌ Could not find streaming button. Make sure you\'re on the Live Streaming tab.');
    return;
  }

  // Baseline measurements
  const baseline = {
    memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
    cpu: 0, // Will be measured manually
    timestamp: Date.now()
  };

  console.log('📊 Baseline Measurements:');
  console.log(`- Memory: ${(baseline.memory / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Start time: ${new Date(baseline.timestamp).toLocaleTimeString()}\n`);

  const results = {
    cycles: [],
    errors: [],
    warnings: []
  };

  // Helper: Wait function
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper: Get current button state
  const getStreamingButton = () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => 
      b.textContent.includes('Start') || 
      b.textContent.includes('Stop')
    );
  };

  // Helper: Check for console warnings
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

  // Run cycles
  for (let i = 1; i <= 20; i++) {
    console.log(`\n🔄 Cycle ${i}/20`);
    
    const cycleStart = performance.now();
    const cycleMemoryStart = performance.memory ? performance.memory.usedJSHeapSize : 0;

    try {
      // Start streaming
      const startBtn = getStreamingButton();
      if (startBtn && startBtn.textContent.includes('Start')) {
        console.log(`  ▶️  Starting stream...`);
        startBtn.click();
        await wait(500); // Let it initialize
      }

      // Wait while streaming
      await wait(3000);

      // Stop streaming
      const stopBtn = getStreamingButton();
      if (stopBtn && stopBtn.textContent.includes('Stop')) {
        console.log(`  ⏹️  Stopping stream...`);
        stopBtn.click();
        await wait(500); // Let it cleanup
      }

      // Measure after cycle
      const cycleEnd = performance.now();
      const cycleMemoryEnd = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      const cycleResult = {
        cycle: i,
        duration: cycleEnd - cycleStart,
        memoryStart: cycleMemoryStart / 1024 / 1024,
        memoryEnd: cycleMemoryEnd / 1024 / 1024,
        memoryDelta: (cycleMemoryEnd - cycleMemoryStart) / 1024 / 1024,
        timestamp: Date.now()
      };

      results.cycles.push(cycleResult);
      
      console.log(`  ✅ Completed in ${cycleResult.duration.toFixed(0)}ms`);
      console.log(`  📊 Memory: ${cycleResult.memoryStart.toFixed(2)}MB → ${cycleResult.memoryEnd.toFixed(2)}MB (${cycleResult.memoryDelta > 0 ? '+' : ''}${cycleResult.memoryDelta.toFixed(2)}MB)`);

      // Rest period
      if (i < 20) {
        console.log(`  😴 Resting 2 seconds...`);
        await wait(2000);
      }

    } catch (error) {
      console.error(`  ❌ Error in cycle ${i}:`, error);
      results.errors.push(`Cycle ${i}: ${error.message}`);
    }
  }

  // Restore console methods
  console.warn = originalWarn;
  console.error = originalError;

  // Final measurements
  const final = {
    memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
    timestamp: Date.now()
  };

  // Analysis
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 STREAMING STRESS TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  const memoryGrowth = (final.memory - baseline.memory) / 1024 / 1024;
  const avgCycleDuration = results.cycles.reduce((sum, c) => sum + c.duration, 0) / results.cycles.length;
  const totalMemoryDelta = results.cycles.reduce((sum, c) => sum + c.memoryDelta, 0);

  console.log('📈 Summary:');
  console.log(`  - Cycles completed: ${results.cycles.length}/20`);
  console.log(`  - Average cycle duration: ${avgCycleDuration.toFixed(0)}ms`);
  console.log(`  - Total test duration: ${((final.timestamp - baseline.timestamp) / 1000).toFixed(1)}s`);
  console.log(`  - Baseline memory: ${(baseline.memory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  - Final memory: ${(final.memory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  - Net memory change: ${memoryGrowth > 0 ? '+' : ''}${memoryGrowth.toFixed(2)}MB`);
  console.log(`  - Total memory churn: ${totalMemoryDelta.toFixed(2)}MB`);

  console.log('\n⚠️  Warnings: ' + results.warnings.length);
  if (results.warnings.length > 0) {
    console.log('   First 3 warnings:');
    results.warnings.slice(0, 3).forEach(w => console.log(`   - ${w}`));
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

  // Check memory growth
  if (Math.abs(memoryGrowth) > 50) {
    passed = false;
    issues.push(`❌ Memory leak detected: ${memoryGrowth > 0 ? '+' : ''}${memoryGrowth.toFixed(2)}MB growth`);
  } else {
    console.log(`✅ Memory stable: ${memoryGrowth > 0 ? '+' : ''}${memoryGrowth.toFixed(2)}MB (< 50MB threshold)`);
  }

  // Check for errors
  if (results.errors.length > 0) {
    passed = false;
    issues.push(`❌ ${results.errors.length} errors occurred`);
  } else {
    console.log('✅ No errors during test');
  }

  // Check for excessive warnings
  if (results.warnings.length > 20) {
    passed = false;
    issues.push(`⚠️  ${results.warnings.length} warnings (expected < 20)`);
  } else {
    console.log(`✅ Warnings acceptable: ${results.warnings.length}`);
  }

  // Check all cycles completed
  if (results.cycles.length < 20) {
    passed = false;
    issues.push(`❌ Only ${results.cycles.length}/20 cycles completed`);
  } else {
    console.log('✅ All 20 cycles completed');
  }

  console.log('\n' + '='.repeat(60));
  if (passed) {
    console.log('🎉 TEST PASSED: Streaming is stable!');
  } else {
    console.log('❌ TEST FAILED: Issues detected:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  console.log('='.repeat(60) + '\n');

  console.log('💡 Next Steps:');
  console.log('1. Check DevTools Performance Monitor for CPU trends');
  console.log('2. Take a heap snapshot and look for detached streams');
  console.log('3. Check Network tab for WebSocket connection stability');
  console.log('4. Run AI Response Flood Test next\n');

  return {
    passed,
    results,
    baseline,
    final
  };
})();
