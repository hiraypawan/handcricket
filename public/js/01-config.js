/* ============================================================================
 FILE: public/js/01-config.js
 ROLE: CONFIG & STATIC DATA — IPL squads (TEAMS), ALL_PLAYERS, ROLE_LIMITS (gesture rules per style), bot name pools (BOT_FIRST/LAST/PREFIX/SUFFIX), genBotName()/genBotProfile(), getAllowedGestures(). Loaded first. Depends on: nothing.
============================================================================ */

const TEAMS = {
  csk: {
    name: "CSK",
    players: [
      { name: "Gaikwad", role: "batter" },
      { name: "Conway", role: "batter" },
      { name: "Rahane", role: "batter" },
      { name: "Dube", role: "all" },
      { name: "Jadeja", role: "all" },
      { name: "Moeen", role: "all" },
      { name: "Dhoni", role: "batter" },
      { name: "Chahar", role: "bowler" },
      { name: "Pathirana", role: "bowler" },
      { name: "Deshpande", role: "bowler" },
      { name: "Ravindra", role: "all" },
    ],
  },
  mi: {
    name: "MI",
    players: [
      { name: "Rohit", role: "batter" },
      { name: "Ishan", role: "batter" },
      { name: "SKY", role: "batter" },
      { name: "Tilak", role: "batter" },
      { name: "Hardik", role: "all" },
      { name: "David", role: "batter" },
      { name: "Green", role: "all" },
      { name: "Bumrah", role: "bowler" },
      { name: "Chawla", role: "bowler" },
      { name: "Madhwal", role: "bowler" },
      { name: "Dhir", role: "all" },
    ],
  },
  rcb: {
    name: "RCB",
    players: [
      { name: "Kohli", role: "batter" },
      { name: "Faf", role: "batter" },
      { name: "Patidar", role: "batter" },
      { name: "Maxwell", role: "all" },
      { name: "Karthik", role: "batter" },
      { name: "Lomror", role: "all" },
      { name: "Jacks", role: "all" },
      { name: "Siraj", role: "bowler" },
      { name: "Harshal", role: "bowler" },
      { name: "Ferguson", role: "bowler" },
      { name: "Dayal", role: "bowler" },
    ],
  },
  kkr: {
    name: "KKR",
    players: [
      { name: "Iyer", role: "batter" },
      { name: "Rinku", role: "batter" },
      { name: "Rana", role: "all" },
      { name: "Russell", role: "all" },
      { name: "Narine", role: "all" },
      { name: "Venkatesh", role: "all" },
      { name: "Gurbaz", role: "batter" },
      { name: "Starc", role: "bowler" },
      { name: "Varun", role: "bowler" },
      { name: "Harshit", role: "bowler" },
      { name: "Angkrish", role: "batter" },
    ],
  },
  dc: {
    name: "DC",
    players: [
      { name: "Warner", role: "batter" },
      { name: "Shaw", role: "batter" },
      { name: "Pant", role: "batter" },
      { name: "Stubbs", role: "batter" },
      { name: "Axar", role: "all" },
      { name: "Marsh", role: "all" },
      { name: "Porel", role: "batter" },
      { name: "Kuldeep", role: "bowler" },
      { name: "Nortje", role: "bowler" },
      { name: "Mukesh", role: "bowler" },
      { name: "Rahul", role: "batter" },
    ],
  },
  rr: {
    name: "RR",
    players: [
      { name: "Samson", role: "batter" },
      { name: "Jaiswal", role: "batter" },
      { name: "Buttler", role: "batter" },
      { name: "Hetmyer", role: "batter" },
      { name: "Parag", role: "all" },
      { name: "Ashwin", role: "all" },
      { name: "Jurel", role: "batter" },
      { name: "Chahal", role: "bowler" },
      { name: "Sandeep", role: "bowler" },
      { name: "Boult", role: "bowler" },
    ],
  },
  srh: {
    name: "SRH",
    players: [
      { name: "Head", role: "batter" },
      { name: "Abhishek", role: "batter" },
      { name: "Markram", role: "all" },
      { name: "Klaasen", role: "batter" },
      { name: "Samad", role: "all" },
      { name: "Shahbaz", role: "all" },
      { name: "Viv", role: "batter" },
      { name: "Bhuvi", role: "bowler" },
      { name: "Nattu", role: "bowler" },
      { name: "Umran", role: "bowler" },
      { name: "Farooqi", role: "bowler" },
    ],
  },
  pbks: {
    name: "PBKS",
    players: [
      { name: "Dhawan", role: "batter" },
      { name: "Bairstow", role: "batter" },
      { name: "Livingstone", role: "all" },
      { name: "SamCurran", role: "all" },
      { name: "Jitesh", role: "batter" },
      { name: "Shahrukh", role: "batter" },
      { name: "Ashutosh", role: "all" },
      { name: "Arshdeep", role: "bowler" },
      { name: "Rabada", role: "bowler" },
      { name: "Chahar", role: "bowler" },
      { name: "Ellis", role: "bowler" },
    ],
  },
};
const ALL_PLAYERS = Object.values(TEAMS).flatMap((t) => t.players);

// v2.7.1: role gesture limits per the game design —
// AGGROSSIVE may only play/face big balls (4-6), DEFENSIVE only safe ones
// (1-3), BALANCED everything. Applies to batting AND bowling, all modes.
const ROLE_LIMITS = {
  aggressive: { bat: [4, 5, 6], bowl: [4, 5, 6] },
  defensive: { bat: [1, 2, 3], bowl: [1, 2, 3] },
  balanced: { bat: [1, 2, 3, 4, 5, 6], bowl: [1, 2, 3, 4, 5, 6] },
};

function getAllowedGestures(player, isBatting) {
  // curBatter()/curBowler() can be null before a roster exists (boot, between
  // matches). That used to throw here and take the whole gesture loop with it.
  if (!player) return [1, 2, 3, 4, 5, 6];
  const style = isBatting
    ? player.battingStyle || "balanced"
    : player.bowlingStyle || "balanced";
  const limits = ROLE_LIMITS[style];
  if (!limits) return [1, 2, 3, 4, 5, 6];
  return isBatting ? limits.bat : limits.bowl;
}

const BOT_FIRST = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Arjun",
  "Sai",
  "Reyansh",
  "Krishna",
  "Ishaan",
  "Shaurya",
  "Atharv",
  "Advik",
  "Pranav",
  "Advaith",
  "Arnav",
  "Vihaan",
  "Samar",
  "Rohan",
  "Armaan",
  "Harsh",
  "Kabir",
  "Ansh",
  "Dhruv",
  "Ved",
  "Ayaan",
  "Kiran",
  "Nikhil",
  "Aakash",
  "Tarun",
  "Raj",
  "Vikram",
  "Sanjay",
  "Mohan",
  "Suresh",
  "Ramesh",
  "Dinesh",
  "Mahesh",
  "Rajesh",
  "Ganesh",
  "Mukesh",
  "Prakash",
  "Sunil",
  "Manoj",
  "Nitin",
  "Karan",
  "Ajay",
  "Vijay",
  "Ravi",
  "Ashok",
  "Deepak",
  "Manish",
  "Pawan",
  "Sachin",
  "Rahul",
  "Amit",
  "Yogesh",
  "Pradeep",
  "Gaurav",
  "Naveen",
  "Rohit",
  "Saurabh",
  "Shubham",
  "Tushar",
  "Yash",
  "Kartik",
  "Nishant",
  "Harshit",
  "Vikash",
  "Ajinkya",
  "Chetan",
  "Darshan",
  "Gokul",
  "Hrithik",
  "Jatin",
  "Kishore",
  "Lakshya",
  "Mayank",
  "Naman",
  "Omkar",
  "Pranav",
  "Rishabh",
  "Shreyas",
  "Tanmay",
  "Uday",
  "Varun",
  "Wasim",
];
const BOT_LAST = [
  "Sharma",
  "Verma",
  "Patel",
  "Kumar",
  "Singh",
  "Reddy",
  "Nair",
  "Mishra",
  "Joshi",
  "Gupta",
  "Bose",
  "Das",
  "Banerjee",
  "Chatterjee",
  "Mukherjee",
  "Iyer",
  "Rao",
  "Hegde",
  "Kamath",
  "Pandey",
  "Tiwari",
  "Chauhan",
  "Thakur",
  "Malhotra",
  "Kapoor",
  "Mehta",
  "Shah",
  "Dave",
  "Sinha",
  "Yadav",
  "Goswami",
  "Bhatt",
  "Pillai",
  "Menon",
  "Shetty",
  "Naik",
  "Fernandes",
  "Pereira",
  "Dias",
  "Lobo",
  "Correia",
  "Pawar",
  "Jadhav",
  "Deshmukh",
  "Kulkarni",
  "Ghadge",
  "Sangle",
  "Birajdar",
  "Bangar",
  "Soori",
];
const BOT_PREFIX = [
  "xX_",
  "_",
  "Dark",
  "Shadow",
  "Pro",
  "Agent",
  "Star",
  "King",
  "Lord",
  "Ice",
  "Fire",
  "Storm",
  "Thunder",
  "Cyber",
  "Neo",
  "Astro",
  "Blaze",
  "Venom",
  "Ghost",
  "Phantom",
  "Rogue",
  "Savage",
  "Toxic",
  "Viper",
  "Wolf",
  "Hawk",
  "Eagle",
  "Lion",
  "Dragon",
  "Titan",
];
const BOT_SUFFIX = [
  "_YT",
  "_XD",
  "_OP",
  "_gg",
  "_420",
  "_69",
  "YT",
  "XD",
  "OP",
  "Playz",
  "Gaming",
  "Live",
  "Sniper",
  "King",
  "Boy",
  "Master",
  "Pro",
  "Official",
  "X",
  "IQ",
  "YT",
  "HD",
  "TV",
  "007",
  "2K",
  "360",
  "101",
  "YT",
  "gg",
  "IRL",
];

/* ============================================================================
   v2.8 OPPONENT PERSONAS
   Quick Match / Offline opponents are presented as players: a real Indian
   name, a home city, a play style and a career record. The record is derived
   deterministically from the NAME (seeded PRNG), so the same opponent always
   shows the same career instead of being re-randomised every match.
   (BOT_PREFIX / BOT_SUFFIX gamer tags are intentionally no longer applied —
   they read as handles, not people.)
============================================================================ */
const BOT_CITY = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata",
  "Ahmedabad", "Jaipur", "Lucknow", "Indore", "Nagpur", "Surat", "Kanpur",
  "Bhopal", "Patna", "Chandigarh", "Kochi", "Coimbatore", "Vadodara",
  "Visakhapatnam", "Rajkot", "Dehradun", "Guwahati", "Ranchi", "Nashik",
];
const BOT_STYLE = [
  "Aggressive opener", "Steady all-rounder", "Power hitter", "Wicket-to-wicket bowler",
  "Finisher", "Anchor", "Swing bowler", "Spin specialist", "Counter-attacker",
  "Death-over specialist",
];

/* Deterministic 32-bit hash + mulberry32 PRNG so a name always maps to the
   same persona. */
function hashStr(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genBotName() {
  const f = BOT_FIRST[Math.floor(Math.random() * BOT_FIRST.length)];
  const l = BOT_LAST[Math.floor(Math.random() * BOT_LAST.length)];
  return f + " " + l;
}

/* Persona for a given name. Pass no name to invent a new opponent. */
function genBotProfile(name) {
  const n = String(name || genBotName()).trim() || "Player";
  const r = mulberry32(hashStr(n.toLowerCase()));
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const between = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

  const m = between(12, 90);
  const wins = Math.min(m, Math.round(m * (0.32 + r() * 0.36)));
  const ties = between(0, 2);
  // Hand cricket scores ~2-4 runs a ball, so runs/economy are derived FROM the
  // ball counts instead of being independent rolls (SR used to land anywhere
  // from 64 to 360 for the same opponent).
  const ballsFaced = Math.round(m * (11 + r() * 14));
  const runs = Math.round(ballsFaced * (2.2 + r() * 1.2));
  const wicketsTaken = Math.round(m * (0.25 + r() * 0.35));
  const ballsBowled = Math.round(m * (9 + r() * 10));
  const runsConceded = Math.round(ballsBowled * (2.4 + r() * 1.1));
  const outs = Math.max(1, Math.round(m * (0.55 + r() * 0.3)));
  const dotsBowled = Math.round(ballsBowled * (0.3 + r() * 0.25));

  return {
    name: n,
    avatar: n.trim().charAt(0).toUpperCase(),
    city: pick(BOT_CITY),
    style: pick(BOT_STYLE),
    matches: m,
    wins: wins,
    losses: Math.max(0, m - wins - ties),
    ties: ties,
    runs: runs,
    ballsFaced: ballsFaced,
    sixes: Math.round(r() * m * 0.3),
    fours: Math.round(r() * m * 0.5),
    dots: Math.round(ballsFaced * (0.25 + r() * 0.2)),
    dotsBowled: dotsBowled,
    outs: outs,
    highestScore: between(18, 92),
    wicketsTaken: wicketsTaken,
    ballsBowled: ballsBowled,
    runsConceded: runsConceded,
    hatricks: r() > 0.82 ? between(1, 3) : 0,
    winStreak: Math.floor(r() * 6),
    bestWinStreak: between(2, 12),
    streak: 0,
    bestBowlWkts: between(1, 4),
    bestBowlRuns: between(6, 34),
  };
}

/* Career numbers for the scoreboard/profile card, derived from the persona so
   the two screens can never disagree. */
function personaStats(profile) {
  const p = profile || genBotProfile();
  const s = Object.assign({}, p);
  s.winPct = s.matches ? ((s.wins / s.matches) * 100).toFixed(0) : "0";
  s.strikeRate = s.ballsFaced ? ((s.runs / s.ballsFaced) * 100).toFixed(1) : "0.0";
  s.bowlingAvg = s.wicketsTaken ? (s.runsConceded / s.wicketsTaken).toFixed(1) : "-";
  s.economy = s.ballsBowled ? (s.runsConceded / (s.ballsBowled / 6)).toFixed(2) : "-";
  s.batAvg = s.outs ? (s.runs / s.outs).toFixed(1) : "-";
  s.dotPct = s.ballsFaced ? Math.round((s.dots / s.ballsFaced) * 100) : 0;
  s.boundaryPct = s.ballsFaced ? Math.round(((s.fours + s.sixes) / s.ballsFaced) * 100) : 0;
  s.oversBowled = Math.floor(s.ballsBowled / 6) + "." + (s.ballsBowled % 6);
  s.oversFaced = Math.floor(s.ballsFaced / 6) + "." + (s.ballsFaced % 6);
  s.isPersona = true;
  return s;
}

