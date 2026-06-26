const debugEl = document.getElementById('debug');

const stateEl = document.createElement('div');
stateEl.id = 'debug-state';
debugEl.appendChild(stateEl);

const logEl = document.createElement('div');
logEl.id = 'debug-log';
debugEl.appendChild(logEl);

const logHistory = [];
const MAX_LOG = 50;

function renderState() {
  const s = window.__dbg || {};
  stateEl.innerHTML = `
    range <span class="val">${s.minIdx ?? '?'}</span> ..
    <span class="val">${s.maxIdx ?? '?'}</span>
    &nbsp;|&nbsp; DOM <span class="val">${s.domCount ?? '?'}</span>
    &nbsp;|&nbsp; touch <span class="val ${s.touching ? 'warn' : ''}">${s.touching ? 'YES' : 'no'}</span>
    &nbsp;|&nbsp; updating <span class="val ${s.updating ? 'warn' : ''}">${s.updating ? 'YES' : 'no'}</span>
    <br>
    sL <span class="val">${s.scrollLeft ?? '?'}</span>
    &nbsp;|&nbsp; sR <span class="val">${s.scrollRight ?? '?'}</span>
    &nbsp;|&nbsp; tW <span class="val">${s.totalW ?? '?'}</span>
    &nbsp;|&nbsp; thr <span class="val">${s.threshold ?? '?'}</span>
    &nbsp;|&nbsp; dir <span class="val">${s.dir ?? '?'}</span>
  `;
}

function addLog(text, cls) {
  const time = new Date().toLocaleTimeString();
  logHistory.push({ text, cls, time });
  if (logHistory.length > MAX_LOG) logHistory.shift();
  renderLog();
}

function renderLog() {
  logEl.innerHTML = logHistory.map(e =>
    `<div class="entry ${e.cls}">[${e.time}] ${e.text}</div>`
  ).join('');
  logEl.scrollTop = logEl.scrollHeight;
}

window.__dbg = {};
window.__dbgUpdate = function (patch) {
  Object.assign(window.__dbg, patch);
  renderState();
};
window.__dbgLog = function (text, cls) { addLog(text, cls); };
