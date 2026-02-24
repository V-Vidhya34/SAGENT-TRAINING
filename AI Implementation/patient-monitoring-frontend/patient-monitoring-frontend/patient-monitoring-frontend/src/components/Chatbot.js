import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Chatbot.css';

const GEMINI_KEY = 'AIzaSyBVbv8IC3DVEUlkfGekiQgcmrniJIPcM6Q';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
const BASE = 'http://localhost:8080/api';

// ─── Fetch backend data safely ────────────────────────────────────
const fetchData = async (url) => {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return [];
  }
};

// ─── Evaluate vitals ──────────────────────────────────────────────
const evaluateReading = (r) => {
  const issues = [];
  if (r.heartRate < 60)      issues.push(`Heart rate ${r.heartRate} bpm is LOW (Bradycardia)`);
  if (r.heartRate > 100)     issues.push(`Heart rate ${r.heartRate} bpm is HIGH (Tachycardia)`);
  if (r.oxygenLevel < 95)    issues.push(`Oxygen ${r.oxygenLevel}% is LOW${r.oxygenLevel < 90 ? ' — EMERGENCY' : ''}`);
  if (r.temperature > 100.4) issues.push(`Temperature ${r.temperature}°F is FEVER`);
  if (r.temperature < 97)    issues.push(`Temperature ${r.temperature}°F is LOW`);
  const bp = r.bloodPressure?.split('/');
  if (bp?.length === 2) {
    const sys = parseInt(bp[0]), dia = parseInt(bp[1]);
    if (sys >= 140 || dia >= 90) issues.push(`BP ${r.bloodPressure} is HIGH`);
    if (sys < 90  || dia < 60)  issues.push(`BP ${r.bloodPressure} is LOW`);
  }
  return issues;
};

// ─── Check if query needs backend data ───────────────────────────
const needsBackend = (text) => {
  const t = text.toLowerCase();
  return (
    /(my appointment|how many appointment|latest appointment|upcoming|scheduled)/.test(t) ||
    /(my vital|my reading|my heart rate|my bp|my blood pressure|my oxygen|my temperature|daily reading|latest reading|recent reading)/.test(t) ||
    /(my consult|how many consult|latest consult|doctor remark|my remark|consultation)/.test(t) ||
    /(my health record|medical history|past record|health data)/.test(t)
  );
};

// ─── Build backend context for Gemini ────────────────────────────
const buildContext = async (text, user) => {
  const t = text.toLowerCase();
  let ctx = '';

  if (/(appointment|scheduled|upcoming)/.test(t)) {
    const data = await fetchData(`${BASE}/appointments`);
    const mine = user?.role === 'doctor'
      ? data.filter(a => a.doctor?.name === user.name)
      : data.filter(a => a.patient?.patientId === user.id);
    if (!mine.length) {
      ctx += '\n[APPOINTMENTS]: No appointments found.\n';
    } else {
      ctx += `\n[APPOINTMENTS]: ${mine.length} appointment(s):\n`;
      mine.forEach(a => {
        ctx += `  - #${a.appointId} | Date: ${a.appointDate} | Status: ${a.status} | Doctor: Dr.${a.doctor?.name || 'N/A'} (${a.doctor?.specialization || ''}) | Patient: ${a.patient?.name || 'N/A'}\n`;
      });
    }
  }

  if (/(vital|reading|heart rate|blood pressure|oxygen|temperature|bp)/.test(t)) {
    const data = await fetchData(`${BASE}/readings`);
    const mine = data.filter(r => r.patient?.patientId === user.id);
    if (!mine.length) {
      ctx += '\n[DAILY READINGS]: No readings recorded yet.\n';
    } else {
      const latest = mine[mine.length - 1];
      const issues = evaluateReading(latest);
      ctx += `\n[DAILY READINGS]: ${mine.length} total. Latest on ${latest.recordedDate}:\n`;
      ctx += `  - Heart Rate: ${latest.heartRate} bpm\n`;
      ctx += `  - Blood Pressure: ${latest.bloodPressure}\n`;
      ctx += `  - Oxygen Level: ${latest.oxygenLevel}%\n`;
      ctx += `  - Temperature: ${latest.temperature}°F\n`;
      ctx += issues.length
        ? `  - CONCERNS: ${issues.join('; ')}\n`
        : `  - All vitals normal.\n`;
    }
  }

  if (/(consult|remark|doctor note|fee)/.test(t)) {
    const data = await fetchData(`${BASE}/consultations`);
    const mine = user?.role === 'doctor'
      ? data.filter(c => c.doctor?.name === user.name)
      : data.filter(c => c.patient?.patientId === user.id);
    if (!mine.length) {
      ctx += '\n[CONSULTATIONS]: No consultations found.\n';
    } else {
      ctx += `\n[CONSULTATIONS]: ${mine.length} consultation(s):\n`;
      mine.forEach(c => {
        ctx += `  - #${c.consultId} | Date: ${c.date} | Doctor: Dr.${c.doctor?.name || 'N/A'} | Patient: ${c.patient?.name || 'N/A'} | Remark: "${c.remark || 'None'}" | Fee: ₹${c.consultFee}\n`;
      });
    }
  }

  if (/(health record|health data|past record|medical history)/.test(t)) {
    const data = await fetchData(`${BASE}/health-data`);
    const mine = data.filter(h => h.patient?.patientId === user.id);
    if (!mine.length) {
      ctx += '\n[HEALTH RECORDS]: No records found.\n';
    } else {
      ctx += `\n[HEALTH RECORDS]: ${mine.length} record(s):\n`;
      mine.slice(-3).forEach(h => {
        ctx += `  - Date: ${h.recordedDate} ${h.recordedTime?.substring(0, 5) || ''} | Record: "${h.pastRecords}"\n`;
      });
    }
  }

  return ctx;
};

// ─── Call Gemini ──────────────────────────────────────────────────
const callGemini = async (systemPrompt, userMessage) => {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_KEY,
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser question: ${userMessage}` }],
      }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) return text;
  throw new Error('No response from Gemini');
};

// ─── Rule-based fallback ──────────────────────────────────────────
const fallback = (text) => {
  const t = text.toLowerCase();
  if (/(hello|hi|hey)/.test(t))
    return "Hello! 👋 I'm your AI health assistant. Ask me anything about your health!";
  if (/(heart rate|bpm).*(normal|range)|(normal|range).*(heart rate|bpm)/)
    return "💓 Normal heart rate: 60–100 bpm\n• Below 60 = Bradycardia\n• Above 100 = Tachycardia";
  if (/(blood pressure|bp).*(normal|range)|(normal|range).*(bp|blood pressure)/)
    return "🩺 Normal BP: 120/80 mmHg\n• High: 140/90+\n• Low: below 90/60";
  if (/(oxygen|spo2).*(normal|range)|(normal|range).*(oxygen|spo2)/)
    return "🫁 Normal SpO2: 95–100%\n• Below 90% = Emergency 🚨";
  if (/(temperature|temp).*(normal|range)|(normal|range).*(temperature|temp)/)
    return "🌡️ Normal temperature: 97–99°F\n• Above 100.4°F = Fever";
  if (/(chest pain|heart attack)/)
    return "🚨 CHEST PAIN = EMERGENCY! Call 108/112 immediately!";
  if (/(diabetes|blood sugar|glucose)/)
    return "🩸 Normal fasting sugar: 70–100 mg/dL\n• Prediabetes: 100–125\n• Diabetes: 126+";
  if (/(fever|high temp)/)
    return "🌡️ Fever: Above 100.4°F. Rest, hydrate, take paracetamol.";
  if (/(headache|migraine)/)
    return "🤕 Drink water, rest in dark room, apply cold compress.";
  if (/(dizzy|dizziness)/)
    return "😵 Sit down, drink water, eat something. See doctor if persistent.";
  return "⚠️ Gemini is temporarily unavailable. Please try again shortly!";
};

// ─── Component ────────────────────────────────────────────────────
export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen]     = useState(false);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef           = useRef(null);

  const [messages, setMessages] = useState([{
    role: 'bot',
    text: `👋 Hi ${user?.name || 'there'}! I'm your AI Health Assistant powered by Gemini.\n\nI can help with:\n📅 Your appointments\n💓 Your vitals & readings\n🩺 Your consultations\n📋 Your health records\n🏥 Any health questions\n\nAsk me anything!`,
  }]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const userMsg = input.trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Fetch live backend data if needed
      let backendCtx = '';
      if (needsBackend(userMsg)) {
        backendCtx = await buildContext(userMsg, user);
      }

      const systemPrompt = `You are an AI health assistant in a Patient Monitoring System.

USER INFO:
- Name: ${user?.name || 'Unknown'}
- Role: ${user?.role || 'patient'}
- ID: ${user?.id || 'Unknown'}

${backendCtx ? `LIVE BACKEND DATA:\n${backendCtx}\nUse this data to answer accurately. Never make up data.` : ''}

GUIDELINES:
- Answer health questions accurately
- Normal ranges: Heart Rate 60-100 bpm, BP 120/80 mmHg, SpO2 95-100%, Temp 97-99°F
- For backend data: use only the data provided above
- For "how many" → give exact count from data
- For "latest" → show most recent record only  
- For "all" → list everything
- For critical symptoms (chest pain, O2 < 90%) → urge emergency care
- Be concise, empathetic, use emojis
- Doctor mode: provide clinical detail
- Patient mode: keep it simple and reassuring`;

      const reply = await callGemini(systemPrompt, userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);

    } catch (err) {
      console.error('Gemini error:', err);
      setMessages(prev => [...prev, { role: 'bot', text: fallback(userMsg) }]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickQuestions = user?.role === 'doctor'
    ? ['My appointments', 'My consultations', 'Normal BP range?', 'Signs of sepsis?']
    : ['My appointments', 'My vitals', 'My consultations', 'Normal heart rate?'];

  return (
    <>
      {/* Toggle Button */}
      <button className="chatbot-toggle" onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <div className="chatbot-name">AI Health Assistant</div>
                <div className="chatbot-status">
                  🟢 Gemini · {user?.role === 'doctor' ? 'Clinical Mode' : 'Patient Mode'}
                </div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.role}`}>
                {msg.role === 'bot' && <div className="chatbot-msg-avatar">🤖</div>}
                <div className="chatbot-msg-bubble">
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg bot">
                <div className="chatbot-msg-avatar">🤖</div>
                <div className="chatbot-msg-bubble chatbot-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="chatbot-quick">
              {quickQuestions.map((q, i) => (
                <button key={i} className="chatbot-quick-btn"
                  onClick={() => setInput(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              className="chatbot-input"
              placeholder="Ask a health question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="chatbot-send"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >➤</button>
          </div>
        </div>
      )}
    </>
  );
}