import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function AffiliateDashboard() {
  const [affiliates, setAffiliates] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // My affiliate links
      const { data: aff } = await supabase
        .from("affiliates")
        .select("*, courses(title, price, currency)")
        .eq("user_id", user.id);
      setAffiliates(aff || []);

      // My sales
      const { data: sls } = await supabase
        .from("affiliate_sales")
        .select("*, courses(title), affiliates!inner(user_id)")
        .eq("affiliates.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setSales(sls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPending = sales.filter(s => s.status === "pending").reduce((a, s) => a + parseFloat(s.commission_amount || 0), 0);
  const totalPaid = sales.filter(s => s.status === "paid").reduce((a, s) => a + parseFloat(s.commission_amount || 0), 0);
  const totalSales = sales.length;

  const copyLink = (code) => {
    const url = `${window.location.origin}/catalog?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("¡Link copiado!");
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
        <h1>🤝 {t("affiliate_title", "Panel de Afiliados")}</h1>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpis">
        <div className="kpi-card glass">
          <span className="kpi-icon">🔗</span>
          <div className="kpi-value">{affiliates.length}</div>
          <div className="kpi-label">Links activos</div>
        </div>
        <div className="kpi-card glass">
          <span className="kpi-icon">🛒</span>
          <div className="kpi-value">{totalSales}</div>
          <div className="kpi-label">Ventas referidas</div>
        </div>
        <div className="kpi-card glass">
          <span className="kpi-icon">⏳</span>
          <div className="kpi-value">${totalPending.toFixed(2)}</div>
          <div className="kpi-label">Comisiones pendientes</div>
        </div>
        <div className="kpi-card glass">
          <span className="kpi-icon">✅</span>
          <div className="kpi-value">${totalPaid.toFixed(2)}</div>
          <div className="kpi-label">Comisiones pagadas</div>
        </div>
      </div>

      {/* Affiliate Links */}
      <div className="analytics-section glass">
        <h2>🔗 Mis Links de Referido</h2>
        {affiliates.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No tienes links de afiliado aún. Contacta al creador de un curso para solicitar uno.
          </p>
        ) : (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Comisión</th>
                  <th>Código</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.courses?.title || "Curso"}</strong></td>
                    <td>{a.commission_pct}%</td>
                    <td><code>{a.referral_code}</code></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => copyLink(a.referral_code)}>
                        📋 Copiar link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales History */}
      <div className="analytics-section glass">
        <h2>💰 Historial de Ventas</h2>
        {sales.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No tienes ventas registradas aún.</p>
        ) : (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Comisión</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id}>
                    <td>{s.courses?.title || "Curso"}</td>
                    <td>${parseFloat(s.commission_amount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${s.status === 'paid' ? 'badge-level' : ''}`}
                        style={s.status === 'paid'
                          ? { background: 'rgba(0,184,148,0.15)', color: 'var(--success)' }
                          : { background: 'rgba(253,203,110,0.15)', color: 'var(--warning)' }
                        }>
                        {s.status === 'paid' ? '✅ Pagado' : s.status === 'pending' ? '⏳ Pendiente' : s.status}
                      </span>
                    </td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
