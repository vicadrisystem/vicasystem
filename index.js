const http = require("http");

const PORT = Number(process.env.PORT || 8080);

function enviarJSON(res, respuesta) {
  const body = JSON.stringify({
    respuesta: String(respuesta || "")
  });

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(body);
}

function extraerTexto(rawBody, contentType) {
  const raw = String(rawBody || "").trim();

  if (!raw) {
    return "";
  }

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(raw);

      return String(
        data.texto ||
        data.mensaje ||
        data.message ||
        data.text ||
        data.input ||
        data.last_text_input ||
        ""
      ).trim();
    } catch {
      return raw;
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const data = Object.fromEntries(new URLSearchParams(raw));

    return String(
      data.texto ||
      data.mensaje ||
      data.message ||
      data.text ||
      data.input ||
      data.last_text_input ||
      ""
    ).trim();
  }

  return raw;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    );

    if (url.pathname === "/") {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
      });

      return res.end("VICA SYSTEMS ACTIVO ✅");
    }

    if (url.pathname !== "/mensaje") {
      return enviarJSON(res, "Ruta no encontrada.");
    }

    if (req.method === "GET") {
      const texto =
        url.searchParams.get("texto") ||
        url.searchParams.get("mensaje") ||
        url.searchParams.get("message") ||
        url.searchParams.get("text") ||
        "";

      console.log("GET /mensaje:", texto || "[vacío]");

      return enviarJSON(
        res,
        texto
          ? `✅ VICA SYSTEMS recibió tu mensaje: ${texto}`
          : "✅ VICA SYSTEMS está conectado."
      );
    }

    if (req.method === "POST") {
      const chunks = [];

      for await (const chunk of req) {
        chunks.push(chunk);
      }

      const rawBody = Buffer.concat(chunks).toString("utf8");
      const contentType = String(
        req.headers["content-type"] || ""
      ).toLowerCase();

      const texto = extraerTexto(rawBody, contentType);

      console.log("POST /mensaje");
      console.log("Content-Type:", contentType || "[sin content-type]");
      console.log("Body recibido:", rawBody ? "[sí]" : "[no]");
      console.log("Texto detectado:", texto ? "[sí]" : "[no]");

      return enviarJSON(
        res,
        texto
          ? `✅ VICA SYSTEMS recibió correctamente: ${texto}`
          : "✅ El servidor recibió la solicitud, pero ManyChat no envió texto."
      );
    }

    return enviarJSON(res, "Método no permitido.");
  } catch (error) {
    console.error("ERROR:", error.message);

    return enviarJSON(
      res,
      "El servidor está activo pero ocurrió un error al procesar la solicitud."
    );
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`VICA SYSTEMS escuchando en puerto ${PORT}`);
});
