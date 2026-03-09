const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

const conversationHistory = [];

input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 150) + "px";
});

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    conversationHistory.push({ role: "user", content: text });
    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;

    const assistantEl = appendMessage("assistant", "");

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: conversationHistory }),
        });

        if (!res.ok) {
            const err = await res.text();
            assistantEl.textContent = "Error: " + err;
            sendBtn.disabled = false;
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value, { stream: true });
            assistantEl.textContent = fullResponse;
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        conversationHistory.push({ role: "assistant", content: fullResponse });
    } catch (err) {
        if (!fullResponse) {
            assistantEl.textContent = "Error: " + err.message;
        }
    }

    sendBtn.disabled = false;
    input.focus();
});

function appendMessage(role, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message " + role;
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.textContent = text;
    msgDiv.appendChild(contentDiv);
    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return contentDiv;
}
