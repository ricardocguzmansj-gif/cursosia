import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function GamificationBar() {
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    loadGamification();
  }, []);

  const loadGamification = async () => {
    try {
      const [prof, badgeDefs] = await Promise.all([
        api.getGamificationProfile(),
        api.getBadgeDefinitions()
      ]);
      setProfile(prof);
      setBadges(badgeDefs);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return null;

  const xpNextLevel = Math.ceil((profile.total_xp || 0) / 100) * 100 || 100;
  const xpProgress = ((profile.total_xp || 0) % 100);
  const level = Math.floor((profile.total_xp || 0) / 100) + 1;
  const earnedBadges = profile.badges || [];

  return (
    <>
      <div className="gamification-bar glass">
        <div className="gam-stat" title="Nivel">
          <span className="gam-level">Lvl {level}</span>
        </div>

        <div className="gam-xp-section">
          <div className="gam-xp-bar">
            <div className="gam-xp-fill" style={{ width: `${xpProgress}%` }}></div>
          </div>
          <span className="gam-xp-text">⭐ {profile.total_xp || 0} XP</span>
        </div>

        <div className="gam-stat" title="Racha de estudio">
          <span className="gam-streak">🔥 {profile.current_streak || 0}</span>
        </div>

        <button className="gam-badges-btn" onClick={() => setShowBadges(!showBadges)}>
          🏆 {earnedBadges.length}
        </button>
      </div>

      {/* Badges modal */}
      {showBadges && (
        <div className="gam-modal-overlay" onClick={() => setShowBadges(false)}>
          <div className="gam-modal glass" onClick={e => e.stopPropagation()}>
            <div className="gam-modal-header">
              <h3>🏆 Logros</h3>
              <button onClick={() => setShowBadges(false)}>✕</button>
            </div>
            <div className="gam-badges-grid">
              {badges.map(b => {
                const earned = earnedBadges.includes(b.id);
                return (
                  <div key={b.id} className={`gam-badge ${earned ? "gam-badge-earned" : "gam-badge-locked"}`}>
                    <span className="gam-badge-icon">{b.icon}</span>
                    <span className="gam-badge-name">{b.name}</span>
                    <span className="gam-badge-desc">{b.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
