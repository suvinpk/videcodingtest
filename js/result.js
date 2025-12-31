"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const spanJajang = document.getElementById("count-jajang");
  const spanJjamppong = document.getElementById("count-jjamppong");

  // Fail safely if required elements are missing
  if (!spanJajang || !spanJjamppong) {
    return;
  }

  const POLL_INTERVAL = 1500;
  let pollId = null;
  let lastGood = {
    jajang: Number(spanJajang.textContent) || 0,
    jjamppong: Number(spanJjamppong.textContent) || 0,
  };

  // Fetch raw result JSON
  async function fetchResult() {
    const res = await fetch("/api/result", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json",
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`Unexpected response ${res.status}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    const data = await res.json();
    return data;
  }

  // Validate the shape and types of the result
  function validateResult(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid result: not an object");
    }
    const { jajang, jjamppong } = data;
    if (!Number.isFinite(jajang) || jajang < 0) {
      throw new Error("Invalid jajang count");
    }
    if (!Number.isFinite(jjamppong) || jjamppong < 0) {
      throw new Error("Invalid jjamppong count");
    }
    return {
      jajang: Math.floor(jajang),
      jjamppong: Math.floor(jjamppong),
    };
  }

  // Render to the DOM (safe updates)
  function renderResult({ jajang, jjamppong }) {
    // Update only when numbers are finite
    if (Number.isFinite(jajang)) {
      spanJajang.textContent = String(jajang);
    }
    if (Number.isFinite(jjamppong)) {
      spanJjamppong.textContent = String(jjamppong);
    }
  }

  // Load, validate, render, and handle errors
  async function loadResult() {
    try {
      const data = await fetchResult();
      const validated = validateResult(data);
      renderResult(validated);
      lastGood = validated;
    } catch (err) {
      // Keep last successful numbers on screen; log for debugging
      console.error("Failed to load results:", err);
      // Optionally show non-intrusive UI later; for now we keep the UI unchanged
    }
  }

  function startPolling() {
    if (pollId !== null) return;
    pollId = setInterval(loadResult, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollId === null) return;
    clearInterval(pollId);
    pollId = null;
  }

  // Visibility optimization
  function handleVisibilityChange() {
    if (document.hidden) {
      stopPolling();
      return;
    }
    // When visible again: fetch immediately and restart polling
    loadResult().catch((err) => console.error("Immediate reload failed:", err));
    startPolling();
  }

  // Init: fetch once and start polling if visible
  loadResult().catch((err) => {
    console.error("Initial load failed:", err);
  });

  if (!document.hidden) {
    startPolling();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange, false);
});














// // [Task: Implement result.js for the /result page — fetch and render results with optional polling]

// // Context:
// // - This script runs only on result.html (GET /result).
// // - Result data is owned by the server.
// // - Client should GET /api/result to render counts.
// // - "Real-time" requirement should be satisfied via polling (simple setInterval).

// // DOM contract (MUST use these IDs):
// // - ul#result-list (exists but you only need to update the counts)
// // - span#count-jajang
// // - span#count-jjamppong
// // - a#revote-link (href="/vote") exists for navigation; JS does not need to handle click.

// // API contract:
// // - GET /api/result returns JSON:
// //   { "jajang": number, "jjamppong": number }

// // Requirements:
// // 1) Use strict mode at top.
// // 2) Add a DOMContentLoaded handler.
// // 3) In init:
// // - Find required elements by ID:
// //   - count-jajang, count-jjamppong
// // - If missing, fail safely (return without throwing).
// // 4) Implement loadResult():
// // - fetch GET /api/result with credentials: "same-origin".
// // - If response not ok, throw.
// // - Parse JSON.
// // - Validate:
// //   - data.jajang and data.jjamppong are finite numbers and >= 0
// //   - If invalid, throw.
// // - Render:
// //   - set textContent of #count-jajang and #count-jjamppong
// //   - Use Math.floor for safety (counts should be integers).
// // 5) Implement polling:
// // - Call loadResult() once immediately on init.
// // - Start setInterval(loadResult, 1500) (1~2 seconds is fine).
// // - Add visibility optimization:
// //   - When document.hidden is true, stop polling (clearInterval).
// //   - When visible again, restart polling and immediately load once.
// // 6) Error handling:
// // - If loadResult fails:
// //   - Log error to console.
// //   - Keep last successful numbers on screen (do not blank them).
// //   - Optionally implement a small backoff counter (optional; keep simple).
// // 7) No external libraries. Minimal globals.
// // 8) Keep functions small:
// // - fetchResult()
// // - validateResult(data)
// // - renderResult(data)
// // - startPolling()
// // - stopPolling()

// // Output:
// // - Produce complete, runnable JS code for public/js/result.js only.
// // - Do not write any HTML or CSS.

// "use strict";
// document.addEventListener("DOMContentLoaded", init);
// let pollIntervalId = null;

// function init() {
//     const countJajangEl = document.getElementById("count-jajang");
//     const countJjamppongEl = document.getElementById("count-jjamppong");
//     if (!countJajangEl || !countJjamppongEl) {
//         return;
//     }
    
//     async function loadResult() {
//         try {
//         const data = await fetchResult();
//         validateResult(data);
//         renderResult(data);
//         } catch (error) {
//         console.error("Failed to load results:", error);
//         }
//     }
    
//     function handleVisibilityChange() {
//         if (document.hidden) {
//         stopPolling();
//         } else {
//         loadResult();
//         startPolling();
//         }
//     }
    
//     document.addEventListener("visibilitychange", handleVisibilityChange);
    
//     loadResult();
//     startPolling();
    
//     function startPolling() {
//         if (pollIntervalId === null) {
//         pollIntervalId = setInterval(loadResult, 1500);
//         }
//     }
    
//     function stopPolling() {
//         if (pollIntervalId !== null) {
//         clearInterval(pollIntervalId);
//         pollIntervalId = null;
//         }
//     }
//     }
// async function fetchResult() {

//     const response = await fetch("/api/result", {
//         method: "GET",
//         credentials: "same-origin",
//     });
//     if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     return data;
// }
// function validateResult(data) {
//     if (
//         typeof data.jajang !== "number" || !isFinite(data.jajang) || data.jajang < 0 ||
//         typeof data.jjamppong !== "number" || !isFinite(data.jjamppong) || data.jjamppong < 0
//     ) {
//         throw new Error("Invalid result data");
//     }
// }
// function renderResult(data) {
//     const countJajangEl = document.getElementById("count-jajang");
//     const countJjamppongEl = document.getElementById("count-jjamppong");
//     if (countJajangEl && countJjamppongEl) {
//         countJajangEl.textContent = Math.floor(data.jajang).toString();
//         countJjamppongEl.textContent = Math.floor(data.jjamppong).toString();
//     }
// }



