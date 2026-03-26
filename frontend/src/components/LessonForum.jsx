import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function LessonForum({ courseId, unitIndex, lessonIndex }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadComments();
  }, [courseId, unitIndex, lessonIndex]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await api.getCourseComments(courseId, unitIndex, lessonIndex);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const added = await api.addCourseComment(courseId, unitIndex, lessonIndex, newComment.trim());
      setComments([...comments, added]);
      setNewComment("");
      toast.success("Comentario publicado");
      
      // Call AI Tutor edge function if it asks a question
      if (newComment.includes("?")) {
        // We trigger it asynchronously without awaiting
        triggerAIAssistant(added.id, newComment);
      }
    } catch (err) {
      toast.error(err.message || "Error al publicar");
    } finally {
      setSubmitting(false);
    }
  };

  const triggerAIAssistant = async (commentId, content) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-forum-responder', {
        body: {
          courseId,
          unitIndex,
          lessonIndex,
          commentId,
          commentContent: content
        }
      });
      
      if (error) throw error;
      
      if (data) {
        // Add the AI response to the list immediately
        setComments(prev => [...prev, data]);
        toast.success("🤖 Nuestro Tutor Académico IA respondió a tu duda");
      }
    } catch(e) {
      console.error("Error al invocar Tutor IA:", e);
    }
  };

  return (
    <div className="lesson-forum glass fade-in" style={{ marginTop: "3rem", padding: "2rem", borderRadius: "12px" }}>
      <h3 style={{ marginBottom: "1.5rem" }}>💬 Preguntas y Respuestas</h3>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe tu duda sobre esta lección..."
          style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", resize: "vertical", minHeight: "80px" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-primary" disabled={submitting || !newComment.trim()}>
            {submitting ? "Publicando..." : "Publicar Comentario"}
          </button>
        </div>
      </form>

      <div className="comments-list">
        {loading ? (
          <div className="loading-spinner" style={{ margin: "2rem auto" }}></div>
        ) : comments.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", fontStyle: "italic" }}>No hay preguntas aún. ¡Sé el primero en participar!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`comment-item ${c.is_ai_response ? 'ai-comment' : ''}`} style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", background: c.is_ai_response ? "rgba(var(--accent-rgb), 0.1)" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <strong>
                  {c.is_ai_response ? "🤖 Tutor IA" : (c.profiles?.full_name || "Alumno")}
                </strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
