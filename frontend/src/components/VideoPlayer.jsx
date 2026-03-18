import React from "react";

export default function VideoPlayer({ url }) {
  if (!url) return null;

  // Function to extract video ID from various YouTube URL formats
  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(url);

  if (!videoId) {
    return (
      <div className="video-error-placeholder glass">
        <p>⚠️ No se pudo cargar el video educativo. Puedes verlo directamente aquí: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
      </div>
    );
  }

  return (
    <div className="video-container glass">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
}
