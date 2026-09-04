/* ============================================================================
 FILE: public/js/03-state.js
 ROLE: GLOBAL STATE — TIMER/CIRC/WATCHDOG constants, the G game-state object, $() helper, network let-vars (peer/conn/…), sessionStorage snapshots (saveSession/loadSession/saveSnap/loadSnap/clearSnap/makeSnap/restore/persist/setStage) for online rejoin. Depends on: nothing at load.
============================================================================ */

const TIMER = 5,
  CIRC = 2 * Math.PI * 44,
  WATCHDOG = 12000;
const G = {
  mode: null,
  teamSize: 1,
  innings: 1,
  iBat: true,
  target: null,
  me: { score: 0, wkts: 0, balls: 0, hist: [] },
  opp: { score: 0, wkts: 0, balls: 0, hist: [] },
  myPick: null,
  oppPick: null,
  state: "idle",
  timerId: null,
  tStart: 0,
  watchdog: null,
  totalBalls: 6,
  totalWkts: 1,
  isHost: false,
  myName: "Player",
  oppName: "Opp",
  myTeam: null,
  oppTeam: null,
  myPlayers: [],
  oppPlayers: [],
  batIdx: 0,
  bowlIdx: 0,
  freeHit: false,
  iAuto: false,
  oppAuto: false,
  roomId: null,
  stage: "lobby",
  wantRejoin: false,
  isBot: false,
  botProfile: null,
  matchStartTime: 0,
  recentResult: null,
  oppStats: null,
  myBatStats: [],
  myBowlStats: [],
  oppBatStats: [],
  oppBowlStats: [],
  storyDifficulty: 0,
  storyMatch: false, // true while a story-career match is running (C6)
  selectingPlayer: null,
  selectTimer: null,
};
const $ = (id) => document.getElementById(id);
let audioCtx = null,
  peer = null,
  conn = null,
  pollTimer = null,
  connGen = 0,
  joinAttempts = 0,
  readyGen = -1,
  rejoinTimer = null,
  matchTimer = null,
  mmSearching = false; // quick-match (instant) state

function saveSession(o) {
  try {
    sessionStorage.setItem("hc_sess", JSON.stringify(o));
  } catch (e) {}
}
function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem("hc_sess"));
  } catch (e) {
    return null;
  }
}
function saveSnap(s) {
  try {
    sessionStorage.setItem("hc_snap_" + G.roomId, JSON.stringify(s));
  } catch (e) {}
}
function loadSnap(room) {
  try {
    const r = sessionStorage.getItem("hc_snap_" + room);
    return r ? JSON.parse(r) : null;
  } catch (e) {
    return null;
  }
}
function clearSnap() {
  try {
    sessionStorage.removeItem("hc_snap_" + G.roomId);
  } catch (e) {}
}
function makeSnap() {
  return {
    stage: G.stage,
    teamSize: G.teamSize,
    innings: G.innings,
    iBatHost: G.isHost ? G.iBat : !G.iBat,
    target: G.target,
    freeHit: G.freeHit,
    batIdx: G.batIdx,
    bowlIdx: G.bowlIdx,
    hostName: G.isHost ? G.myName : G.oppName,
    joinName: G.isHost ? G.oppName : G.myName,
    host: G.isHost ? G.me : G.opp,
    joiner: G.isHost ? G.opp : G.me,
    hostTeam: G.isHost ? G.myTeam : G.oppTeam,
    joinTeam: G.isHost ? G.oppTeam : G.myTeam,
    hostPlayers: G.isHost ? G.myPlayers : G.oppPlayers,
    joinPlayers: G.isHost ? G.oppPlayers : G.myPlayers,
    isBot: G.isBot,
    botProfile: G.botProfile,
    mode: G.mode,
  };
}
function restore(s, iAmHost) {
  G.teamSize = s.teamSize || 1;
  G.innings = s.innings;
  G.target = s.target;
  G.freeHit = s.freeHit;
  G.batIdx = s.batIdx || 0;
  G.bowlIdx = s.bowlIdx || 0;
  G.stage = s.stage;
  G.myName = iAmHost ? s.hostName : s.joinName;
  G.oppName = iAmHost ? s.joinName : s.hostName;
  G.me = iAmHost ? s.host : s.joiner;
  G.opp = iAmHost ? s.joiner : s.host;
  G.iBat = iAmHost ? s.iBatHost : !s.iBatHost;
  G.myTeam = iAmHost ? s.hostTeam : s.joinTeam;
  G.oppTeam = iAmHost ? s.joinTeam : s.hostTeam;
  G.myPlayers = iAmHost ? s.hostPlayers : s.joinPlayers;
  G.oppPlayers = iAmHost ? s.joinPlayers : s.hostPlayers;
  G.isBot = s.isBot || false;
  G.botProfile = s.botProfile || null;
  G.mode = s.mode || (G.isBot ? "offline" : "online");
}
function persist() {
  if (G.isHost && G.roomId) saveSnap(makeSnap());
}
function setStage(s) {
  G.stage = s;
  persist();
}

