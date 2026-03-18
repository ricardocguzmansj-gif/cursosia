import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [badgeDefs, setBadgeDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [lb, profile, badges] = await Promise.all([
        api.getLeaderboard(20),
        api.getGamificationProfile(),
        api.getBadgeDefinitions()
      ]);
      setPlayers(lb);
      setMyProfile(profile);
      setBadgeDefs(badges);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const getBadgeIcon = (id) => {
    const badge = badgeDefs.find(b => b.id === id);
    return badge?.icon || "🏅";
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
        <h1>🏆 {t("leaderboard_title", "Leaderboard")}</h1>
      </div>

      {/* My stats */}
      {myProfile && (
        <div className="leaderboard-my-stats glass">
          <div className="lb-stat">
            <span className="lb-stat-label">Tu XP</span>
            <span className="lb-stat-value">⭐ {myProfile.total_xp || 0}</span>
          </div>
          <div className="lb-stat">
            <span className="lb-stat-label">Racha</span>
            <span className="lb-stat-value">🔥 {myProfile.current_streak || 0} días</span>
          </div>
          <div className="lb-stat">
            <span className="lb-stat-label">Mejor racha</span>
            <span className="lb-stat-value">⚡ {myProfile.longest_streak || 0} días</span>
          </div>
          <div className="lb-stat">
            <span className="lb-stat-label">Badges</span>
            <span className="lb-stat-value">🏆 {(myProfile.badges || []).length}</span>
          </div>
        </div>
      )}

      {/* Ranking table */}
      <div className="analytics-section glass">
        <div className="analytics-table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Estudiante</th>
                <th>XP</th>
                <th>Racha</th>
                <th>Badges</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.id} className={p.full_name === myProfile?.full_name ? "lb-me" : ""}>
                  <td>
                    <span className="lb-rank">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                  </td>
                  <td><strong>{p.full_name || "Anónimo"}</strong></td>
                  <td>⭐ {p.total_xp || 0}</td>
                  <td>🔥 {p.current_streak || 0}</td>
                  <td>
                    {(p.badges || []).slice(0, 5).map((bId, j) => (
                      <span key={j} title={bId}>{getBadgeIcon(bId)}</span>
                    ))}
                    {(p.badges || []).length === 0 && <span style={{ color: "var(--text-dim)" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
