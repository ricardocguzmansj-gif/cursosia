const apiKey = "AIzaSyB8j6G8NTBNktKF3monh-aJAwHSCnU09AM";

async function listModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (data.models) {
    console.log("Available models:");
    data.models.forEach(m => {
      if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${m.name}`);
      }
    });
  } else {
    console.error("Failed to list models:", data);
  }
}

listModels();
