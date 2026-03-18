import React, { useState, useEffect } from "react";

export default function AudioPlayer({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a good Spanish voice by default, or fallback to browser default
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith("es-"));
    if (esVoice) utterance.voice = esVoice;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!supported) return null;

  return (
    <div className="audio-tts-player">
      {!isPlaying && !isPaused ? (
        <button className="btn btn-outline btn-sm" onClick={handlePlay} title="Escuchar lección">
          🎧 Escuchar
        </button>
      ) : (
        <>
          {isPlaying ? (
            <button className="btn btn-outline btn-sm" onClick={handlePause} title="Pausar">
              ⏸️ Pausa
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handlePlay} title="Reanudar">
              ▶️ Play
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={handleStop} title="Detener">
            ⏹️ Stop
          </button>
        </>
      )}
    </div>
  );
}
