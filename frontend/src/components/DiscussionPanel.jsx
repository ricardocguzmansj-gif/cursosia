import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function DiscussionPanel({ courseId, unitIndex, lessonIndex }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => { loadMessages(); }, [courseId, unitIndex, lessonIndex]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("discussions")
        .select("*, profiles(full_name)")
        .eq("course_id", courseId)
        .eq("unit_index", unitIndex)
        .eq("lesson_index", lessonIndex)
        .is("parent_id", null)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    } catch {} finally { setLoading(false); }
  };

  const postMessage = async () => {
    if (!input.trim() || posting) return;
    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("discussions").insert({
        course_id: courseId,
        unit_index: unitIndex,
        lesson_index: lessonIndex,
        user_id: user.id,
        content: input.trim()
      });
      setInput("");
      loadMessages();
    } catch (err) {
      console.error(err);
    } finally { setPosting(false); }
  };

  return (
    <div className="discussion-panel">
      <h4>💬 Discusión de la lección</h4>

      {loading ? (
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>Cargando...</p>
      ) : (
        <div className="discussion-messages">
          {messages.length === 0 && (
            <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
              Nadie ha comentado aún. ¡Sé el primero!
            </p>
          )}
          {messages.map(m => (
            <div key={m.id} className="discussion-msg">
              <div className="discussion-author">
                <strong>{m.profiles?.full_name || "Estudiante"}</strong>
                <span>{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              <p>{m.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="discussion-input">
        <input
          type="text"
          placeholder="Escribe un comentario o pregunta..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && postMessage()}
          disabled={posting}
        />
        <button className="btn btn-primary btn-sm" onClick={postMessage} disabled={posting || !input.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}
