const STORAGE_KEY = "moodpet-data-v1";

const defaultData = {
  petName: "Mochi",
  points: 0,
  careCount: 0,
  lastCareDate: "",
  selectedMood: "",
  lastMoodDate: "",
  moodNote: "",
  moodUnlocked: false,
  diary: "",
  diaryDate: "",
  diaryUnlocked: false,
  firstCareUnlocked: false,
  championUnlocked: false
};

let data = loadData();
let selectedMood = data.lastMoodDate === today() ? data.selectedMood : "";
let toastTimer;

const $ = (id) => document.getElementById(id);

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === "object"
      ? { ...defaultData, ...saved }
      : { ...defaultData };
  } catch {
    return { ...defaultData };
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    showToast("Couldn't save data. Check your browser settings.");
  }
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function getLevel(points) {
  if (points >= 100) return "Soul Bestie ✨";
  if (points >= 50) return "Best Friend 💗";
  if (points >= 20) return "Close Friend 🌷";
  return "Little Friend";
}

function updatePet() {
  $("pet-name").value = data.petName;
  $("pet-title").textContent = data.petName || "Your little bestie";
  $("points").textContent = data.points;
  $("care-count").textContent = `${data.careCount} / 3`;
  $("level").textContent = getLevel(data.points);

  const friendship = Math.min(data.points, 100);
  $("friendship").textContent = `${friendship}%`;
  $("friendship-bar").style.width = `${friendship}%`;

  if (data.careCount >= 3) {
    $("pet-status").textContent = "Super loved today 💖";
    $("care-tip").textContent = "🌟 Amazing! You completed today's care routine!";
  } else {
    $("pet-status").textContent = "Waiting for cuddles";
    $("care-tip").textContent =
      `✨ ${3 - data.careCount} more care action(s) to complete today's routine!`;
  }

  updateRewards();
}

function updateRewards() {
  $("reward-first").classList.toggle("unlocked", data.firstCareUnlocked);
  $("reward-care").classList.toggle("unlocked", data.championUnlocked);
  $("reward-mood").classList.toggle("unlocked", data.moodUnlocked);
  $("reward-diary").classList.toggle("unlocked", data.diaryUnlocked);
}

const careMessages = {
  feed: {
    face: "🐶",
    message: "Yum yum! You know my favourite treats!",
    toast: "🦴 Treat time! Your pet feels loved. +5 points"
  },
  play: {
    face: "🐕",
    message: "Wheee! You're my favourite playmate!",
    toast: "🎾 Playtime was amazing! +5 points"
  },
  love: {
    face: "🥰",
    message: "Big cuddles! You're my safe place.",
    toast: "🤗 A little love goes a long way! +5 points"
  }
};

function careForPet(action) {
  const todayDate = today();

  if (data.lastCareDate !== todayDate) {
    data.lastCareDate = todayDate;
    data.careCount = 0;
  }

  if (data.careCount >= 3) {
    showToast("💖 You completed all today's care actions. Come back tomorrow!");
    return;
  }

  const message = careMessages[action];
  if (!message) return;

  data.careCount += 1;
  data.points += 5;
  data.firstCareUnlocked = true;

  if (data.careCount >= 3) {
    data.championUnlocked = true;
  }

  $("pet-face").textContent = message.face;
  $("pet-message").textContent = message.message;

  saveData();
  updatePet();

  showToast(
    data.careCount === 3
      ? "🏆 Care Champion unlocked! You're an amazing friend!"
      : message.toast
  );
}

function savePetName() {
  const newName = $("pet-name").value.trim();

  if (!newName) {
    showToast("Please enter a name for your pet 🐾");
    return;
  }

  data.petName = newName.slice(0, 18);
  saveData();
  updatePet();
  showToast(`💜 Hello, ${data.petName}! Let's be besties.`);
}

function chooseMood(mood) {
  selectedMood = mood;

  document.querySelectorAll(".mood-option").forEach((button) => {
    const isSelected = button.dataset.mood === mood;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function saveMood() {
  if (!selectedMood) {
    $("mood-feedback").textContent = "Choose a mood first 🌷";
    showToast("Pick the mood that feels right for you.");
    return;
  }

  const isNewDay = data.lastMoodDate !== today();

  data.selectedMood = selectedMood;
  data.lastMoodDate = today();
  data.moodNote = $("mood-note").value.trim();

  if (isNewDay) {
    data.points += 5;
  }

  data.moodUnlocked = true;
  saveData();
  updatePet();

  $("mood-feedback").textContent =
    `Your ${selectedMood.toLowerCase()} mood has been saved. Thank you for checking in! 💜`;

  showToast(
    isNewDay
      ? "🌈 Mood saved! You earned 5 friendship points."
      : "💜 Today's mood has been updated."
  );
}

function saveDiary() {
  const entry = $("diary-entry").value.trim();

  if (!entry) {
    $("diary-feedback").textContent = "Write a little something first ✨";
    showToast("Your diary is ready whenever you are.");
    return;
  }

  const isFirstNote = !data.diaryUnlocked;

  data.diary = entry;
  data.diaryDate = today();
  data.diaryUnlocked = true;

  if (isFirstNote) {
    data.points += 5;
  }

  saveData();
  updatePet();
  renderDiary();

  $("diary-feedback").textContent = "Your note is safely saved in this browser. 💗";
  showToast(isFirstNote
    ? "📔 Your first diary note is saved! +5 points"
    : "📔 Your diary note has been updated.");
}

function renderDiary() {
  $("diary-entry").value = data.diary || "";
  $("last-note").textContent = data.diary || "Your diary is waiting for your first note.";
  $("diary-date").textContent = data.diaryDate
    ? `Last saved: ${data.diaryDate}`
    : `Today: ${today()}`;
}

function restoreMood() {
  if (data.lastMoodDate === today()) {
    chooseMood(data.selectedMood);
    $("mood-note").value = data.moodNote || "";
    $("mood-feedback").textContent =
      `Today's mood: ${data.selectedMood}. You can update it anytime.`;
  } else {
    chooseMood("");
    $("mood-note").value = "";
  }
}

function resetApp() {
  const confirmed = window.confirm(
    "Reset all MoodPet data? This will erase your pet name, points, moods, and diary notes from this browser."
  );

  if (!confirmed) return;

  data = { ...defaultData };
  selectedMood = "";

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The app can still reset its current screen.
  }

  $("pet-face").textContent = "🐶";
  $("pet-message").textContent = "You make my little world brighter!";
  $("mood-feedback").textContent = "";
  $("diary-feedback").textContent = "";
  $("mood-note").value = "";

  restoreMood();
  renderDiary();
  updatePet();

  showToast("A fresh little start! Welcome back 🐾");
}

function init() {
  if (data.lastCareDate !== today()) {
    data.careCount = 0;
  }

  $("pet-name").value = data.petName;
  $("save-name").addEventListener("click", savePetName);

  $("pet-name").addEventListener("keydown", (event) => {
    if (event.key === "Enter") savePetName();
  });

  document.querySelectorAll("[data-care]").forEach((button) => {
    button.addEventListener("click", () => {
      careForPet(button.dataset.care);
    });
  });

  document.querySelectorAll(".mood-option").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      chooseMood(button.dataset.mood);
    });
  });

  $("save-mood").addEventListener("click", saveMood);
  $("save-diary").addEventListener("click", saveDiary);
  $("reset-app").addEventListener("click", resetApp);

  restoreMood();
  renderDiary();
  updatePet();
  saveData();
}

init();