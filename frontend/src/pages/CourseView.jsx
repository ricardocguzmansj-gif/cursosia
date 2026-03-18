import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function CourseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [currentUnit, setCurrentUnit] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const [courseData, progressData] = await Promise.all([
        api.getCourse(id),
        api.getProgress(id)
      ]);
      setCourse(courseData);
      setProgress(progressData);
    } catch (err) {
      console.error(err);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (unitIdx, lessonIdx) => {
    return progress.some(
      p => p.unit_index === unitIdx && p.lesson_index === lessonIdx && p.completed
    );
  };

  const handleNavigate = (unitIdx, lessonIdx) => {
    setCurrentUnit(unitIdx);
    setCurrentLesson(lessonIdx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    const unidades = course.content.curso.unidades;
    const currentLessons = unidades[currentUnit].lecciones;

    if (currentLesson < currentLessons.length - 1) {
      handleNavigate(currentUnit, currentLesson + 1);
    } else if (currentUnit < unidades.length - 1) {
      handleNavigate(currentUnit + 1, 0);
    }
  };

  const goPrev = () => {
    if (currentLesson > 0) {
      handleNavigate(currentUnit, currentLesson - 1);
    } else if (currentUnit > 0) {
      const prevLessons = course.content.curso.unidades[currentUnit - 1].lecciones;
      handleNavigate(currentUnit - 1, prevLessons.length - 1);
    }
  };

  const totalLessons = course?.content?.curso?.unidades?.reduce(
    (acc, u) => acc + u.lecciones.length, 0
  ) || 0;

  const completedLessons = progress.filter(p => p.completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "8rem" }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!course) return null;

  const unidades = course.content.curso.unidades;
  const leccion = unidades[currentUnit]?.lecciones?.[currentLesson];
  const unidadActual = unidades[currentUnit];

  return (
    <div className="course-viewer">
      {/* Sidebar */}
      <aside className="course-sidebar">
        <h2>{course.content.curso.titulo}</h2>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1.5rem" }}>
          {completedLessons}/{totalLessons} lecciones completadas ({progressPercent}%)
        </p>

        {unidades.map((unidad, uIdx) => (
          <div key={uIdx} className="sidebar-unit">
            <div className="sidebar-unit-title">{unidad.titulo}</div>
            {unidad.lecciones.map((lec, lIdx) => (
              <button
                key={lIdx}
                className={`sidebar-lesson ${
                  currentUnit === uIdx && currentLesson === lIdx ? "active" : ""
                } ${isLessonCompleted(uIdx, lIdx) ? "completed" : ""}`}
                onClick={() => handleNavigate(uIdx, lIdx)}
              >
                <span className="lesson-status"></span>
                {lec.titulo}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Content */}
      <main className="course-content fade-in" key={`${currentUnit}-${currentLesson}`}>
        <div className="lesson-header">
          <div className="unit-label">{unidadActual.titulo}</div>
          <h1>{leccion.titulo}</h1>
          {leccion.idea_clave && (
            <p className="idea-clave">💡 {leccion.idea_clave}</p>
          )}
        </div>

        {/* Explicación */}
        <div className="lesson-section">
          <h3>📖 Explicación</h3>
          <div className="content-block">{leccion.explicacion}</div>
        </div>

        {/* Ejemplo */}
        {leccion.ejemplo_aplicado && (
          <div className="lesson-section">
            <h3>🔍 Ejemplo aplicado</h3>
            <div className="content-block">{leccion.ejemplo_aplicado}</div>
          </div>
        )}

        {/* Actividad */}
        {leccion.actividad_practica && (
          <div className="lesson-section">
            <h3>🛠️ Actividad práctica</h3>
            <div className="content-block">{leccion.actividad_practica}</div>
          </div>
        )}

        {/* Quiz */}
        {leccion.test_rapido && leccion.test_rapido.length > 0 && (
          <QuizWidget
            questions={leccion.test_rapido}
            courseId={id}
            unitIndex={currentUnit}
            lessonIndex={currentLesson}
            onComplete={(score) => {
              if (!isLessonCompleted(currentUnit, currentLesson)) {
                setProgress([...progress, {
                  unit_index: currentUnit,
                  lesson_index: currentLesson,
                  completed: true,
                  score
                }]);
              }
            }}
          />
        )}

        {/* Navigation */}
        <div className="lesson-nav">
          <button
            className="btn btn-outline"
            onClick={goPrev}
            disabled={currentUnit === 0 && currentLesson === 0}
          >
            ← Anterior
          </button>
          <button
            className="btn btn-primary"
            onClick={goNext}
            disabled={
              currentUnit === unidades.length - 1 &&
              currentLesson === unidades[currentUnit].lecciones.length - 1
            }
          >
            Siguiente →
          </button>
        </div>
      </main>
    </div>
  );
}

// Quiz Widget Component
function QuizWidget({ questions, courseId, unitIndex, lessonIndex, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    setAnswers({ ...answers, [qIdx]: option });
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    const correct = questions.filter(
      (q, i) => answers[i] === q.respuesta_correcta
    ).length;

    const score = Math.round((correct / questions.length) * 100);

    try {
      await api.saveProgress(courseId, unitIndex, lessonIndex, score);
      onComplete(score);
    } catch (err) {
      console.error("Error saving progress:", err);
    }
  };

  const correctCount = submitted
    ? questions.filter((q, i) => answers[i] === q.respuesta_correcta).length
    : 0;

  return (
    <div className="quiz-section">
      <h3>📝 Test rápido</h3>

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="quiz-question">
          <p>{qIdx + 1}. {q.pregunta}</p>
          <div className="quiz-options">
            {q.opciones.map((opt, oIdx) => {
              let className = "quiz-option";
              if (submitted) {
                if (opt === q.respuesta_correcta) className += " correct";
                else if (answers[qIdx] === opt) className += " incorrect";
              } else if (answers[qIdx] === opt) {
                className += " selected";
              }

              return (
                <button
                  key={oIdx}
                  className={className}
                  onClick={() => handleSelect(qIdx, opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          style={{ width: "100%", marginTop: "1rem" }}
        >
          Verificar respuestas
        </button>
      ) : (
        <div className={`quiz-result ${correctCount >= questions.length / 2 ? "passed" : "failed"}`}>
          <p style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            {correctCount >= questions.length / 2 ? "🎉 ¡Bien hecho!" : "😕 Seguí practicando"}
          </p>
          <p>
            Acertaste {correctCount} de {questions.length} preguntas
            ({Math.round((correctCount / questions.length) * 100)}%)
          </p>
        </div>
      )}
    </div>
  );
}
