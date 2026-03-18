import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { parseCourseContent } from "../lib/courseHelper";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import TutorChat from "../components/TutorChat";

import ReviewSection from "../components/ReviewSection";
import DiscussionPanel from "../components/DiscussionPanel";
import AudioPlayer from "../components/AudioPlayer";
import LinkedInShare from "../components/LinkedInShare";
import VideoPlayer from "../components/VideoPlayer";
import { exportScorm12 } from "../lib/ScormExport";

export default function CourseView() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [currentUnit, setCurrentUnit] = useState(-1);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Read continue position from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const initialUnit = searchParams.get('u');
  const initialLesson = searchParams.get('l');

  useEffect(() => { loadCourseData(); }, [id]);

  const loadCourseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const promises = [api.getCourse(id)];
      if (user) {
        promises.push(api.getProgress(id));
        promises.push(supabase.from("course_enrollments").select("*").eq("course_id", id).eq("user_id", user.id).single());
        promises.push(api.getLastPosition(id));
        promises.push(api.isAdmin());
      }

      const results = await Promise.all(promises);
      const courseData = results[0];
      setCourse(courseData);

      if (user) {
        setProgress(results[1]);
        setEnrollment(results[2]?.data);
        const lastPos = results[3];
        setLastPosition(lastPos);
        setIsAdmin(results[4] || false);

        if (initialUnit !== null) {
          setCurrentUnit(parseInt(initialUnit));
          setCurrentLesson(parseInt(initialLesson || '0'));
        } else if (lastPos) {
          setCurrentUnit(lastPos.unit_index);
          setCurrentLesson(lastPos.lesson_index);
        }
      } else {
        setProgress([]);
        setEnrollment(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cargando el curso. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const curso = parseCourseContent(course);
  const unidades = curso?.unidades || [];

  const isLessonCompleted = (unitIdx, lessonIdx) => {
    return progress.some(
      p => p.unit_index === unitIdx && p.lesson_index === lessonIdx && p.completed
    );
  };

  const isStepUnlocked = (unitIdx, lessonIdx) => {
    if (isAdmin) return true;
    if (unitIdx === -1) return true; 
    if (unitIdx === 0 && lessonIdx === 0) return true;

    if (unitIdx === -2) {
      const lastUnit = unidades.length - 1;
      return isLessonCompleted(lastUnit, unidades[lastUnit].lecciones.length);
    }

    let prevU = unitIdx;
    let prevL = lessonIdx - 1;
    if (prevL < 0) {
      prevU = unitIdx - 1;
      prevL = unidades[prevU]?.lecciones?.length || 0; 
    }

    return isLessonCompleted(prevU, prevL);
  };

  const handleNavigate = (unitIdx, lessonIdx) => {
    if (unitIdx >= 0 && !enrollment) {
      toast("Para acceder a las lecciones, primero debes inscribirte en el curso.", { icon: "🔒" });
      return;
    }
    if (!isStepUnlocked(unitIdx, lessonIdx)) {
      toast.error("Debes completar la lección o evaluación anterior para acceder a este paso.", { icon: "🔒" });
      return;
    }
    setCurrentUnit(unitIdx);
    setCurrentLesson(lessonIdx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (!curso || !unidades.length) return;
    if (currentUnit === -1) {
      handleNavigate(0, 0);
      return;
    }
    const currentLessons = unidades[currentUnit]?.lecciones || [];
    if (currentLesson < currentLessons.length) {
      handleNavigate(currentUnit, currentLesson + 1);
    } else if (currentUnit < unidades.length - 1) {
      handleNavigate(currentUnit + 1, 0);
    } else {
      setCurrentUnit(-2);
    }
  };

  const goPrev = () => {
    if (!curso || !unidades.length) return;
    if (currentUnit === -2) {
      const lastUnit = unidades.length - 1;
      handleNavigate(lastUnit, unidades[lastUnit].lecciones.length);
      return;
    }
    if (currentUnit === -1) return;
    if (currentLesson > 0) {
      handleNavigate(currentUnit, currentLesson - 1);
    } else if (currentUnit > 0) {
      const prevLessons = unidades[currentUnit - 1].lecciones || [];
      handleNavigate(currentUnit - 1, prevLessons.length);
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

  if (!course || !curso) return null;

  const totalLessons = unidades.reduce((acc, u) => acc + (u.lecciones?.length || 0), 0);
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
            {unidad.lecciones.map((lec, lIdx) => {
              const isActive = currentUnit === uIdx && currentLesson === lIdx;
              const isCompleted = isLessonCompleted(uIdx, lIdx);
              const isUnlocked = isStepUnlocked(uIdx, lIdx);
              return (
                <button
                  key={lIdx}
                  className={`sidebar-lesson ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${!isUnlocked ? "locked" : ""}`}
                  onClick={() => isUnlocked && handleNavigate(uIdx, lIdx)}
                  style={{ opacity: isUnlocked ? 1 : 0.6, cursor: isUnlocked ? 'pointer' : 'not-allowed' }}
                >
                  <span className="lesson-status">{isCompleted ? "✓" : isUnlocked ? "○" : "🔒"}</span>
                  <span className="lesson-number">{uIdx + 1}.{lIdx + 1}</span>
                  {lec.titulo}
                </button>
              );
            })}
            
            {/* Unit Evaluation Item */}
            {(() => {
              const evalIdx = unidad.lecciones.length;
              const isActive = currentUnit === uIdx && currentLesson === evalIdx;
              const isCompleted = isLessonCompleted(uIdx, evalIdx);
              const isUnlocked = isStepUnlocked(uIdx, evalIdx);
              return (
                <button
                  className={`sidebar-lesson ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${!isUnlocked ? "locked" : ""}`}
                  onClick={() => isUnlocked && handleNavigate(uIdx, evalIdx)}
                  style={{ opacity: isUnlocked ? 1 : 0.6, cursor: isUnlocked ? 'pointer' : 'not-allowed', marginTop: '4px', background: 'var(--bg-glass-heavy)' }}
                >
                  <span className="lesson-status">{isCompleted ? "✓" : isUnlocked ? "○" : "🔒"}</span>
                  <span className="lesson-number">📝</span>
                  Evaluación de Unidad
                </button>
              );
            })()}
          </div>
        ))}

        {/* Final sections link */}
        <button
          className={`sidebar-lesson overview-link ${currentUnit === -2 ? "active" : ""} ${!isStepUnlocked(-2, 0) ? "locked" : ""}`}
          onClick={() => isStepUnlocked(-2, 0) && setCurrentUnit(-2)}
          style={{ opacity: isStepUnlocked(-2, 0) ? 1 : 0.6, cursor: isStepUnlocked(-2, 0) ? 'pointer' : 'not-allowed' }}
        >
          🏁 Evaluación y proyecto final
        </button>
      </aside>

      {/* Content */}
      <main className="course-content fade-in" key={`${currentUnit}-${currentLesson}`}>

        {/* ===== OVERVIEW (-1) ===== */}
        {currentUnit === -1 && (
          <CourseOverview 
            curso={curso} 
            course={course}
            hasProgress={progress.length > 0}
            enrollment={enrollment}
            onStart={() => {
              if (!enrollment) {
                window.location.href = '/catalog';
              } else {
                goNext();
              }
            }} 
          />
        )}

        {/* ===== LESSONS AND UNIT EVALUATIONS (0+) ===== */}
        {currentUnit >= 0 && (
          <>
            {currentLesson < unidades[currentUnit].lecciones.length ? (
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
            ) : (
              <UnitEvaluationView 
                unidadActual={unidades[currentUnit]}
                currentUnit={currentUnit}
                currentLesson={currentLesson}
                courseId={id}
                isLessonCompleted={isLessonCompleted}
                progress={progress}
                setProgress={setProgress}
                goNext={goNext}
              />
            )}
            
            {/* Tutor only in regular lessons */}
            {currentLesson < unidades[currentUnit].lecciones.length && (
              <TutorChat
                courseId={id}
                unitIndex={currentUnit}
                lessonIndex={currentLesson}
                accessToken={localStorage.getItem('access_token')}
              />
            )}
          </>
        )}

        {/* ===== FINAL SECTIONS (-2) ===== */}
        {currentUnit === -2 && (
          <FinalSections 
            curso={curso} 
            goPrev={goPrev} 
            courseId={id} 
            enrollment={enrollment} 
            setEnrollment={setEnrollment}
            loadCourseData={loadCourseData}
            progress={progress}
          />
        )}
      </main>
    </div>
  );
}

// ==================== COURSE OVERVIEW ====================
function CourseOverview({ curso, course, onStart, hasProgress, enrollment }) {
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

      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        {!enrollment ? (
          <button className="btn btn-accent btn-lg" onClick={onStart} style={{ flex: 1 }}>
            🛒 Ver opciones de inscripción en el Catálogo
          </button>
        ) : (
          <>
            <button className="btn btn-accent btn-lg" onClick={onStart} style={{ flex: 1 }}>
              🚀 {hasProgress ? "Continuar curso" : "Comenzar curso"}
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => exportScorm12(course || curso)} title="Exportar paquete SCORM 1.2">
              📦 SCORM
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ==================== LESSON VIEW ====================
function LessonView({ curso, currentUnit, currentLesson, courseId, isLessonCompleted, progress, setProgress, goNext, goPrev, unidades }) {
  const unidadActual = unidades[currentUnit];
  const leccion = unidadActual?.lecciones?.[currentLesson];
  const savedRef = useRef({});

  // Auto-save progress when viewing a lesson (for lessons WITHOUT a quiz)
  useEffect(() => {
    if (!leccion) return;
    const hasQuiz = leccion.test_rapido && leccion.test_rapido.length > 0;
    if (hasQuiz) return; // quiz submit handles its own save

    const key = `${currentUnit}-${currentLesson}`;
    if (savedRef.current[key]) return; // already saved this session
    if (isLessonCompleted(currentUnit, currentLesson)) return;

    savedRef.current[key] = true;
    api.saveProgress(courseId, currentUnit, currentLesson, null)
      .then(() => {
        setProgress(prev => [...prev, {
          unit_index: currentUnit,
          lesson_index: currentLesson,
          completed: true,
          score: null
        }]);
        // Award XP for completing a lesson
        api.awardXP(10, 'lesson_completed', courseId).catch(() => {});
      })
      .catch(err => console.error('Error saving progress:', err));
  }, [currentUnit, currentLesson]);

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
        <div style={{ marginTop: "1rem" }}>
          <AudioPlayer text={leccion.explicacion} />
        </div>
      </div>

      {/* Video Block */}
      {leccion.video_url && <VideoPlayer url={leccion.video_url} />}

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

      <DiscussionPanel courseId={courseId} unitIndex={currentUnit} lessonIndex={currentLesson} />

      {/* Navigation */}
      <div className="lesson-nav">
        <button className="btn btn-outline" onClick={goPrev}>
          ← Lección anterior
        </button>
        <button className="btn btn-primary" onClick={goNext}>
          Continuar →
        </button>
      </div>
    </>
  );
}

// ==================== UNIT EVALUATION VIEW ====================

function UnitEvaluationView({ unidadActual, currentUnit, currentLesson, courseId, isLessonCompleted, progress, setProgress, goNext }) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!unidadActual) return;
    if (unidadActual.evaluacion_unidad && unidadActual.evaluacion_unidad.preguntas) {
      setQuestions(unidadActual.evaluacion_unidad.preguntas);
    } else {
      // Retrocompatibility: extract up to 3 from each test_rapido
      let extracted = [];
      (unidadActual.lecciones || []).forEach(l => {
        if (l.test_rapido && l.test_rapido.length > 0) {
          extracted = [...extracted, ...l.test_rapido.slice(0, 3)];
        }
      });
      setQuestions(extracted);
    }
  }, [unidadActual]);

  if (!questions || questions.length === 0) {
    // If absolutely no questions, auto complete
    useEffect(() => {
      if (!isLessonCompleted(currentUnit, currentLesson)) {
        api.saveProgress(courseId, currentUnit, currentLesson, null).then(() => {
          setProgress(prev => [...prev, { unit_index: currentUnit, lesson_index: currentLesson, completed: true, score: null }]);
        });
      }
    }, []);
    return (
      <div className="lesson-header">
        <h1>Unidad Completada</h1>
        <button className="btn btn-primary" onClick={goNext}>Continuar →</button>
      </div>
    );
  }

  return (
    <>
      <div className="lesson-header">
        <h1>📝 Evaluación de Unidad {currentUnit + 1}</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "1.1rem" }}>
          Responde correctamente al menos al 70% de las preguntas para desbloquear la siguiente unidad.
        </p>
      </div>
      
      <QuizWidget
        questions={questions}
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
      <div className="lesson-nav" style={{ marginTop: '2rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={goNext} 
          disabled={!isLessonCompleted(currentUnit, currentLesson)}
        >
          Siguiente unidad →
        </button>
      </div>
    </>
  );
}

// ==================== FINAL SECTIONS ====================
function FinalSections({ curso, goPrev, courseId, enrollment, setEnrollment, loadCourseData, progress }) {
  const [evalAnswers, setEvalAnswers] = useState({});
  const [evalSubmitted, setEvalSubmitted] = useState(enrollment?.final_score > 0);
  const [repasoLoading, setRepasoLoading] = useState(false);
  const [repasoResult, setRepasoResult] = useState("");
  const [certRequestLoading, setCertRequestLoading] = useState(false);

  const evalPreguntas = curso.evaluacion_final?.preguntas || [];
  const proyectos = curso.proyecto_final;
  const fuentes = curso.fuentes || [];

  const handleLevelEvalSubmit = async () => {
    const correct = evalPreguntas.filter((q, i) => evalAnswers[i] === q.respuesta_correcta).length;
    const examScore = (correct / evalPreguntas.length) * 10;
    
    // Average unit scores (where score is not null)
    // Avoid double counting (final section itself if score was already here? No, final section is not in `progress` array, it is in `enrollment.final_score`)
    const unitScores = progress.filter(p => typeof p.score === "number").map(p => p.score);
    let finalScore = examScore;
    if (unitScores.length > 0) {
       const avgUnitScore = unitScores.reduce((a, b) => a + b, 0) / unitScores.length;
       const rawScore = (examScore * 0.6) + (avgUnitScore * 0.4); // 60% Final Exam, 40% Units
       finalScore = Math.round(rawScore * 10) / 10;
    } else {
       finalScore = Math.round(examScore * 10) / 10;
    }

    try {
      const updatedEnrollment = await api.saveFinalScore(courseId, finalScore);
      setEnrollment(updatedEnrollment);
      setEvalSubmitted(true);
      // Award XP for completing the final exam
      api.awardXP(100, 'final_exam_completed', courseId).catch(() => {});
      toast.success("Curso completado. Calificación guardada.");
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar la calificación final");
    }
  };

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
              onClick={handleLevelEvalSubmit}
              disabled={Object.keys(evalAnswers).length < evalPreguntas.length}
              style={{ width: "100%", marginTop: "1rem" }}
            >
              📊 Enviar evaluación final
            </button>
          ) : (
            <div className={`quiz-result ${enrollment?.final_score >= 7 ? "passed" : "failed"}`}>
              <p style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                {enrollment?.final_score >= 9
                  ? "🎓 ¡Excelencia Académica! Distinción de Honor"
                  : enrollment?.final_score >= 7
                  ? "📜 ¡Aprobado! Calificas para la certificación"
                  : "📚 Nota insuficiente para certificar (Mínimo 7.0)"}
              </p>
              <div className="score-display">
                <span className="score-label">Nota Final:</span>
                <span className={`score-value ${enrollment?.final_score >= 7 ? "text-success" : "text-danger"}`}>
                  {enrollment?.final_score} / 10
                </span>
              </div>

              {enrollment?.final_score >= 7 ? (
                <div style={{ marginTop: "1.5rem" }}>
                  <button 
                    className="btn btn-accent btn-lg" 
                    onClick={async () => {
                      setCertRequestLoading(true);
                      try {
                        await api.requestCertificate(courseId);
                        toast.success("¡Certificado emitido con éxito! Lo encontrarás en tu sección de Logros.");
                        loadCourseData(); // Reload to fetch cert
                      } catch (e) {
                        toast.error(e.message);
                      } finally { setCertRequestLoading(false); }
                    }}
                    disabled={certRequestLoading}
                    style={{ width: "100%" }}
                  >
                    {certRequestLoading ? "🏅 Generando..." : "🛡️ Obtener Certificado Oficial"}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: "1rem" }}>
                  <button className="btn btn-primary" onClick={() => setEvalSubmitted(false)}>
                    🔄 Reintentar Evaluación (Requiere Repaso)
                  </button>
                </div>
              )}
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

      {/* Social Share & Reviews */}
      {evalSubmitted && evalCorrectCount >= evalPreguntas.length / 2 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "2rem 0", padding: "2rem", background: "rgba(108, 92, 231, 0.1)", borderRadius: "16px", border: "1px solid rgba(108, 92, 231, 0.2)" }}>
          <h3 style={{ marginBottom: "1rem" }}>🎉 ¡Felicitaciones! Has aprobado el curso.</h3>
          <p style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            Puedes descargar tu certificado de participación ahora.<br/>
            <strong>Costo del Certificado de Aprobación Oficial: $20 USD adicionales.</strong>
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  const data = await api.createPayment(courseId, 'certificate');
                  toast.success("Cargando MercadoPago...");
                  setTimeout(() => {
                    window.location.href = data.init_point;
                  }, 1000);
                } catch (e) { toast.error(e.message || "Error al procesar el pago"); }
              }}
            >
              💳 Obtener Certificado Oficial ($20 USD)
            </button>
            <LinkedInShare title={curso.title || curso.titulo} summary={curso.descripcion_corta || curso.descripcion} />
          </div>
        </div>
      )}


      {/* Reviews */}
      <ReviewSection courseId={courseId} />

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
