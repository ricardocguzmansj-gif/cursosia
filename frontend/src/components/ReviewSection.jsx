import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function ReviewSection({ courseId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { loadReviews(); }, [courseId]);

  const loadReviews = async () => {
    try {
      const data = await api.getCourseReviews(courseId);
      setReviews(data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await api.submitReview(courseId, rating, comment);
      setSubmitted(true);
      await api.awardXP(15, 'review_submitted', courseId);
      loadReviews();
    } catch (err) {
      toast.error("Error al enviar reseña");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="review-section">
      <h3>⭐ Reseñas del curso</h3>

      {avgRating && (
        <div className="review-avg">
          <span className="review-avg-score">{avgRating}</span>
          <span className="review-stars">{renderStars(Math.round(avgRating))}</span>
          <span className="review-count">({reviews.length} reseñas)</span>
        </div>
      )}

      {/* Submit form */}
      {!submitted && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="star-input">
            {[1, 2, 3, 4, 5].map(n => (
              <span
                key={n}
                className={`star ${n <= (hover || rating) ? "star-filled" : ""}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
              >★</span>
            ))}
          </div>
          <textarea
            placeholder="Comparte tu opinión sobre el curso..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
          />
          <button className="btn btn-primary btn-sm" disabled={submitting || rating === 0}>
            {submitting ? "Enviando..." : "📝 Enviar reseña (+15 XP)"}
          </button>
        </form>
      )}
      {submitted && <p style={{ color: "var(--success)" }}>✅ ¡Gracias por tu reseña!</p>}

      {/* Reviews list */}
      <div className="reviews-list">
        {reviews.map(r => (
          <div key={r.id} className="review-card">
            <div className="review-header">
              <strong>{r.profiles?.full_name || "Estudiante"}</strong>
              <span className="review-stars-sm">{renderStars(r.rating)}</span>
            </div>
            {r.comment && <p>{r.comment}</p>}
            <span className="review-date">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderStars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}
