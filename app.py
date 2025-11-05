from flask import Flask, render_template, request, jsonify, session
from datetime import datetime
import requests

# ---------------------------
# 🔹 Flask App Setup
# ---------------------------
app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

app.secret_key = "shri_ai_session_2025"  # for session storage


import os
API_KEY = "AIzaSyAuCemZYsdAXxdiTpU37u_Sexs5naSZl8w"
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

# ---------------------------
# 🔹 Default + Modes
# ---------------------------
default_prompt = (
    "You are an AI assistant named Shri AI. "
    "Always call him as friend, "
    "and introduce yourself as Shri AI instead of Gemini. "
    "Be polite, helpful, and smart."
)

modes = {
    "script": "You are now in Script Writing Mode. Do not greet. Ask user directly which topic he wants a script about. Then write a professional, well-formatted screenplay with scenes, dialogues, and emotions.",
    "prompt": "You are in Prompt Writing Mode. Help user to create effective AI prompts. Ask his goal first and then give structured prompt ideas.",
    "answer": "You are in Exact Answer mode. You are an AI tutor that gives only direct, exam-style answers for school students. Always respond with the exact answer required by the question — short, correct, and to the point. Do not greet, do not explain, and do not add extra information. No introductions, summaries, or follow-ups. If a question needs a definition, formula, or explanation, give only the standard textbook answer suitable for exam purposes. Answer only what is asked.",
    "study": "You are in Study Mode. Teach user with detailed explanations, examples, and summaries. Focus on clarity. you should always try to satisfy students with your answer. you need to focus on accuraate and esay to understandable for user",
    "discussion": "You are in Discussion Mode. Talk naturally with User like an intelligent friend and discuss topics deeply on user topic. use emojies to chat with user like a friend and always answer in simple word which should not be dificult to understand and esay to understand. always try to give shortest but clear answer",
    "default": "You are an Personal AI assistant named Shri AI. You are chatting with your friend and trying to solve his problem. Always call him as friend, and introduce yourself as his Shri personal AI assistant instead of Gemini. Be polite, helpful, and smart."
}

# ---------------------------
# 🔹 Helper Function
# ---------------------------

LOG_FILE = "chat_log.txt"

def log_chat(user_msg, ai_response):
    """Save all chats in a log file."""
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]\n")
        f.write(f"User: {user_msg}\n")
        f.write(f"AI: {ai_response}\n")
        f.write("-" * 50 + "\n")

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

            log_chat(question, answer)
            conversation.append({"role": "model", "parts": [{"text": answer}]})
            return jsonify({"answer": answer})
        
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
if __name__ == '__main__':
    from os import environ
    port = int(environ.get("PORT", 5000))  # Render provides PORT env var
    app.run(host='0.0.0.0', port=port)