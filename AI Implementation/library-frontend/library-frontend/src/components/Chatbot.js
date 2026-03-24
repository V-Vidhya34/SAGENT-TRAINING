import React, { useState, useRef, useEffect } from 'react';
import { getBooks, getBorrows, getFines } from '../api';
import './Chatbot.css';

const GEMINI_API_KEY = 'AIzaSyALLt_rgQL-1WhTaEF0WSIFqz1WS1X-Uzc';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '👋 Hi! I am your LibraVault Assistant!\n\nI can help you with:\n📚 Book availability & details\n🔄 Borrow & return info\n💰 Fine details\n📖 Book recommendations\n🔔 General library help\n\nAsk me anything!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchLibraryContext = async () => {
    const [booksRes, borrowsRes, finesRes] = await Promise.allSettled([
      getBooks(), getBorrows(), getFines()
    ]);

    const books = booksRes.status === 'fulfilled' ? booksRes.value.data : [];
    const borrows = borrowsRes.status === 'fulfilled' ? borrowsRes.value.data : [];
    const fines = finesRes.status === 'fulfilled' ? finesRes.value.data : [];

    return `
You are a helpful library assistant for LibraVault Library Management System.
Here is the current library data:

BOOKS IN LIBRARY:
${books.map(b => `- "${b.title}" by ${b.author} | Genre: ${b.genre || 'N/A'} | Quantity: ${b.quantity} | Status: ${b.status}`).join('\n')}

BORROW RULES:
- Borrow period: 7 days
- Fine: ₹10 per day for overdue books
- Members can borrow any available book
- Book becomes unavailable when quantity reaches 0

CURRENT BORROWS:
- Total active borrows: ${borrows.filter(b => b.boStatus !== 'RETURNED').length}
- Total returned: ${borrows.filter(b => b.boStatus === 'RETURNED').length}

FINES:
- Total unpaid fines: ${fines.filter(f => f.paidStatus === 'NOT_PAID').length}

HOW TO USE THE SYSTEM:
- To borrow: Go to Browse Books → Click Borrow button
- To return: Go to My Borrows → Click Return button
- To pay fine: Go to My Fines → Click Pay Now button
- To get notifications: Go to Notifications page

Answer the user's question based on this library data. Be friendly, helpful and concise.
If asked for book recommendations, suggest from the available books list above.
If a book is NOT_AVAILABLE, mention that and suggest similar available books.
    `;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const context = await fetchLibraryContext();

    //   const response = await fetch(
    //     `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    //     {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({
    //         contents: [
    //           {
    //             parts: [
    //               {
    //                 text: `${context}\n\nUser question: ${userMsg}`
    //               }
    //             ]
    //           }
    //         ],
    //         generationConfig: {
    //           temperature: 0.7,
    //           maxOutputTokens: 300,
    //         }
    //       })
    //     }
    //   );

    const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${context}\n\nUser question: ${userMsg}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    })
  }
);

      const data = await response.json();
      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not understand that. Please try again!';

      setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
    // } catch (err) {
    //   setMessages(prev => [...prev, {
    //     role: 'bot',
    //     text: '❌ Something went wrong. Please check your internet connection and try again!'
    //   }]);
    // }
} catch (err) {
  console.error('Gemini error:', err);
  setMessages(prev => [...prev, {
    role: 'bot',
    text: '❌ Something went wrong. Please check your internet connection and try again!'
  }]);
}

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    '📚 What books are available?',
    '📖 Suggest a book',
    '💰 How much is the fine?',
    '🔄 How do I borrow a book?',
  ];

  return (
    <>
      {/* Chat bubble button */}
      <button className="chatbot-toggle" onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <div className="chatbot-name">LibraVault Assistant</div>
                <div className="chatbot-status">🟢 Online</div>
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
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length === 1 && (
            <div className="chatbot-quick">
              {quickQuestions.map((q, i) => (
                <button key={i} className="chatbot-quick-btn"
                  onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              className="chatbot-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="chatbot-send"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}