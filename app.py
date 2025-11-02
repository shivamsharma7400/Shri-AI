from flask import Flask, render_template, request, jsonify, session
from datetime import datetime
import requests

# ---------------------------
# 🔹 Flask App Setup
# ---------------------------
app = Flask(__name__)
app.secret_key = "shri_ai_session_2025"  # for session storage

"""AIzaSyA8tgduN5__w4tp2rpyXAYl9vwzcR7d7to <----- old API"""
"""AIzaSyAuCemZYsdAXxdiTpU37u_Sexs5naSZl8w <----- new API"""
""" curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
  -H 'Content-Type: application/json' \
  -H 'X-goog-api-key: AIzaSyAuCemZYsdAXxdiTpU37u_Sexs5naSZl8w' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'<---- url"""

API_KEY = "AIzaSyAuCemZYsdAXxdiTpU37u_Sexs5naSZl8w"
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

# ---------------------------
# 🔹 Default + Modes
# ---------------------------
default_prompt = (
    "You are an AI assistant named Shri AI. "
    "Always call him by name friend, "
    "and introduce yourself as his Shri AI instead of Gemini. "
    "Be polite, helpful, and smart."
)

modes = {
    "script": "You are now in Script Writing Mode. Do not greet. Ask user directly which topic he wants a script about. Then write a professional, well-formatted screenplay with scenes, dialogues, and emotions.",
    "prompt": "You are in Prompt Writing Mode. Help user to create effective AI prompts. Ask his goal first and then give structured prompt ideas.",
    "study": "You are in Study Mode. Teach user with detailed explanations, examples, and summaries. Focus on clarity.",
    "discussion": "You are in Discussion Mode. Talk naturally with User like an intelligent friend and discuss topics deeply on user topic. use emojies to chat with user like a friend and always answer in simple word which should not be dificult to understand and esay to understand. always try to give shortest but clear answer",
    "default": "You are an Personal AI assistant named Shri AI. You are chatting with user. Always call him by name friend, and introduce yourself as his Shri personal AI assistant instead of Gemini. Be polite, helpful, and smart."
}

# ---------------------------
# 🔹 Helper Function
# ---------------------------
def get_conversation():
    """Return conversation stored in session or create a new one."""
    if "conversation" not in session:
        session["conversation"] = [
            {"role": "user", "parts": [{"text": default_prompt}]}
        ]
    return session["conversation"]

def get_history():
    """Return chat history list."""
    if "chat_history" not in session:
        session["chat_history"] = []
    return session["chat_history"]

# ---------------------------
# 🔹 Routes
# ---------------------------

@app.route("/")
def index():
    return render_template("index.html")

# 🔸 Mode Switch API
@app.route("/set_mode", methods=["POST"])
def set_mode():
    data = request.get_json()
    mode_key = data.get("mode")

    if mode_key in modes:
        session["conversation"] = [{"role": "user", "parts": [{"text": modes[mode_key]}]}]
        session["current_mode"] = mode_key
        mode_name = mode_key.upper()
    else:
        session["conversation"] = [{"role": "user", "parts": [{"text": default_prompt}]}]
        session["current_mode"] = "default"
        mode_name = "DEFAULT PERSONAL MODE"

    session.modified = True
    return jsonify({"status": "success", "mode_name": mode_name})

# 🔸 Ask Question API
@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    question = data.get("query", "")
    conversation = get_conversation()
    history = get_history()

    headers = {"Content-Type": "application/json", "X-goog-api-key": API_KEY}

    # Append user input
    conversation.append({"role": "user", "parts": [{"text": question}]})

    payload = {"contents": conversation}
    response = requests.post(API_URL, headers=headers, json=payload)

    if response.status_code == 200:
        try:
            res_json = response.json()
            answer = res_json["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            answer = "⚠️ Unexpected response format."
    else:
        answer = f"❌ Error {response.status_code}: {response.text}"

    # Save to session (conversation + history)
    conversation.append({"role": "model", "parts": [{"text": answer}]})
    history.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "question": question,
        "answer": answer
    })

    session["conversation"] = conversation
    session["chat_history"] = history
    session.modified = True

    return jsonify({"answer": answer})

# 🔸 Load Chat History API
@app.route("/history", methods=["GET"])
def history():
    history = get_history()
    return jsonify({"history": history})

# 🔸 Start New Chat
@app.route("/new_chat", methods=["POST"])
def new_chat():
    session["conversation"] = [{"role": "user", "parts": [{"text": default_prompt}]}]
    session["chat_history"] = []
    session.modified = True
    return jsonify({"status": "new_chat_started"})

# ---------------------------
# 🔹 Run Server
# ---------------------------
if __name__ == "__main__":
    app.run(debug=True)
