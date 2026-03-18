import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este curso?")) return;

    try {
      await api.deleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
    } catch (err) {
      alert("Error eliminando el curso");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("es", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-spinner" style={{ margin: "4rem auto" }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1>Mis Cursos</h1>
        <Link to="/generate" className="btn btn-primary">
          ✨ Generar nuevo curso
        </Link>
      </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <h3>Aún no tenés cursos</h3>
            <p>Creá tu primer curso con IA en menos de un minuto</p>
            <Link to="/generate" className="btn btn-primary btn-lg">
              ✨ Generar mi primer curso
            </Link>
          </div>
        ) : (
          courses.map(course => (
            <div
              key={course.id}
              className="card course-card"
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <div className="course-meta">
                <span className="badge badge-level">{course.level}</span>
                <span className="badge badge-profile">{course.profile}</span>
              </div>
              <h3>{course.title}</h3>
              <p className="course-topic">📖 {course.topic}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="course-date">{formatDate(course.created_at)}</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => handleDelete(e, course.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
