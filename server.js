"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const process = require("process");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const VOTES_FILE = path.join(__dirname, "votes.json");
const VOTES_TMP = path.join(__dirname, "votes.json.tmp");

// Middleware to parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// Serve static assets (css, js, html if requested with explicit filename)
app.use(express.static(PUBLIC_DIR));

// Helper: load state from votes.json (or return initial state)
async function loadState() {
  try {
    const raw = await fs.readFile(VOTES_FILE, { encoding: "utf8" });
    const data = JSON.parse(raw);

    const jajang = Number(data && data.jajang);
    const jjamppong = Number(data && data.jjamppong);

    return {
      jajang: Number.isFinite(jajang) && jajang >= 0 ? Math.floor(jajang) : 0,
      jjamppong: Number.isFinite(jjamppong) && jjamppong >= 0 ? Math.floor(jjamppong) : 0,
    };
  } catch (err) {
    // If file doesn't exist or parse failed, initialize with zeros
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) {
      return { jajang: 0, jjamppong: 0 };
    }
    // For JSON parse errors or other IO issues, log and return zeros
    console.error("Failed to read or parse votes.json, initializing to zeros:", err);
    return { jajang: 0, jjamppong: 0 };
  }
}

// Helper: save state to votes.json using tmp+rename for atomic-ish update
async function saveState(state) {
  const payload = JSON.stringify({
    jajang: Number.isFinite(state.jajang) ? Math.floor(state.jajang) : 0,
    jjamppong: Number.isFinite(state.jjamppong) ? Math.floor(state.jjamppong) : 0,
  }, null, 2);

  // Write to tmp file first
  await fs.writeFile(VOTES_TMP, payload, { encoding: "utf8" });
  // Rename tmp to actual file (atomic on most platforms)
  await fs.rename(VOTES_TMP, VOTES_FILE);
}

// Route: root -> redirect to /vote
app.get("/", (req, res) => {
  res.redirect(302, "/vote");
});

// Explicitly serve vote.html and result.html to ensure /vote and /result work
app.get("/vote", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "vote.html"));
});

app.get("/result", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "result.html"));
});

// POST /vote - accept form-encoded body and increment count, then redirect to /result
app.post("/vote", async (req, res) => {
  try {
    const vote = typeof req.body === "object" && req.body ? String(req.body.vote || "") : "";

    if (vote !== "jajang" && vote !== "jjamppong") {
      return res.status(400).send("Invalid vote");
    }

    // Load, increment, save
    const state = await loadState();
    if (vote === "jajang") {
      state.jajang = (Number.isFinite(state.jajang) ? state.jajang : 0) + 1;
    } else {
      state.jjamppong = (Number.isFinite(state.jjamppong) ? state.jjamppong : 0) + 1;
    }

    await saveState(state);

    // Redirect to result page
    return res.redirect(302, "/result");
  } catch (err) {
    console.error("Error handling POST /vote:", err);
    return res.status(500).send("Server error");
  }
});

// GET /api/result - return JSON with current counts
app.get("/api/result", async (req, res) => {
  try {
    const state = await loadState();
    res.json({
      jajang: state.jajang,
      jjamppong: state.jjamppong,
    });
  } catch (err) {
    console.error("Error handling GET /api/result:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Ensure votes.json exists on startup (create if missing) to avoid race on first write
(async function ensureInitialState() {
  try {
    // If file exists, validate it by attempting to load via loadState
    const current = await loadState();
    // Persist normalized/validated state to ensure file is present
    await saveState(current);
  } catch (err) {
    console.error("Failed to ensure initial votes.json:", err);
    // Attempt a synchronous fallback write to ensure file exists
    try {
      const fallback = { jajang: 0, jjamppong: 0 };
      fsSync.writeFileSync(VOTES_FILE, JSON.stringify(fallback, null, 2), "utf8");
    } catch (err2) {
      console.error("Fallback write failed:", err2);
    }
  }
})();

// Start server
app.listen(PORT, () => {
  console.log(`Voting app server listening on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  GET /vote       -> vote page");
  console.log("  POST /vote      -> submit vote (form data)");
  console.log("  GET /result     -> result page");
  console.log("  GET /api/result -> JSON results");
});








// "use strict";

// const express = require("express");
// const path = require("path");
// const fs = require("fs/promises");

// const app = express();

// // ===== Config =====
// const PORT = process.env.PORT || 3000;
// const PUBLIC_DIR = path.join(__dirname, "public");

// // 재시작 후 유지(가산점)까지 노리기 위해 파일 저장(루트에 유지)
// const STORE_PATH = path.join(__dirname, "votes.json");
// const TMP_STORE_PATH = path.join(__dirname, "votes.json.tmp");

// const VALID_VOTES = new Set(["jajang", "jjamppong"]);
// const INITIAL_STATE = Object.freeze({ jajang: 0, jjamppong: 0 });

// // ===== Middleware =====
// // 정적 서빙: /css/style.css, /js/vote.js, /js/result.js, vote.html, result.html 등
// app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

// // vote.js는 application/x-www-form-urlencoded 로 POST함
// app.use(express.urlencoded({ extended: false }));

// // ===== Storage (file-based) =====
// async function loadState() {
//   try {
//     const raw = await fs.readFile(STORE_PATH, "utf8");
//     const data = JSON.parse(raw);

//     const jajang = Number(data?.jajang);
//     const jjamppong = Number(data?.jjamppong);

//     if (!Number.isFinite(jajang) || !Number.isFinite(jjamppong) || jajang < 0 || jjamppong < 0) {
//       return { ...INITIAL_STATE };
//     }
//     return { jajang: Math.floor(jajang), jjamppong: Math.floor(jjamppong) };
//   } catch {
//     // 파일이 없거나 파싱 실패하면 초기값
//     return { ...INITIAL_STATE };
//   }
// }

// async function saveState(state) {
//   // 가능한 범위에서 원자적 저장: tmp -> rename
//   const payload = JSON.stringify(
//     {
//       jajang: Math.floor(state.jajang),
//       jjamppong: Math.floor(state.jjamppong),
//       updatedAt: new Date().toISOString(),
//     },
//     null,
//     2
//   );

//   await fs.writeFile(TMP_STORE_PATH, payload, "utf8");
//   await fs.rename(TMP_STORE_PATH, STORE_PATH);
// }

// // ===== Routes =====
// app.get("/", (_req, res) => {
//   res.redirect(302, "/vote");
// });

// // vote.html 제공
// app.get("/vote", (_req, res) => {
//   res.sendFile(path.join(PUBLIC_DIR, "vote.html"));
// });

// // result.html 제공
// app.get("/result", (_req, res) => {
//   res.sendFile(path.join(PUBLIC_DIR, "result.html"));
// });

// // 결과 JSON 제공: result.js가 주기적으로 GET /api/result 호출
// app.get("/api/result", async (_req, res) => {
//   try {
//     const state = await loadState();
//     res.status(200).json({ jajang: state.jajang, jjamppong: state.jjamppong });
//   } catch (err) {
//     console.error("[GET /api/result] error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // 투표 처리: vote.js가 POST /vote (x-www-form-urlencoded)로 요청
// app.post("/vote", async (req, res) => {
//   try {
//     const vote = String(req.body?.vote || "").trim();

//     if (!VALID_VOTES.has(vote)) {
//       // vote.js는 비정상 값이면 alert를 띄우고 종료하므로 400이 적절
//       return res.status(400).send("Invalid vote option.");
//     }

//     const state = await loadState();
//     state[vote] = (state[vote] || 0) + 1;

//     await saveState(state);

//     // vote.js는 fetch redirect follow를 사용하며, redirected면 res.url로 이동함
//     return res.redirect(302, "/result");
//   } catch (err) {
//     console.error("[POST /vote] error:", err);
//     return res.status(500).send("Server error.");
//   }
// });

// // 404
// app.use((_req, res) => {
//   res.status(404).send("Not Found");
// });

// // ===== Start =====
// app.listen(PORT, () => {
//   console.log(`Server running: http://localhost:${PORT}`);
//   console.log("Endpoints:");
//   console.log("  GET  /vote");
//   console.log("  POST /vote");
//   console.log("  GET  /result");
//   console.log("  GET  /api/result");
// });