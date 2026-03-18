import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function CourseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [currentUnit, setCurrentUnit] = useState(-1); // -1 = overview
  const [currentLesson, setCurrentLesson] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCourse(); }, [id]);

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
    const unidades = curso.unidades;
    if (currentUnit === -1) {
      handleNavigate(0, 0);
      return;
    }
    const currentLessons = unidades[currentUnit].lecciones;
    if (currentLesson < currentLessons.length - 1) {
      handleNavigate(currentUnit, currentLesson + 1);
    } else if (currentUnit < unidades.length - 1) {
      handleNavigate(currentUnit + 1, 0);
    } else {
      // Last lesson - go to final evaluation
      setCurrentUnit(-2);
    }
  };

  const goPrev = () => {
    if (currentUnit === -2) {
      const unidades = curso.unidades;
      const lastUnit = unidades.length - 1;
      handleNavigate(lastUnit, unidades[lastUnit].lecciones.length - 1);
      return;
    }
    if (currentUnit === -1) return;
    if (currentLesson > 0) {
      handleNavigate(currentUnit, currentLesson - 1);
    } else if (currentUnit > 0) {
      const prevLessons = curso.unidades[currentUnit - 1].lecciones;
      handleNavigate(currentUnit - 1, prevLessons.length - 1);
    } else {
      setCurrentUnit(-1);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "8rem" }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!course) return null;

  const curso = course.content.curso;
  const unidades = curso.unidades;
  const totalLessons = unidades.reduce((acc, u) => acc + u.lecciones.length, 0);
  const completedLessons = progress.filter(p => p.completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="course-viewer">
      {/* Sidebar */}
      <aside className="course-sidebar">
        <h2>{curso.titulo}</h2>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="progress-label">
          {completedLessons}/{totalLessons} lecciones ({progressPercent}%)
        </p>

        {/* Overview link */}
        <button
          className={`sidebar-lesson overview-link ${currentUnit === -1 ? "active" : ""}`}
          onClick={() => setCurrentUnit(-1)}
        >
          📋 Vista general del curso
        </button>

        {unidades.map((unidad, uIdx) => (
          <div key={uIdx} className="sidebar-unit">
            <div className="sidebar-unit-title">
              <span className="unit-number">Unidad {uIdx + 1}</span>
              {unidad.titulo}
            </div>
            {unidad.lecciones.map((lec, lIdx) => (
              <button
                key={lIdx}
                className={`sidebar-lesson ${
                  currentUnit === uIdx && currentLesson === lIdx ? "active" : ""
                } ${isLessonCompleted(uIdx, lIdx) ? "completed" : ""}`}
                onClick={() => handleNavigate(uIdx, lIdx)}
              >
                <span className="lesson-status"></span>
                <span className="lesson-number">{uIdx + 1}.{lIdx + 1}</span>
                {lec.titulo}
              </button>
            ))}
          </div>
        ))}

        {/* Final sections link */}
        <button
          className={`sidebar-lesson overview-link ${currentUnit === -2 ? "active" : ""}`}
          onClick={() => setCurrentUnit(-2)}
        >
          🏁 Evaluación y proyecto final
        </button>
      </aside>

      {/* Content */}
      <main className="course-content fade-in" key={`${currentUnit}-${currentLesson}`}>

        {/* ===== OVERVIEW (-1) ===== */}
        {currentUnit === -1 && (
          <CourseOverview curso={curso} course={course} onStart={() => handleNavigate(0, 0)} />
        )}

        {/* ===== LESSON VIEW ===== */}
        {currentUnit >= 0 && (
          <LessonView
            curso={curso}
            currentUnit={currentUnit}
            currentLesson={currentLesson}
            courseId={id}
            isLessonCompleted={isLessonCompleted}
            progress={progress}
            setProgress={setProgress}
            goNext={goNext}
            goPrev={goPrev}
            unidades={unidades}
          />
        )}

        {/* ===== FINAL SECTIONS (-2) ===== */}
        {currentUnit === -2 && (
          <FinalSections curso={curso} goPrev={goPrev} />
        )}
      </main>
    </div>
  );
}

// ==================== COURSE OVERVIEW ====================
function CourseOverview({ curso, course, onStart }) {
  return (
    <div className="course-overview">
      {/* Course Header */}
      <div className="course-header-card glass">
        <h1>{curso.titulo}</h1>
        {curso.descripcion_corta && <p className="course-desc">{curso.descripcion_corta}</p>}
        {!curso.descripcion_corta && curso.descripcion && <p className="course-desc">{curso.descripcion}</p>}
        <div className="course-tags">
          <span className="tag tag-nivel">📊 {curso.nivel || course.level}</span>
          <span className="tag tag-duracion">⏱️ {curso.duracion || course.duration}</span>
          <span className="tag tag-perfil">👤 {curso.perfil || course.profile}</span>
        </div>
      </div>

      {/* Learning Objectives */}
      {curso.objetivos_aprendizaje && curso.objetivos_aprendizaje.length > 0 && (
        <div className="objectives-card glass">
          <h2>🎯 Objetivos de aprendizaje</h2>
          <ul className="objectives-list">
            {curso.objetivos_aprendizaje.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Course Map */}
      <div className="course-map">
        <h2>🗺️ Mapa del curso</h2>
        <p className="map-subtitle">{curso.unidades.length} unidades · Dificultad progresiva</p>
        <div className="units-grid">
          {curso.unidades.map((unidad, i) => (
            <div key={i} className="unit-map-card glass">
              <div className="unit-map-number">Unidad {i + 1}</div>
              <h3>{unidad.titulo}</h3>
              <p className="unit-map-desc">{unidad.descripcion}</p>
              <div className="unit-map-lessons">
                {unidad.lecciones.length} lecciones
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-accent btn-lg" onClick={onStart} style={{ width: "100%", marginTop: "1.5rem" }}>
        🚀 Comenzar curso
      </button>
    </div>
  );
}

// ==================== LESSON VIEW ====================
function LessonView({ curso, currentUnit, currentLesson, courseId, isLessonCompleted, progress, setProgress, goNext, goPrev, unidades }) {
  const unidadActual = unidades[currentUnit];
  const leccion = unidadActual?.lecciones?.[currentLesson];
  if (!leccion) return null;

  return (
    <>
      {/* Lesson Header */}
      <div className="lesson-header">
        <div className="lesson-breadcrumb">
          <span className="unit-label">Unidad {currentUnit + 1}</span>
          <span className="breadcrumb-sep">›</span>
          <span>{unidadActual.titulo}</span>
        </div>
        <h1>
          <span className="lesson-num">{currentUnit + 1}.{currentLesson + 1}</span>
          {leccion.titulo}
        </h1>
      </div>

      {/* Idea Clave Block */}
      {leccion.idea_clave && (
        <div className="content-card block-idea">
          <div className="block-tag"><span className="block-icon">💡</span> Idea clave</div>
          <p className="idea-text">{leccion.idea_clave}</p>
        </div>
      )}

      {/* Explicación Block */}
      <div className="content-card block-theory">
        <div className="block-tag"><span className="block-icon">📖</span> Explicación</div>
        <div className="block-body">{leccion.explicacion}</div>
      </div>

      {/* Ejemplo Block */}
      {leccion.ejemplo_aplicado && (
        <div className="content-card block-example">
          <div className="block-tag"><span className="block-icon">🔍</span> Ejemplo aplicado</div>
          <div className="block-body">{leccion.ejemplo_aplicado}</div>
        </div>
      )}

      {/* Actividad Block */}
      {leccion.actividad_practica && (
        <div className="content-card block-activity">
          <div className="block-tag"><span className="block-icon">🛠️</span> Actividad práctica</div>
          <div className="block-body">{leccion.actividad_practica}</div>
        </div>
      )}

      {/* Test Block */}
      {leccion.test_rapido && leccion.test_rapido.length > 0 && (
        <QuizWidget
          questions={leccion.test_rapido}
          courseId={courseId}
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
        <button className="btn btn-outline" onClick={goPrev}>
          ← Lección anterior
        </button>
        <button className="btn btn-primary" onClick={goNext}>
          Siguiente lección →
        </button>
      </div>
    </>
  );
}

// ==================== FINAL SECTIONS ====================
function FinalSections({ curso, goPrev }) {
  const [evalAnswers, setEvalAnswers] = useState({});
  const [evalSubmitted, setEvalSubmitted] = useState(false);

  const evalPreguntas = curso.evaluacion_final?.preguntas || [];
  const proyectos = curso.proyecto_final;
  const fuentes = curso.fuentes || [];

  const handleEvalSelect = (qIdx, opt) => {
    if (evalSubmitted) return;
    setEvalAnswers({ ...evalAnswers, [qIdx]: opt });
  };

  const evalCorrectCount = evalSubmitted
    ? evalPreguntas.filter((q, i) => evalAnswers[i] === q.respuesta_correcta).length
    : 0;

  return (
    <div className="final-sections">
      {/* Evaluación Final */}
      {evalPreguntas.length > 0 && (
        <div className="eval-section">
          <h1>🏆 Evaluación final</h1>
          <p className="eval-desc">
            {curso.evaluacion_final?.descripcion || "Demuestra todo lo que aprendiste respondiendo estas preguntas sobre el temario completo."}
          </p>

          {evalPreguntas.map((q, qIdx) => (
            <div key={qIdx} className="content-card block-test">
              <p className="quiz-pregunta">{qIdx + 1}. {q.pregunta}</p>
              <div className="quiz-options">
                {(q.opciones || []).map((opt, oIdx) => {
                  let cn = "quiz-option";
                  if (evalSubmitted) {
                    if (opt === q.respuesta_correcta) cn += " correct";
                    else if (evalAnswers[qIdx] === opt) cn += " incorrect";
                  } else if (evalAnswers[qIdx] === opt) {
                    cn += " selected";
                  }
                  return (
                    <button key={oIdx} className={cn} onClick={() => handleEvalSelect(qIdx, opt)}>
                      <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!evalSubmitted ? (
            <button
              className="btn btn-accent btn-lg"
              onClick={() => setEvalSubmitted(true)}
              disabled={Object.keys(evalAnswers).length < evalPreguntas.length}
              style={{ width: "100%", marginTop: "1rem" }}
            >
              📊 Ver resultados
            </button>
          ) : (
            <div className={`quiz-result ${evalCorrectCount >= evalPreguntas.length / 2 ? "passed" : "failed"}`}>
              <p style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                {evalCorrectCount >= evalPreguntas.length * 0.7
                  ? "🎓 ¡Excelente! Has aprobado la evaluación"
                  : evalCorrectCount >= evalPreguntas.length / 2
                  ? "👍 ¡Bien! Aprobaste, pero puedes mejorar"
                  : "📚 Necesitas repasar algunos temas"}
              </p>
              <p>
                Acertaste {evalCorrectCount} de {evalPreguntas.length} preguntas
                ({Math.round((evalCorrectCount / evalPreguntas.length) * 100)}%)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Proyecto Final */}
      {proyectos && (
        <div className="project-section">
          <h2>🔬 Proyecto final</h2>
          <p className="project-desc">{proyectos.descripcion}</p>

          {proyectos.entregables && proyectos.entregables.length > 0 && (
            <div className="project-proposals">
              {proyectos.entregables.map((ent, i) => (
                <div key={i} className="content-card block-activity">
                  <div className="block-tag"><span className="block-icon">📋</span> Propuesta {i + 1}</div>
                  <div className="block-body">{typeof ent === "string" ? ent : ent.descripcion || JSON.stringify(ent)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fuentes y Referencias */}
      {fuentes.length > 0 && (
        <div className="sources-section">
          <h2>📚 Fuentes y referencias</h2>
          <ul className="sources-list">
            {fuentes.map((f, i) => (
              <li key={i} className="source-item">
                {typeof f === "string" ? f : (
                  <>
                    <strong>{f.titulo || f.title || ""}</strong>
                    {(f.url || f.enlace) && (
                      <a href={f.url || f.enlace} target="_blank" rel="noopener noreferrer"> ↗</a>
                    )}
                    {f.descripcion && <span className="source-desc"> — {f.descripcion}</span>}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="lesson-nav">
        <button className="btn btn-outline" onClick={goPrev}>
          ← Volver a lecciones
        </button>
      </div>
    </div>
  );
}

// ==================== QUIZ WIDGET ====================
function QuizWidget({ questions, courseId, unitIndex, lessonIndex, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    setAnswers({ ...answers, [qIdx]: option });
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const correct = questions.filter((q, i) => answers[i] === q.respuesta_correcta).length;
    const score = Math.round((correct / questions.length) * 100);

    try {
      await api.saveProgress(courseId, unitIndex, lessonIndex, score);
      onComplete(score);
    } catch (err) {
      console.error("Error saving progress:", err);
      onComplete(score);
    }
  };

  const correctCount = submitted
    ? questions.filter((q, i) => answers[i] === q.respuesta_correcta).length
    : 0;

  return (
    <div className="content-card block-test">
      <div className="block-tag"><span className="block-icon">📝</span> Test rápido</div>

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="quiz-question">
          <p className="quiz-pregunta">{qIdx + 1}. {q.pregunta}</p>
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
                <button key={oIdx} className={className} onClick={() => handleSelect(qIdx, opt)}>
                  <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
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
            {correctCount >= questions.length / 2 ? "🎉 ¡Bien hecho!" : "😕 Sigue practicando"}
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
