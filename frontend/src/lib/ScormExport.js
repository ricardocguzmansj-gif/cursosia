import JSZip from "jszip";

export async function exportScorm12(course) {
  const zip = new JSZip();

  // 1. the imsmanifest.xml
  const manifest = `<?xml version="1.0" standalone="no" ?>
<manifest identifier="CursosIA-${course.id}" version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">

    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
        <adlcp:location>metadata.xml</adlcp:location>
    </metadata>

    <organizations default="CursosIA_ORG">
        <organization identifier="CursosIA_ORG">
            <title>${course.title || course.titulo}</title>
            <item identifier="ITEM_1" identifierref="RES_1">
                <title>${course.title || course.titulo}</title>
            </item>
        </organization>
    </organizations>

    <resources>
        <resource identifier="RES_1" type="webcontent" href="index.html" adlcp:scormtype="sco">
            <file href="index.html"/>
            <file href="scormAPI.js"/>
        </resource>
    </resources>
</manifest>`;

  zip.file("imsmanifest.xml", manifest);

  // 2. The SCORM 1.2 Wrapper API Stub (scormAPI.js)
  const scormApi = `
var scorm = {
    init: function() { console.log("SCORM Init"); return "true"; },
    get: function(param) { console.log("SCORM Get", param); return ""; },
    set: function(param, value) { console.log("SCORM Set", param, value); return "true"; },
    commit: function() { console.log("SCORM Commit"); return "true"; },
    finish: function() { console.log("SCORM Finish"); return "true"; }
};
`;
  zip.file("scormAPI.js", scormApi);

  // 3. Generate the index.html with the course content embedded
  const rawData = course.content || course.contenido || course;
  
  let contentHtml = `<h1>${course.title || course.titulo || "Curso generado por IA"}</h1>`;
  if (rawData.unidades) {
    rawData.unidades.forEach(u => {
      contentHtml += `<h2>${u.titulo}</h2><p>${u.descripcion}</p>`;
      if (u.lecciones) {
        u.lecciones.forEach(l => {
          contentHtml += `<h3>${l.titulo}</h3><p>${l.contenido.replace(/\n/g, '<br/>')}</p>`;
        });
      }
    });
  }

  const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${course.title || course.titulo}</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }
        h1, h2, h3 { color: #2c3e50; }
        h2 { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 40px; }
        .footer { margin-top: 50px; font-size: 0.8em; color: #888; text-align: center; }
    </style>
    <script src="scormAPI.js"></script>
</head>
<body>
    ${contentHtml}
    
    <div class="footer">
      Generado por CursosIA (SCORM 1.2 Export)
      <br><button onclick="alert('Funcionalidad SCORM completada (mock)')">Finalizar Curso en LMS</button>
    </div>
</body>
</html>`;

  zip.file("index.html", indexHtml);

  // Download the zip
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SCORM_${course.title?.replace(/\\s+/g, '_') || "Curso"}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
