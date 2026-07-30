(() => {
  "use strict";

  const DEFAULT_NAMES = [
    "League Champion",
    "Runner-Up",
    "Third Place",
    "Fourth Place",
    "Fifth Place",
    "Sixth Place",
    "Seventh Place",
    "Eighth Place",
    "Ninth Place",
    "Tenth Place",
    "Eleventh Place",
    "Last Place"
  ];

  // Default entries from strongest eligible finisher (3rd) to worst finisher (12th).
  const DEFAULT_WEIGHTS_BY_FINISH = {
    3: 3,
    4: 4,
    5: 5,
    6: 7,
    7: 8,
    8: 10,
    9: 12,
    10: 14,
    11: 17,
    12: 20
  };

  const els = {
    standingsBody: document.getElementById("standingsBody"),
    maxDropInput: document.getElementById("maxDropInput"),
    maxRiseInput: document.getElementById("maxRiseInput"),
    restoreDefaultsBtn: document.getElementById("restoreDefaultsBtn"),
    startBtn: document.getElementById("startBtn"),
    resetBtn: document.getElementById("resetBtn"),
    setupMessage: document.getElementById("setupMessage"),
    drawBtn: document.getElementById("drawBtn"),
    remainingBadge: document.getElementById("remainingBadge"),
    nextPickLabel: document.getElementById("nextPickLabel"),
    statusTitle: document.getElementById("statusTitle"),
    statusText: document.getElementById("statusText"),
    constraintStatus: document.getElementById("constraintStatus"),
    ballChamber: document.getElementById("ballChamber"),
    ballsLayer: document.getElementById("ballsLayer"),
    dropBall: document.getElementById("dropBall"),
    remainingTeams: document.getElementById("remainingTeams"),
    resultsGrid: document.getElementById("resultsGrid"),
    pick12Card: document.getElementById("pick12Card"),
    pick11Card: document.getElementById("pick11Card"),
    copyBtn: document.getElementById("copyBtn"),
    confettiLayer: document.getElementById("confettiLayer")
  };

  const state = {
    started: false,
    drawing: false,
    maxDrop: 3,
    maxRise: 5,
    nextPick: 1,
    remaining: [],
    results: new Map(),
    fixed: { 12: null, 11: null }
  };

  function buildStandingsRows() {
    els.standingsBody.innerHTML = "";

    for (let finish = 1; finish <= 12; finish += 1) {
      const row = document.createElement("tr");
      const isLocked = finish <= 2;
      if (isLocked) row.classList.add("is-locked");

      const basePick = finish === 1 ? 12 : finish === 2 ? 11 : 13 - finish;
      const weight = DEFAULT_WEIGHTS_BY_FINISH[finish] ?? 0;

      row.innerHTML = `
        <td data-label="Finish"><span class="position-pill">${ordinal(finish)}</span></td>
        <td data-label="Team Name">
          <input
            class="team-input"
            data-finish="${finish}"
            type="text"
            maxlength="42"
            value="${escapeHtml(DEFAULT_NAMES[finish - 1])}"
            aria-label="Team name for ${ordinal(finish)} place"
          />
        </td>
        <td data-label="Base Pick">
          ${
            isLocked
              ? `<span class="locked-text">Locked to pick ${basePick}</span>`
              : `<span class="base-pick">#${basePick}</span>`
          }
        </td>
        <td data-label="Entries">
          ${
            isLocked
              ? `<span class="locked-text">Not in lottery</span>`
              : `<input
                  class="weight-input"
                  data-finish="${finish}"
                  type="number"
                  min="1"
                  max="999"
                  step="1"
                  value="${weight}"
                  inputmode="numeric"
                  aria-label="Weighted entries for ${ordinal(finish)} place"
                />`
          }
        </td>
      `;

      els.standingsBody.appendChild(row);
    }

    loadSavedSetup();
    addSetupPersistenceListeners();
  }

  function buildResultsBoard() {
    els.resultsGrid.innerHTML = "";

    for (let pick = 1; pick <= 10; pick += 1) {
      const card = document.createElement("article");
      card.className = "pick-card";
      card.dataset.pick = String(pick);
      card.innerHTML = `
        <span class="pick-number">Pick ${pick}</span>
        <strong>Waiting to be revealed</strong>
        <small>Lottery result</small>
      `;
      els.resultsGrid.appendChild(card);
    }
  }

  function addSetupPersistenceListeners() {
    document.querySelectorAll(".team-input, .weight-input").forEach((input) => {
      input.addEventListener("input", saveSetup);
    });
    els.maxDropInput.addEventListener("input", saveSetup);
    els.maxRiseInput.addEventListener("input", saveSetup);
  }

  function saveSetup() {
    if (state.started) return;

    const names = [...document.querySelectorAll(".team-input")].map((input) => input.value);
    const weights = {};

    document.querySelectorAll(".weight-input").forEach((input) => {
      weights[input.dataset.finish] = input.value;
    });

    const payload = {
      names,
      weights,
      maxDrop: els.maxDropInput.value,
      maxRise: els.maxRiseInput.value
    };

    try {
      localStorage.setItem("fantasyLotterySetup", JSON.stringify(payload));
    } catch {
      // The app still works if browser storage is unavailable.
    }
  }

  function loadSavedSetup() {
    try {
      const raw = localStorage.getItem("fantasyLotterySetup");
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (Array.isArray(saved.names) && saved.names.length === 12) {
        document.querySelectorAll(".team-input").forEach((input, index) => {
          input.value = saved.names[index] || DEFAULT_NAMES[index];
        });
      }

      if (saved.weights && typeof saved.weights === "object") {
        document.querySelectorAll(".weight-input").forEach((input) => {
          const savedWeight = Number(saved.weights[input.dataset.finish]);
          if (Number.isFinite(savedWeight) && savedWeight > 0) {
            input.value = String(Math.floor(savedWeight));
          }
        });
      }

      const savedMaxDrop = Number(saved.maxDrop);
      if (Number.isInteger(savedMaxDrop) && savedMaxDrop >= 0 && savedMaxDrop <= 9) {
        els.maxDropInput.value = String(savedMaxDrop);
      }

      const savedMaxRise = Number(saved.maxRise);
      if (Number.isInteger(savedMaxRise) && savedMaxRise >= 0 && savedMaxRise <= 9) {
        els.maxRiseInput.value = String(savedMaxRise);
      }
    } catch {
      // Ignore malformed saved data.
    }
  }

  function restoreDefaults() {
    if (state.started) return;

    document.querySelectorAll(".team-input").forEach((input, index) => {
      input.value = DEFAULT_NAMES[index];
    });

    document.querySelectorAll(".weight-input").forEach((input) => {
      input.value = String(DEFAULT_WEIGHTS_BY_FINISH[Number(input.dataset.finish)]);
    });

    els.maxDropInput.value = "3";
    els.maxRiseInput.value = "5";
    saveSetup();
    setSetupMessage("Default names, entries, three-down and five-up limits restored.", "success");
  }

  function readSetup() {
    const names = [...document.querySelectorAll(".team-input")].map((input) => input.value.trim());
    const lowerNames = names.map((name) => name.toLowerCase());

    if (names.some((name) => !name)) {
      throw new Error("Every standings row needs a team name.");
    }

    if (new Set(lowerNames).size !== names.length) {
      throw new Error("Each team name must be unique.");
    }

    const maxDrop = Number(els.maxDropInput.value);
    if (!Number.isInteger(maxDrop) || maxDrop < 0 || maxDrop > 9) {
      throw new Error("Maximum drop must be a whole number from 0 to 9.");
    }

    const maxRise = Number(els.maxRiseInput.value);
    if (!Number.isInteger(maxRise) || maxRise < 0 || maxRise > 9) {
      throw new Error("Maximum move up must be a whole number from 0 to 9.");
    }

    const teams = [];
    for (let finish = 3; finish <= 12; finish += 1) {
      const weightInput = document.querySelector(`.weight-input[data-finish="${finish}"]`);
      const weight = Number(weightInput.value);
      if (!Number.isFinite(weight) || weight < 1) {
        throw new Error(`Entries for ${ordinal(finish)} place must be at least 1.`);
      }

      const baselinePick = 13 - finish;
      teams.push({
        id: `team-${finish}`,
        name: names[finish - 1],
        finish,
        baselinePick,
        weight: Math.floor(weight),
        minAllowedPick: Math.max(1, baselinePick - maxRise),
        maxAllowedPick: Math.min(10, baselinePick + maxDrop)
      });
    }

    if (!canCompleteRemaining(teams, range(1, 10))) {
      throw new Error("Those movement limits do not allow a complete 10-team draft order.");
    }

    return { names, teams, maxDrop, maxRise };
  }

  function startLottery() {
    try {
      const setup = readSetup();

      state.started = true;
      state.drawing = false;
      state.maxDrop = setup.maxDrop;
      state.maxRise = setup.maxRise;
      state.nextPick = 1;
      state.remaining = setup.teams.map((team) => ({ ...team }));
      state.results = new Map();
      state.fixed = {
        12: setup.names[0],
        11: setup.names[1]
      };

      lockSetupInputs(true);
      els.startBtn.disabled = true;
      els.resetBtn.disabled = false;
      els.restoreDefaultsBtn.disabled = true;
      els.drawBtn.disabled = false;
      els.copyBtn.disabled = true;

      els.pick12Card.querySelector("strong").textContent = state.fixed[12];
      els.pick11Card.querySelector("strong").textContent = state.fixed[11];

      updateAllDisplays();
      updatePreDrawConstraint();
      setSetupMessage("Standings locked. The first click will reveal pick 1.", "success");
      els.statusTitle.textContent = "Lottery is live";
      els.statusText.textContent =
        `Every draw is checked against the ${state.maxRise}-spot up and ${state.maxDrop}-spot down safeguards.`;

      window.setTimeout(() => {
        document.querySelector(".lottery-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (error) {
      setSetupMessage(error.message, "error");
    }
  }

  function resetLottery() {
    state.started = false;
    state.drawing = false;
    state.nextPick = 1;
    state.remaining = [];
    state.results = new Map();
    state.fixed = { 12: null, 11: null };

    lockSetupInputs(false);
    els.startBtn.disabled = false;
    els.resetBtn.disabled = true;
    els.restoreDefaultsBtn.disabled = false;
    els.drawBtn.disabled = true;
    els.copyBtn.disabled = true;

    els.pick12Card.querySelector("strong").textContent = "League Champion";
    els.pick11Card.querySelector("strong").textContent = "Runner-Up";

    buildResultsBoard();
    updateAllDisplays();

    els.statusTitle.textContent = "Waiting for standings";
    els.statusText.textContent = "Enter all 12 teams and lock the standings to begin.";
    setConstraintStatus("Constraint check not started", "idle");
    setSetupMessage("Lottery reset. You may edit the standings and run it again.", "success");
  }

  function lockSetupInputs(locked) {
    document.querySelectorAll(".team-input, .weight-input").forEach((input) => {
      input.disabled = locked;
    });
    els.maxDropInput.disabled = locked;
    els.maxRiseInput.disabled = locked;
  }

  function nextDraw() {
    if (!state.started || state.drawing || state.remaining.length === 0) return;

    if (state.nextPick === 9) {
      drawFinalTwo();
      return;
    }

    const pick = state.nextPick;
    const candidates = getFeasibleCandidates(state.remaining, pick);

    if (candidates.length === 0) {
      setConstraintStatus("No legal candidate found. Reset and check the setup.", "bad");
      els.drawBtn.disabled = true;
      return;
    }

    const selected = weightedRandom(candidates);
    runAnimation(selected, `Pick #${pick}`, () => {
      assignPick(pick, selected);
      state.remaining = state.remaining.filter((team) => team.id !== selected.id);
      revealCard(pick, selected, false);

      const movement = movementDescription(selected, pick);
      els.statusTitle.textContent = `${selected.name} gets pick ${pick}`;
      els.statusText.textContent =
        `${selected.name} finished ${ordinal(selected.finish)}, had ${selected.weight} entries, and ${movement.toLowerCase()}.`;

      state.nextPick += 1;
      state.drawing = false;
      els.drawBtn.disabled = false;
      updateAllDisplays();
      updatePreDrawConstraint();
    });
  }

  function drawFinalTwo() {
    const pickNineCandidates = getFeasibleCandidates(state.remaining, 9);
    if (pickNineCandidates.length === 0) {
      setConstraintStatus("The final two could not be assigned legally.", "bad");
      els.drawBtn.disabled = true;
      return;
    }

    const pickNineTeam = weightedRandom(pickNineCandidates);
    const pickTenTeam = state.remaining.find((team) => team.id !== pickNineTeam.id);

    runAnimation(pickNineTeam, "Picks #9 and #10", () => {
      assignPick(9, pickNineTeam);
      assignPick(10, pickTenTeam);
      revealCard(9, pickNineTeam, true);
      revealCard(10, pickTenTeam, true);

      state.remaining = [];
      state.nextPick = 11;
      state.drawing = false;

      els.statusTitle.textContent = "The final two are revealed!";
      els.statusText.textContent =
        `${pickNineTeam.name} owns pick 9, and ${pickTenTeam.name} owns pick 10.`;
      setConstraintStatus(
        `Lottery complete — every team stayed within ${state.maxRise} spots up and ${state.maxDrop} spots down.`,
        "good"
      );

      els.drawBtn.disabled = true;
      els.copyBtn.disabled = false;
      updateAllDisplays();
      launchConfetti();
    });
  }

  function getFeasibleCandidates(teams, pick) {
    return teams.filter((candidate) => {
      if (!isPickAllowed(candidate, pick)) return false;

      const afterSelection = teams.filter((team) => team.id !== candidate.id);
      return canCompleteRemaining(afterSelection, range(pick + 1, 10));
    });
  }

  function isPickAllowed(team, pick) {
    return pick >= team.minAllowedPick && pick <= team.maxAllowedPick;
  }

  // Exact bipartite-matching check. This reserves legal future picks before each ball is drawn.
  function canCompleteRemaining(teams, picks) {
    if (teams.length !== picks.length) return false;
    if (teams.length === 0) return true;

    const teamById = new Map(teams.map((team) => [team.id, team]));
    const eligiblePicks = new Map(
      teams.map((team) => [
        team.id,
        picks.filter((pick) => isPickAllowed(team, pick))
      ])
    );

    if ([...eligiblePicks.values()].some((teamPicks) => teamPicks.length === 0)) {
      return false;
    }

    const orderedTeams = [...teams].sort(
      (a, b) => eligiblePicks.get(a.id).length - eligiblePicks.get(b.id).length
    );
    const pickAssignments = new Map();

    function tryAssign(team, visitedPicks) {
      for (const pick of eligiblePicks.get(team.id)) {
        if (visitedPicks.has(pick)) continue;
        visitedPicks.add(pick);

        const assignedTeamId = pickAssignments.get(pick);
        if (!assignedTeamId || tryAssign(teamById.get(assignedTeamId), visitedPicks)) {
          pickAssignments.set(pick, team.id);
          return true;
        }
      }
      return false;
    }

    for (const team of orderedTeams) {
      if (!tryAssign(team, new Set())) return false;
    }

    return true;
  }

  function weightedRandom(candidates) {
    const total = candidates.reduce((sum, team) => sum + team.weight, 0);
    let roll = Math.random() * total;

    for (const team of candidates) {
      roll -= team.weight;
      if (roll < 0) return team;
    }

    return candidates[candidates.length - 1];
  }

  function runAnimation(team, label, onComplete) {
    state.drawing = true;
    els.drawBtn.disabled = true;
    els.ballChamber.classList.add("is-spinning");
    setConstraintStatus(`Both safeguards passed. Drawing ${label}…`, "good");

    window.setTimeout(() => {
      els.dropBall.textContent = shortBallName(team.name);
      els.dropBall.classList.remove("is-dropping");
      void els.dropBall.offsetWidth;
      els.dropBall.classList.add("is-dropping");
    }, 760);

    window.setTimeout(() => {
      els.ballChamber.classList.remove("is-spinning");
      els.dropBall.classList.remove("is-dropping");
      onComplete();
    }, 1950);
  }

  function assignPick(pick, team) {
    state.results.set(pick, { ...team, pick });
  }

  function revealCard(pick, team, finalTwo) {
    const card = els.resultsGrid.querySelector(`[data-pick="${pick}"]`);
    if (!card) return;

    card.querySelector("strong").textContent = team.name;
    card.querySelector("small").textContent =
      `Finished ${ordinal(team.finish)} • Base ${team.baselinePick} • ${movementDescription(team, pick)}`;
    card.classList.add("is-revealed");
    if (finalTwo) card.classList.add("is-final-two");
  }

  function movementDescription(team, pick) {
    const movement = pick - team.baselinePick;
    if (movement < 0) return `Moved up ${Math.abs(movement)} spot${Math.abs(movement) === 1 ? "" : "s"}`;
    if (movement > 0) return `Moved down ${movement} spot${movement === 1 ? "" : "s"}`;
    return "Stayed at its base pick";
  }

  function updatePreDrawConstraint() {
    if (!state.started || state.remaining.length === 0) return;

    if (state.nextPick === 9) {
      const candidates = getFeasibleCandidates(state.remaining, 9);
      if (candidates.length > 0) {
        setConstraintStatus(
          `Final check passed: picks 9 and 10 can both be assigned legally.`,
          "good"
        );
      } else {
        setConstraintStatus("Final-two constraint check failed.", "bad");
      }
      return;
    }

    const candidates = getFeasibleCandidates(state.remaining, state.nextPick);
    if (candidates.length > 0) {
      setConstraintStatus(
        `Pick ${state.nextPick} check passed: ${candidates.length} legal team${candidates.length === 1 ? "" : "s"} available.`,
        "good"
      );
    } else {
      setConstraintStatus(`Pick ${state.nextPick} has no legal candidates.`, "bad");
    }
  }

  function updateAllDisplays() {
    const remainingCount = state.remaining.length;
    els.remainingBadge.textContent =
      `${remainingCount} team${remainingCount === 1 ? "" : "s"} remaining`;

    if (!state.started) {
      els.nextPickLabel.textContent = "Pick #1";
      els.drawBtn.textContent = "Drop Ball";
    } else if (state.nextPick <= 8) {
      els.nextPickLabel.textContent = `Pick #${state.nextPick}`;
      els.drawBtn.textContent = "Drop Ball";
    } else if (state.nextPick === 9) {
      els.nextPickLabel.textContent = "Picks #9 & #10";
      els.drawBtn.textContent = "Reveal Final Two";
    } else {
      els.nextPickLabel.textContent = "Complete";
      els.drawBtn.textContent = "Lottery Complete";
    }

    renderRemainingTeams();
    renderBalls();
  }

  function renderRemainingTeams() {
    els.remainingTeams.innerHTML = "";

    if (!state.started) {
      const placeholder = document.createElement("span");
      placeholder.className = "remaining-chip";
      placeholder.textContent = "Teams will appear after standings are locked";
      els.remainingTeams.appendChild(placeholder);
      return;
    }

    if (state.remaining.length === 0) {
      const complete = document.createElement("span");
      complete.className = "remaining-chip";
      complete.textContent = "All teams have been drawn";
      els.remainingTeams.appendChild(complete);
      return;
    }

    state.remaining.forEach((team) => {
      const chip = document.createElement("span");
      chip.className = "remaining-chip";
      chip.textContent = `${team.name} (${team.weight})`;
      chip.title =
        `Base pick ${team.baselinePick}; legal range ${team.minAllowedPick}–${team.maxAllowedPick}`;
      els.remainingTeams.appendChild(chip);
    });
  }

  function renderBalls() {
    els.ballsLayer.innerHTML = "";
    if (!state.started) return;

    const positions = [
      [9, 66], [23, 35], [38, 67], [53, 31], [68, 63],
      [78, 25], [14, 14], [34, 15], [56, 11], [74, 45]
    ];

    state.remaining.forEach((team, index) => {
      const ball = document.createElement("div");
      ball.className = "lottery-ball";
      const [left, top] = positions[index % positions.length];
      ball.style.left = `${left}%`;
      ball.style.top = `${top}%`;
      ball.style.transform = `translate(-50%, -50%) rotate(${(index * 31) % 80 - 40}deg)`;
      ball.textContent = shortBallName(team.name);
      ball.title = `${team.name}: ${team.weight} entries`;
      els.ballsLayer.appendChild(ball);
    });
  }

  async function copyResults() {
    if (state.results.size !== 10) return;

    const lines = ["Fantasy Football Draft Order"];
    for (let pick = 1; pick <= 10; pick += 1) {
      lines.push(`${pick}. ${state.results.get(pick).name}`);
    }
    lines.push(`11. ${state.fixed[11]}`);
    lines.push(`12. ${state.fixed[12]}`);

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      els.copyBtn.textContent = "Copied!";
      window.setTimeout(() => {
        els.copyBtn.textContent = "Copy Results";
      }, 1400);
    } catch {
      window.prompt("Copy the draft order:", text);
    }
  }

  function launchConfetti() {
    els.confettiLayer.innerHTML = "";
    const colors = ["#59f29b", "#ffc857", "#52a8ff", "#ff8a3d", "#ffffff"];

    for (let i = 0; i < 90; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.75}s`;
      piece.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
      piece.style.setProperty("--drift", `${-130 + Math.random() * 260}px`);
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      els.confettiLayer.appendChild(piece);
    }

    window.setTimeout(() => {
      els.confettiLayer.innerHTML = "";
    }, 4700);
  }

  function setConstraintStatus(text, type) {
    els.constraintStatus.textContent = text;
    els.constraintStatus.className = `constraint-status constraint-status--${type}`;
  }

  function setSetupMessage(text, type) {
    els.setupMessage.textContent = text;
    els.setupMessage.className = `message${type ? ` is-${type}` : ""}`;
  }

  function shortBallName(name) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 8).toUpperCase();
    return words.map((word) => word[0]).join("").slice(0, 4).toUpperCase();
  }

  function ordinal(value) {
    const mod100 = value % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`;

    switch (value % 10) {
      case 1: return `${value}st`;
      case 2: return `${value}nd`;
      case 3: return `${value}rd`;
      default: return `${value}th`;
    }
  }

  function range(start, end) {
    if (start > end) return [];
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  els.startBtn.addEventListener("click", startLottery);
  els.resetBtn.addEventListener("click", resetLottery);
  els.restoreDefaultsBtn.addEventListener("click", restoreDefaults);
  els.drawBtn.addEventListener("click", nextDraw);
  els.copyBtn.addEventListener("click", copyResults);

  buildStandingsRows();
  buildResultsBoard();
  updateAllDisplays();
})();
