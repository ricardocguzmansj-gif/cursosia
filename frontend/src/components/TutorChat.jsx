import React, { useState, useRef, useEffect } from "react";

const EDGE_URL = import.meta.env.VITE_EDGE_FUNCTION_URL || "https://jcoyvyvezztoukaavnyb.supabase.co/functions/v1";

export default function TutorChat({ courseId, unitIndex, lessonIndex, accessToken }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", text: "¡Hola! 👋 Soy tu tutor para esta lección. Pregúntame lo que necesites." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset chat when lesson changes
  useEffect(() => {
    setMessages([
      { role: "model", text: "¡Hola! 👋 Soy tu tutor para esta lección. Pregúntame lo que necesites." }
    ]);
  }, [courseId, unitIndex, lessonIndex]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${EDGE_URL}/course-tutor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          course_id: courseId,
          unit_index: unitIndex,
          lesson_index: lessonIndex,
          message: userMsg,
          history: messages.slice(1), // skip initial greeting
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", text: data.reply || "Error del tutor" }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "model", text: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "🧠 Explícame más fácil", text: "Explícame este tema de forma más sencilla, como si fuera principiante" },
    { label: "📝 Hazme un quiz", text: "Hazme un quiz rápido sobre esta lección para practicar" },
    { label: "🔍 Otro ejemplo", text: "Dame otro ejemplo práctico diferente al de la lección" },
  ];

  return (
    <>
      {/* Floating button */}
      <button
        className="tutor-fab"
        onClick={() => setIsOpen(!isOpen)}
        title="Tutor IA"
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="tutor-panel glass">
          <div className="tutor-header">
            <span>🤖 Tutor IA</span>
            <button className="tutor-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="tutor-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`tutor-msg ${msg.role === "user" ? "tutor-msg-user" : "tutor-msg-bot"}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="tutor-msg tutor-msg-bot">
                <span className="tutor-typing">●●●</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick actions */}
          <div className="tutor-quick">
            {quickActions.map((a, i) => (
              <button
                key={i}
                className="tutor-quick-btn"
                onClick={() => { setInput(a.text); }}
                disabled={loading}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="tutor-input-row">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Pregúntale al tutor..."
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
