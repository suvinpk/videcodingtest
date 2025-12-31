"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("vote-form");
  const submitBtn = document.getElementById("vote-submit-btn");
  const firstRadio = document.getElementById("vote-jajang"); // used for reportValidity fallback
  const secondRadio = document.getElementById("vote-jjamppong");

  // Fail safely if required elements are missing
  if (!form || !submitBtn || !firstRadio || !secondRadio) {
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const vote = getSelectedVote(form);

    if (!vote) {
      // Prefer reportValidity if possible
      try {
        // attach a temporary custom validity to the first radio and report
        firstRadio.setCustomValidity("하나를 선택해 주세요.");
        // reportValidity will show the browser's validation UI
        if (typeof firstRadio.reportValidity === "function") {
          firstRadio.reportValidity();
        } else {
          // Fallback to alert
          alert("하나를 선택해 주세요.");
        }
      } finally {
        // clear custom validity regardless
        firstRadio.setCustomValidity("");
      }
      return;
    }

    // Validate value strictly
    if (vote !== "jajang" && vote !== "jjamppong") {
      alert("유효하지 않은 선택입니다.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await postVote(vote);

      // If server redirected, prefer the redirected URL
      if (res && res.redirected) {
        const dest = res.url || "/result";
        location.assign(dest);
        return;
      }

      // If OK (2xx), navigate to /result
      if (res && res.ok) {
        location.assign("/result");
        return;
      }

      // Non-2xx and not redirected
      console.error("Vote failed:", res);
      alert("투표에 실패했습니다. 다시 시도해 주세요.");
    } catch (err) {
      console.error("Network or unexpected error while voting:", err);
      alert("투표에 실패했습니다. 네트워크를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  });

  // Helper: get selected vote value or null
  function getSelectedVote(rootForm) {
    if (!rootForm) return null;
    const checked = rootForm.querySelector('input[name="vote"]:checked');
    return checked ? checked.value : null;
  }

  // Helper: POST vote to server
  async function postVote(voteValue) {
    const body = new URLSearchParams();
    body.set("vote", voteValue);

    const resp = await fetch("/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
      credentials: "same-origin",
      redirect: "follow",
    });

    return resp;
  }

  // Helper: toggle submitting UI state
  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = Boolean(isSubmitting);
    submitBtn.setAttribute("aria-busy", isSubmitting ? "true" : "false");
  }
});

















// [Task: Implement vote.js for the /vote page — submit vote and navigate to /result]

// Context:
// - This script runs only on vote.html (GET /vote).
// - DOM contract is fixed; do not assume any other elements exist.
// - Vote must be sent to the server as POST /vote.
// - After successful voting, user must be navigated to /result.

// DOM contract (MUST use these IDs):
// - form#vote-form
// - input#vote-jajang  (type=radio, name="vote", value="jajang", required)
// - input#vote-jjamppong (type=radio, name="vote", value="jjamppong")
// - button#vote-submit-btn

// Requirements:
// 1) Use strict mode at top.
// 2) Add a DOMContentLoaded handler.
// 3) In init:
// - Find required elements by ID.
// - If any element is missing, fail safely (return without throwing).
// 4) Handle form submit:
// - Prevent default.
// - Determine the selected radio via querySelector('input[name="vote"]:checked').
// - Validate the value must be exactly "jajang" or "jjamppong".
//   - If invalid or missing selection, show a simple UX:
//     - Use alert("하나를 선택해 주세요.") OR setCustomValidity + reportValidity.
//     - Prefer reportValidity to avoid extra DOM.
// 5) POST request:
// - Send to POST /vote with fetch.
// - Use Content-Type: application/x-www-form-urlencoded.
// - Body must be: vote=jajang OR vote=jjamppong (URLSearchParams is OK).
// - Include credentials: "same-origin" to support cookie-based abuse prevention.
// 6) UX during submit:
// - Disable submit button while request in flight.
// - Re-enable on failure.
// 7) Success criteria:
// - If response is redirect (response.redirected) OR response.ok:
//   - Navigate to /result using location.assign("/result").
//   - If response.redirected and response.url exists, you may use location.assign(response.url).
// 8) Error handling:
// - If non-2xx and not redirected, show alert with a short message (e.g. "투표에 실패했습니다. 다시 시도해 주세요.").
// - Log details to console for debugging, but keep user message simple.
// 9) No external libraries. No global variables other than constants.
// 10) Keep functions small:
// - getSelectedVote()
// - postVote(vote)
// - setSubmitting(isSubmitting)

// Output:
// - Produce complete, runnable JS code for public/js/vote.js only.
// - Do not write any HTML or CSS.

// "use strict";
// document.addEventListener("DOMContentLoaded", init);
// function init() {
//     const form = document.getElementById("vote-form");
//     const submitBtn = document.getElementById("vote-submit-btn");
//     if (!form || !submitBtn) {
//         return; // Fail safely if elements are missing
//     }

//     form.addEventListener("submit", async (event) => {
//         event.preventDefault();
//         const vote = getSelectedVote();
//         if (!vote) {
//             alert("하나를 선택해 주세요.");
//             return;
//         }

//         setSubmitting(true, submitBtn);
//         try {
//             const response = await postVote(vote);
//             if (response.redirected || response.ok) {
//                 location.assign(response.redirected && response.url ? response.url : "/result");
//             } else {
//                 alert("투표에 실패했습니다. 다시 시도해 주세요.");
//                 console.error("Vote submission failed:", response.status, response.statusText);
//                 setSubmitting(false, submitBtn);
//             }
//         } catch (error) {
//             alert("투표에 실패했습니다. 다시 시도해 주세요.");
//             console.error("Error during vote submission:", error);
//             setSubmitting(false, submitBtn);
//         }
//     });
// }
// function getSelectedVote() {
//     const selectedInput = document.querySelector('input[name="vote"]:checked');
//     if (selectedInput && (selectedInput.value === "jajang" || selectedInput.value === "jjamppong")) {
//         return selectedInput.value;
//     }
//     return null;
// }
// async function postVote(vote) {
//     const response = await fetch("/vote", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: new URLSearchParams({ vote }),
//         credentials: "same-origin",
//     });
//     return response;
// }
// function setSubmitting(isSubmitting, submitBtn) {
//     submitBtn.disabled = isSubmitting;
// }

