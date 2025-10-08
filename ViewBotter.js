let DELAY = 60000;
let intervalId = null;
let successCount = 0;
let failureCount = 0;

const urlParams = new URLSearchParams(window.location.search);
let QUESTION_SET_ID = urlParams.get('id') || "";

async function postData(url, reqbody) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-type": "application/json"},
      body: JSON.stringify(reqbody)
    });
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
      console.log(`Rate limited, retrying in ${waitTime / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return postData(url, reqbody); 
    }
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Posted successfully + ", data);
    successCount++;
    updateCounters();
    return data;
  } catch (error) {
    console.error("Error posting data:", error);
    failureCount++;
    updateCounters();
  }
}

const gameModes = ["Defense2"];
let currentModeIndex = 0;

function startPosting() {
  if (intervalId) return; 
  const url = "https://play.blooket.com/api/playersessions/solo";

  function post() {
    const reqbody = {
      "gameMode": gameModes[currentModeIndex],
      "questionSetId": QUESTION_SET_ID
    };
    postData(url, reqbody);
    updateCurrentMode(gameModes[currentModeIndex]);
    currentModeIndex = (currentModeIndex + 1) % gameModes.length;
    intervalId = setTimeout(post, DELAY);
  }
  post();
  updateStatus('Running');
}

function stopPosting() {
  if (intervalId) {
    clearTimeout(intervalId);
    intervalId = null;
  }
  updateStatus('Stopped');
}

function setDelay(delay) {
  DELAY = delay;
}

function injectGUI() {
  const gui = document.createElement('div');
  gui.id = 'viewbot-gui';
  gui.style.position = 'fixed';
  gui.style.top = '10px';
  gui.style.right = '10px';
  gui.style.width = '250px';
  gui.style.backgroundColor = 'rgba(184, 5, 255, 0.62)';
  gui.style.border = '2px solid black';
  gui.style.color = 'white';
  gui.style.padding = '10px';
  gui.style.borderRadius = '5px';
  gui.style.zIndex = '9999';
  gui.style.cursor = 'move';
  gui.style.fontFamily = 'Arial, sans-serif';
  gui.style.fontSize = '12px';
  gui.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">Blooket ViewBot</div>
    <div>Set ID: <span id="setid">${QUESTION_SET_ID}</span></div>
    <div>Current Mode: <span id="currentMode">${gameModes[0]}</span></div>
    <label>Delay (ms): <input type="range" id="delayInput" min="1" max="1000" value="${DELAY}" style="width: 150px;"> <span id="delayValue">${DELAY}</span></label><br>
    <button id="startBtn" style="margin-top: 5px;">Start</button>
    <button id="stopBtn" style="margin-top: 5px;">Stop</button>
    <div id="status" style="margin-top: 5px;">Status: Stopped</div>
    <div>Successful: <span id="successCount">0</span></div>
    <div>Failed: <span id="failureCount">0</span></div>
  `;

  document.body.appendChild(gui);

  let isDragging = false;
  let offsetX, offsetY;

  gui.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - gui.offsetLeft;
    offsetY = e.clientY - gui.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      gui.style.left = (e.clientX - offsetX) + 'px';
      gui.style.top = (e.clientY - offsetY) + 'px';
      gui.style.right = 'auto';
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  document.getElementById('startBtn').addEventListener('click', startPosting);
  document.getElementById('stopBtn').addEventListener('click', stopPosting);
  const delayInput = document.getElementById('delayInput');
  const delayValue = document.getElementById('delayValue');
  delayInput.addEventListener('input', (e) => {
    const val = e.target.value;
    delayValue.textContent = val;
    setDelay(parseInt(val));
  });
}

function updateStatus(status) {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = `Status: ${status}`;
}

function updateCurrentMode(mode) {
  const modeEl = document.getElementById('currentMode');
  if (modeEl) modeEl.textContent = mode;
}

function updateCounters() {
  const successEl = document.getElementById('successCount');
  const failureEl = document.getElementById('failureCount');
  if (successEl) successEl.textContent = successCount;
  if (failureEl) failureEl.textContent = failureCount;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectGUI);
} else {
  injectGUI();
}
