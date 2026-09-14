const speedValue = document.getElementById('speed-value');
const latencyValue = document.getElementById('latency-value');
const speedState = document.getElementById('speed-state');
const runTestButton = document.getElementById('run-test');

runTestButton.addEventListener('click', async () => {
  runTestButton.disabled = true;
  speedState.textContent = 'Testing...';
  try {
    const result = await window.api.networkSpeedTest();
    speedValue.textContent = result.downloadMbps;
    latencyValue.textContent = `${result.latencyMs} ms`;
    speedState.textContent = 'Updated now';
  } catch (error) {
    speedState.textContent = 'Test failed';
  } finally {
    runTestButton.disabled = false;
  }
});

document.getElementById('close-window').addEventListener('click', () => window.close());