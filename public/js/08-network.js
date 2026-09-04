/* ============================================================================
 FILE: public/js/08-network.js
 ROLE: LOW-LEVEL MESSAGING — sendMsg()/connLog()/destroyPeer()/stopRejoin() over the PeerJS connection. Depends on: G (03).
============================================================================ */

function sendMsg(d) {
  try {
    if (conn && conn.open) conn.send(d);
  } catch (e) {}
}
function connLog(m, e, w) {
  const el = $("connLog");
  if (!el) return;
  const d = document.createElement("div");
  if (e) d.className = "err";
  else if (w) d.className = "warn";
  d.textContent = m;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}
function destroyPeer() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (rejoinTimer) {
    clearInterval(rejoinTimer);
    rejoinTimer = null;
  }
  if (peer) {
    try {
      peer.destroy();
    } catch (e) {}
  }
  peer = null;
  conn = null;
}
function stopRejoin() {
  if (rejoinTimer) {
    clearInterval(rejoinTimer);
    rejoinTimer = null;
  }
}
