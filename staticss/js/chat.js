// 🌐 ELEMENTS
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const voiceSwitch = document.getElementById("voiceSwitch");
const voiceLabel = document.getElementById("voiceLabel");
const modeButtons = document.querySelectorAll(".box");
const chatHistoryDiv = document.getElementById("chatHistory");

// 🧠 VARIABLES
let voiceMode = false;

// 🎤 VOICE TOGGLE
voiceSwitch.addEventListener("change", () => {
  voiceMode = voiceSwitch.checked;
  voiceLabel.textContent = voiceMode ? "🔊 Speaker ON" : "🔇 Speaker OFF";
});

// 🗣️ SPEAK TEXT (Auto detects Hindi/English)
function speakText(text) {
  if (!voiceMode) return;

  const hasHindi = /[\u0900-\u097F]/.test(text);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = hasHindi ? "hi-IN" : "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find(v => v.lang === utterance.lang) || voices[0];
  speechSynthesis.speak(utterance);
}

// 💬 SEND MESSAGE
async function sendQuery() {
  const query = input.value.trim();
  if (!query) return;

  appendMessage("You: " + query, "user");
  input.value = "";

  const temp = appendMessage("🙄 Thinking...", "bot");
  temp.classList.add("typing");

  const res = await fetch("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  const answer = data.answer || "⚠️ Error getting response.";

  temp.remove();
  await typeText("Shri: ", answer, "bot");
  speakText(answer);

  saveHistory(query, answer);
  renderHistory();
}

// 🧩 APPEND MESSAGE TO CHAT
function appendMessage(text, cls) {
  const div = document.createElement("div");
  div.className = "msg " + cls;
  div.innerHTML = formatAIText(text);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

// ✍️ TYPEWRITER EFFECT
async function typeText(prefix, text, cls) {
  const div = document.createElement("div");
  div.className = "msg " + cls;
  chatBox.appendChild(div);

  for (let i = 0; i < text.length; i++) {
    div.innerHTML = prefix + formatAIText(text.substring(0, i + 1));
    chatBox.scrollTop = chatBox.scrollHeight;
    await new Promise(r => setTimeout(r, 15));
  }
}

// 🎨 TEXT FORMATTING
function formatAIText(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  text = text.replace(/\*(.*?)\*/g, "<i>$1</i>");
  text = text.replace(/`(.*?)`/g, "<code>$1</code>");
  text = text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank">$1</a>'
  );
  text = text.replace(/\n/g, "<br>");
  return text;
}

// 📦 MODE CHANGE
modeButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const mode = btn.getAttribute("data-mode");

    const res = await fetch("/set_mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode })
    });

    const data = await res.json();
    modeButtons.forEach(b => b.classList.remove("active-mode"));
    btn.classList.add("active-mode");

    appendMessage("🧠 Mode changed Sucessfully to: " + data.mode_name, "bot");
  });
});

// 🕒 LOCAL STORAGE CHAT HISTORY
function saveHistory(user, ai) {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  const timestamp = new Date().toLocaleTimeString();
  history.unshift({ user, ai, timestamp });
  if (history.length > 50) history.pop(); // keep last 50 chats
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  chatHistoryDiv.innerHTML = "";

  history.forEach((h, index) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<b>${h.timestamp}</b><br>${h.user.slice(0, 40)}...`;
    div.onclick = () => loadChat(index);
    chatHistoryDiv.appendChild(div);
  });
}

function loadChat(index) {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  const chat = history[index];
  chatBox.innerHTML = `
    <div class="msg user"><b>You:</b> ${formatAIText(chat.user)}</div>
    <div class="msg bot"><b>Shri:</b> ${formatAIText(chat.ai)}</div>
  `;
}


// 🖱️ EVENTS
sendBtn.onclick = sendQuery;
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendQuery();
});

// INITIAL LOAD
window.onload = () => {
  renderHistory();
  appendMessage("🦚🦚_Radhe Radhe Dear Friend!_🦚🦚", "bot");
};
