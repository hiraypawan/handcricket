/* ============================================================================
 FILE: public/js/01-config.js
 ROLE: CONFIG & STATIC DATA — IPL squads (TEAMS), ALL_PLAYERS, ROLE_LIMITS (gesture rules per style), bot name pools (BOT_FIRST/LAST/PREFIX/SUFFIX/EMOJI), genBotName()/genBotProfile(), getAllowedGestures(). Loaded first. Depends on: nothing.
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
      { name: "Bolt", role: "bowler" },
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

const ROLE_LIMITS = {
  aggressive: { bat: [3, 4, 5, 6], bowl: [3, 4, 5, 6] },
  defensive: { bat: [1, 2, 3, 4], bowl: [1, 2, 3, 4] },
  balanced: { bat: [1, 2, 3, 4, 5, 6], bowl: [1, 2, 3, 4, 5, 6] },
};

function getAllowedGestures(player, isBatting) {
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
const BOT_EMOJI = [
  "🦁",
  "🐯",
  "🦅",
  "🐺",
  "💀",
  "🔥",
  "⚡",
  "🎮",
  "🎯",
  "🗡️",
  "🛡️",
  "🏹",
  "💣",
  "🏆",
  "⭐",
  "👑",
  "💎",
  "🐍",
  "🕷️",
  "🤖",
  "👽",
  "🧿",
  "🍀",
  "🎪",
  "🐉",
  "🦊",
];

function genBotName() {
  const f = BOT_FIRST[Math.floor(Math.random() * BOT_FIRST.length)];
  const l = BOT_LAST[Math.floor(Math.random() * BOT_LAST.length)];
  const usePfx = Math.random() > 0.5;
  const useSfx = Math.random() > 0.5;
  const num = Math.floor(Math.random() * 99) + 1;
  const sep = ["_", "-", ".", ""][Math.floor(Math.random() * 4)];
  let name = "";
  if (usePfx) name = BOT_PREFIX[Math.floor(Math.random() * BOT_PREFIX.length)];
  name += f;
  if (Math.random() > 0.6) name += sep + l;
  else name += l;
  if (useSfx) name += BOT_SUFFIX[Math.floor(Math.random() * BOT_SUFFIX.length)];
  else if (Math.random() > 0.7) name += num;
  return name;
}
function genBotProfile() {
  const n = genBotName();
  const m = Math.floor(Math.random() * 80) + 10;
  const w = Math.floor(m * (0.3 + Math.random() * 0.4));
  const hs =
    Math.floor(((m * (15 + Math.random() * 25)) / m) * 1.5) +
    Math.floor(Math.random() * 20);
  return {
    name: n,
    avatar: BOT_EMOJI[Math.floor(Math.random() * BOT_EMOJI.length)],
    matches: m,
    wins: w,
    losses: Math.max(0, m - w - Math.floor(Math.random() * 3)),
    ties: Math.floor(Math.random() * 3),
    runs: Math.floor(m * (15 + Math.random() * 25)),
    ballsFaced: Math.floor(m * (10 + Math.random() * 15)),
    sixes: Math.floor(Math.random() * m * 0.3),
    fours: Math.floor(Math.random() * m * 0.5),
    wicketsTaken: Math.floor(m * (0.2 + Math.random() * 0.3)),
    ballsBowled: Math.floor(m * (8 + Math.random() * 10)),
    runsConceded: Math.floor(m * (10 + Math.random() * 20)),
    winStreak: Math.floor(Math.random() * 8),
    bestWinStreak: Math.floor(Math.random() * 12) + 2,
    get strikeRate() {
      return this.ballsFaced
        ? ((this.runs / this.ballsFaced) * 100).toFixed(1)
        : "0.0";
    },
    get bowlingAvg() {
      return this.wicketsTaken
        ? (this.runsConceded / this.wicketsTaken).toFixed(1)
        : "-";
    },
    get economy() {
      return this.ballsBowled
        ? ((this.runsConceded / this.ballsBowled) * 6).toFixed(1)
        : "-";
    },
    get winPct() {
      return this.matches
        ? ((this.wins / this.matches) * 100).toFixed(0) + "%"
        : "0%";
    },
    get highestScore() {
      return hs;
    },
  };
}

