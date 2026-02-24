import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "./context/AuthContext";

/* ───────────────── INTENT DETECTION ───────────────── */
const detectIntent = (text) => {
  text = text.toLowerCase();

  if (/(hi|hello|hey|ok|okay)/.test(text)) return "GREETING";
  if (/(thank|thanks)/.test(text)) return "THANKS";

  if (/(appointment|appointments|schedule|booking)/.test(text))
    return "APPOINTMENT";

  if (/(heart rate|pulse|bpm)/.test(text)) return "HEART";
  if (/(oxygen|spo2|o2)/.test(text)) return "OXYGEN";
  if (/(blood|sugar|glucose|diabetes)/.test(text)) return "BLOOD";
  if (/(blood pressure|bp)/.test(text)) return "BP";

  return "UNKNOWN";
};

/* ───────────────── COMPONENT ───────────────── */
export default function AiChatbot() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${user?.name || "there"}! 👋 I'm your AI Health Assistant.`,
    },
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  /* ───────────────── SEND MESSAGE ───────────────── */
  const send = async () => {
    if (!input.trim() || typing) return;

    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setTyping(true);

    const intent = detectIntent(text);

    /* ───── APPOINTMENT FETCH ───── */
    if (intent === "APPOINTMENT") {
      try {
        const res = await fetch(
          `http://localhost:8080/api/appointments/my/${user.id}`
        );
        const data = await res.json();

        const reply =
          data.length === 0
            ? "📅 You have no upcoming appointments."
            : `📅 You have ${data.length} appointment(s):\n\n` +
              data
                .map(
                  (a) =>
                    `• ${a.date} at ${a.time} with Dr. ${a.doctorName}`
                )
                .join("\n");

        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "⚠️ Failed to fetch appointments." },
        ]);
      }
      setTyping(false);
      return;
    }

    /* ───── BASIC RESPONSES ───── */
    setTimeout(() => {
      let reply = "";

      switch (intent) {
        case "GREETING":
          reply =
            "👋 Hi! I can help you with health info and your appointments.";
          break;

        case "THANKS":
          reply = "😊 You're welcome! Stay healthy.";
          break;

        case "HEART":
          reply =
            "❤️ **Normal heart rate** is **60–100 bpm** for adults.\n• Above 100 = Tachycardia\n• Below 60 = Bradycardia";
          break;

        case "OXYGEN":
          reply =
            "🫁 **Normal oxygen level (SpO₂)** is **95–100%**.\nBelow 90% is an emergency 🚨";
          break;

        case "BLOOD":
          reply =
            "🩸 **Blood sugar levels (fasting):**\n• Normal: 70–100 mg/dL\n• Prediabetes: 100–125 mg/dL\n• Diabetes: 126+ mg/dL";
          break;

        case "BP":
          reply =
            "🩺 **Normal BP** is **120/80 mmHg**.\n140/90 or above is high BP.";
          break;

        default:
          reply =
            "🤖 I can help with:\n• Heart rate\n• Blood pressure\n• Oxygen level\n• Blood sugar\n• Appointments";
      }

      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setTyping(false);
    }, 600);
  };

  /* ───────────────── UI ───────────────── */
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 25,
          right: 25,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#1976d2,#42a5f5)",
          color: "white",
          fontSize: 24,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(25,118,210,.5)",
        }}
      >
        🤖
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 25,
            width: 360,
            height: 520,
            background: "#fff",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 10px 40px rgba(0,0,0,.2)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg,#1565c0,#1976d2)",
              padding: 14,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            🤖
            <div>
              <div style={{ fontWeight: 700 }}>AI Health Assistant</div>
              <div style={{ fontSize: 12 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    background: "#4caf50",
                    borderRadius: "50%",
                    marginRight: 6,
                  }}
                />
                Active
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: 12,
              background: "#f4f9ff",
              overflowY: "auto",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    background:
                      m.role === "user" ? "#1976d2" : "#ffffff",
                    color:
                      m.role === "user" ? "#fff" : "#263238",
                    padding: "10px 14px",
                    borderRadius:
                      m.role === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    maxWidth: "80%",
                    boxShadow: "0 2px 6px rgba(0,0,0,.1)",
                    whiteSpace: "pre-line",
                    fontSize: 13,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ fontSize: 12, color: "#777" }}>
                AI is typing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: 10,
              display: "flex",
              gap: 8,
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask something..."
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #cfd8dc",
                outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              style={{
                width: 42,
                borderRadius: 10,
                background: input.trim() ? "#1976d2" : "#ccc",
                color: "white",
                border: "none",
                cursor: input.trim()
                  ? "pointer"
                  : "not-allowed",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}