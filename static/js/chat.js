// 🌐 ELEMENTS
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const modeButtons = document.querySelectorAll(".box");
const chatHistoryDiv = document.getElementById("chatHistory");


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
  div.className = "msg" + cls;
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

function formatAIText(text) {
  
  // TABLE SUPPORT ---------------------
  // Convert markdown tables to HTML
  if (text.includes("|")) {
    const lines = text.trim().split("\n");
    let htmlTable = "";
    
    if (lines[0].includes("|") && lines[1] && lines[1].includes("---")) {
      htmlTable += "<table class='ai-table'>";
      const headerCells = lines[0].split("|").map(h => h.trim()).filter(Boolean);
      htmlTable += "<tr>" + headerCells.map(h => `<th>${h}</th>`).join("") + "</tr>";

      for (let i = 2; i < lines.length; i++) {
        if (!lines[i].includes("|")) break;
        const row = lines[i].split("|").map(c => c.trim()).filter(Boolean);
        htmlTable += "<tr>" + row.map(c => `<td>${c}</td>`).join("") + "</tr>";
      }

      htmlTable += "</table>";
      text = htmlTable;
    }
  }

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Italic
  text = text.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Inline code
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');

  // Links
  text = text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" class="ai-link">$1</a>'
  );

  // Line breaks
  text = text.replace(/\n/g, '<br>');

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

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
});

// 🔹 Press Enter to send message, Shift+Enter for new line
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendQuery();
  }
});

input.addEventListener('focus', () => {
  setTimeout(() => {
    input.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 300);
});


// ---------- Question Generator Mode ----------
const questionModeBtn = document.getElementById("questionMode");
const questionModal = document.getElementById("questionModal");
const closeBtn = document.querySelector(".close-btn");
const generateBtn = document.getElementById("generateBtn");



questionModeBtn.onclick = () => {
  questionModal.style.display = "block";
};

// Open popup
questionModeBtn.onclick = () => {
  questionModal.style.display = "flex"; // ✅ important (was missing)
};

closeBtn.onclick = () => {
  questionModal.style.display = "none";
};
window.onclick = (e) => {
  if (e.target === questionModal) questionModal.style.display = "none";
};

generateBtn.onclick = async () => {
  const topic = document.getElementById("topic").value.trim();
  const qClass = document.getElementById("qClass").value;
  const qLang = document.getElementById("qLang").value; 
  const level = document.getElementById("level").value;
  const mcq = document.getElementById("mcq").value;
  const vshort = document.getElementById("vshort").value;
  const shortq = document.getElementById("short").value;
  const longq = document.getElementById("long").value;

  if (!topic) {
    alert("Please enter a topic!");
    return;
  }

  questionModal.style.display = "none";

  // Show loading message
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML += `<div class="message ai">🧠 Generating questions on "${topic}"...</div>`;

  const res = await fetch("/generate_questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, level, mcq, vshort, shortq, longq, qClass, qLang })
  });
  const data = await res.json();

  chatBox.innerHTML += `<div class="msg">${data.answer}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
};
