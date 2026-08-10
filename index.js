const http = require("http");

const PORT = Number(process.env.PORT || 8080);
const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();

const SYSTEM_PROMPT = `
Eres Víctor Candelaria, asesor de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el producto digital
"Mega Pack Alimentación Sana para Diabéticos".

ESTILO:
- Natural, breve, humano y cercano.
- Máximo 1 o 2 párrafos cortos.
- Español sencillo.
- Usa emojis con moderación.
- Primero resuelve la duda.
- Solo después guía suavemente al siguiente paso de compra cuando corresponda.
- No saludes innecesariamente.
- No hagas varias preguntas a la vez.
- No inventes información.

INFORMACIÓN OFICIAL:
- Negocio: VICA SYSTEMS.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Precio: $79 MXN.
- Formato: digital en PDF.
- Entrega: digital después de confirmar el pago.
- Métodos de pago: transferencia bancaria o pago en efectivo.
- Incluye:
  1. Plan Integral de Alimentación.
  2. Recetario Saludable.
  3. Guía de Compras Inteligentes.
- Bonos:
  1. Guía de Remedios Naturales y Hábitos Saludables.
  2. Recetario de Postres Saludables.

DOLORES DEL AVATAR:
- No saber qué comer.
- Miedo a equivocarse con los alimentos.
- Sentir que todo está prohibido.
- Confusión sobre frutas, tortilla, arroz, pan y postres.
- No saber organizar las comidas.
- Cansancio de información contradictoria.
- Preocupación por su bienestar y su familia.

DESEOS DEL AVATAR:
- Sentir más control.
- Tener tranquilidad al elegir alimentos.
- Organizar mejor las comidas.
- Saber qué comprar.
- Tener recetas prácticas.
- Sentirse con más confianza.
- Cuidar su bienestar y el de su familia.

PALABRAS EMOCIONALES:
control, tranquilidad, bienestar, energía, seguridad, familia,
salud, confianza, esperanza y cambio.

REGLAS MÉDICAS:
- No diagnostiques.
- No prometas curar o revertir la diabetes.
- No prometas eliminar medicamentos.
- No garantices resultados médicos.
- No sustituyas la atención de un médico o profesional de salud.

OBJETIVO:
Contestar la pregunta y mantener la conversación avanzando hacia el embudo
cuando exista intención comercial, sin presión.
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function contieneAlguna(texto, frases) {
  const normalizado = ` ${normalizarTexto(texto)} `;
  return frases.some((frase) => {
    const objetivo = ` ${normalizarTexto(frase)} `;
    return normalizado.includes(objetivo);
  });
}

function cierreVenta() {
  return elegirAleatoria([
    `💙 El Mega Pack está disponible por $79 MXN. Puedes pagar por transferencia bancaria o en efectivo.`,
    `🥗 El Mega Pack completo cuesta $79 MXN y se entrega digitalmente después de confirmar el pago.`,
    `😊 Si decides adquirirlo, el precio es de $79 MXN y puedes pagar por transferencia o en efectivo.`,
  ]);
}

function respuestaDirecta(textoOriginal) {
  const t = normalizarTexto(textoOriginal);

  // Intenciones específicas primero para evitar choques.

  if (
    t === "precio" ||
    t === "costo" ||
    contieneAlguna(t, [
      "cuanto cuesta",
      "cual es el precio",
      "precio del mega pack",
      "costo del mega pack",
      "cuanto vale",
      "79 pesos"
    ])
  ) {
    return `El Mega Pack completo tiene un precio de $79 MXN. 😊

${cierreVenta()}`;
  }

  if (contieneAlguna(t, [
    "como puedo pagar",
    "metodos de pago",
    "forma de pago",
    "transferencia bancaria",
    "pago en efectivo",
    "quiero pagar",
    "datos para pagar",
    "como compro",
    "quiero comprar"
  ])) {
    return `Puedes realizar el pago por transferencia bancaria o en efectivo. 😊

${cierreVenta()}`;
  }

  if (contieneAlguna(t, [
    "que incluye el mega pack",
    "que contiene el mega pack",
    "que trae el paquete",
    "contenido del mega pack",
    "cuales son los modulos",
    "que materiales incluye",
    "que incluye"
  ])) {
    return `Incluye el Plan Integral de Alimentación, el Recetario Saludable y la Guía de Compras Inteligentes. 💙 También recibes la Guía de Remedios Naturales y Hábitos Saludables y el Recetario de Postres Saludables como bonos.

${cierreVenta()}`;
  }

  if (contieneAlguna(t, [
    "incluye postres",
    "trae postres",
    "recetas de postres",
    "recetario de postres",
    "postres saludables",
    "postres"
  ])) {
    return `Sí 😊 El Mega Pack incluye como bono un Recetario de Postres Saludables.

${cierreVenta()}`;
  }

  if (contieneAlguna(t, [
    "como recibo el producto",
    "como entregan el material",
    "en que formato",
    "es digital",
    "es fisico",
    "recibir el pdf",
    "descargar el pdf",
    "link de descarga",
    "entrega",
    "descarga"
  ])) {
    return `El material es 100% digital en PDF. Después de confirmar tu pago recibirás el acceso para descargarlo. 💙

${cierreVenta()}`;
  }

  if (contieneAlguna(t, [
    "cuando lo recibo",
    "cuando llega",
    "cuanto tarda",
    "tiempo de entrega",
    "en cuanto tiempo"
  ])) {
    return `La entrega es digital y se realiza después de confirmar el pago. 😊

${cierreVenta()}`;
  }

  if (contieneAlguna(t, [
    "que frutas puedo comer",
    "frutas para diabeticos",
    "puedo comer fruta",
    "puedo comer platano",
    "puedo comer mango",
    "puedo comer uvas",
    "puedo comer manzana",
    "frutas"
  ])) {
    return `Las frutas pueden formar parte de una alimentación organizada, pero las porciones adecuadas pueden variar según cada persona y la orientación de su profesional de salud. 💙`;
  }

  if (contieneAlguna(t, [
    "puedo comer tortillas",
    "puedo comer tortilla",
    "puedo comer arroz",
    "puedo comer pan",
    "tortilla",
    "arroz",
    "pan"
  ])) {
    return `El objetivo no es prohibir alimentos de forma general. Las cantidades de tortilla, arroz o pan pueden variar según las necesidades de cada persona. 💙`;
  }

  if (contieneAlguna(t, [
    "recetas faciles",
    "recetas complicadas",
    "ingredientes caros",
    "ingredientes",
    "recetas",
    "cocinar"
  ])) {
    return `El material está pensado para facilitar la alimentación diaria con recetas prácticas y una guía clara para organizar mejor tus comidas. 🥗`;
  }

  if (contieneAlguna(t, [
    "es facil",
    "es dificil",
    "es complicado",
    "puedo entenderlo",
    "necesito saber nutricion",
    "como se usa"
  ])) {
    return `El material está presentado con lenguaje sencillo y práctico. 😊 No necesitas conocimientos de nutrición para consultarlo.`;
  }

  if (contieneAlguna(t, [
    "que voy a aprender",
    "que aprendere",
    "que beneficios tiene",
    "para que sirve",
    "beneficios"
  ])) {
    return `Aprenderás a organizar mejor tus comidas, consultar opciones de recetas y realizar compras más inteligentes. 💙`;
  }

  if (contieneAlguna(t, [
    "sirve para diabetes tipo 1",
    "sirve para diabetes tipo 2",
    "sirve para prediabetes",
    "es para diabeticos",
    "para quien es"
  ])) {
    return `Es una guía educativa para personas que desean mejorar y organizar su alimentación. 💙 No sustituye las indicaciones de un médico o profesional de salud.`;
  }

  if (contieneAlguna(t, [
    "tengo una duda",
    "necesito ayuda",
    "tengo un problema",
    "problema con el pago",
    "problema con la descarga",
    "no recibi el material",
    "soporte"
  ])) {
    return `Puedes escribirnos con confianza. 😊 Te ayudaremos con dudas relacionadas con el pago, la entrega o el acceso al material.`;
  }

  if (contieneAlguna(t, [
    "glucosa",
    "azucar",
    "control",
    "energia",
    "bienestar",
    "familia",
    "esperanza",
    "confianza",
    "salud",
    "cambio"
  ])) {
    return `Entiendo 💙 Buscar más claridad y tranquilidad al organizar tu alimentación es una preocupación muy común. El material está pensado para darte una guía práctica sin sustituir la atención profesional.`;
  }

  return null;
}

function buscarTexto(valor, profundidad = 0) {
  if (profundidad > 8 || valor == null) return "";

  if (typeof valor === "string") {
    return valor.trim();
  }

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const r = buscarTexto(item, profundidad + 1);
      if (r) return r;
    }
    return "";
  }

  if (typeof valor === "object") {
    const claves = [
      "texto",
      "mensaje",
      "message",
      "text",
      "input",
      "user_message",
      "last_text_input",
      "lastTextInput",
      "content"
    ];

    for (const clave of claves) {
      if (Object.prototype.hasOwnProperty.call(valor, clave)) {
        const r = buscarTexto(valor[clave], profundidad + 1);
        if (r) return r;
      }
    }

    for (const [clave, contenido] of Object.entries(valor)) {
      if (/text|message|mensaje|input|content/i.test(clave)) {
        const r = buscarTexto(contenido, profundidad + 1);
        if (r) return r;
      }
    }

    for (const contenido of Object.values(valor)) {
      if (contenido && typeof contenido === "object") {
        const r = buscarTexto(contenido, profundidad + 1);
        if (r) return r;
      }
    }
  }

  return "";
}

function parsearBody(raw, contentType) {
  const texto = String(raw || "").trim();
  if (!texto) return {};

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(texto);
    } catch {
      return { texto };
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(texto));
  }

  try {
    return JSON.parse(texto);
  } catch {
    return { texto };
  }
}

function respuestaRespaldo(texto) {
  const t = normalizarTexto(texto);

  if (t.includes("comer") || t.includes("comida") || t.includes("alimentacion")) {
    return `Entiendo 💙 Una de las dudas más comunes es saber qué comer y cómo organizar las comidas. El Mega Pack reúne una guía de alimentación, recetas y compras inteligentes para ayudarte a tener más claridad en el día a día.`;
  }

  if (t.includes("comprar") || t.includes("pagar") || t.includes("precio")) {
    return `Claro 😊 El Mega Pack tiene un precio de $79 MXN y puedes pagarlo por transferencia bancaria o en efectivo.`;
  }

  return `Entiendo tu duda 💙 El Mega Pack está pensado para ayudarte a organizar mejor tu alimentación con una guía práctica, recetas y compras inteligentes. Si tu pregunta requiere un dato específico que no tengo confirmado, prefiero no inventarlo.`;
}

async function llamarOpenAI(texto) {
  if (!OPENAI_API_KEY) {
    return respuestaRespaldo(texto);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions: SYSTEM_PROMPT,
        input: texto,
        max_output_tokens: 160
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error("OpenAI HTTP:", response.status);
      return respuestaRespaldo(texto);
    }

    const data = await response.json();

    if (typeof data.output_text === "string" && data.output_text.trim()) {
      return data.output_text.trim();
    }

    const partes = [];
    for (const item of data.output || []) {
      for (const content of item.content || []) {
        if (content.type === "output_text" && content.text) {
          partes.push(content.text);
        }
      }
    }

    return partes.join("\n").trim() || respuestaRespaldo(texto);
  } catch (error) {
    console.error("OpenAI fallback:", error.name, error.message);
    return respuestaRespaldo(texto);
  } finally {
    clearTimeout(timer);
  }
}

function enviarJSON(res, respuesta, intencion = "agente") {
  const body = JSON.stringify({
    respuesta: String(respuesta || ""),
    ok: true,
    intencion
  });

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      return res.end();
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return enviarJSON(res, "VICA SYSTEMS ACTIVO ✅", "health");
    }

    if (url.pathname !== "/mensaje" && url.pathname !== "/mensaje/") {
      return enviarJSON(res, "Ruta no encontrada.", "ruta");
    }

    let texto = "";

    if (req.method === "GET") {
      texto =
        url.searchParams.get("texto") ||
        url.searchParams.get("mensaje") ||
        url.searchParams.get("message") ||
        url.searchParams.get("text") ||
        "";
    } else if (req.method === "POST") {
      const chunks = [];
      let total = 0;

      for await (const chunk of req) {
        total += chunk.length;

        if (total > 1024 * 1024) {
          return enviarJSON(res, "Mensaje demasiado grande.", "error");
        }

        chunks.push(chunk);
      }

      const raw = Buffer.concat(chunks).toString("utf8");
      const contentType = String(req.headers["content-type"] || "").toLowerCase();
      const body = parsearBody(raw, contentType);
      texto = buscarTexto(body);
    } else {
      return enviarJSON(res, "Método no permitido.", "error");
    }

    texto = String(texto || "").trim();

    if (!texto) {
      return enviarJSON(
        res,
        "Recibí tu mensaje, pero no pude identificar el texto. Escríbeme nuevamente y con gusto te respondo. 😊",
        "mensaje_vacio"
      );
    }

    console.log("Mensaje recibido:", "[sí]", "| longitud:", texto.length);

    const directa = respuestaDirecta(texto);

    if (directa) {
      return enviarJSON(res, directa, "faq");
    }

    const respuestaIA = await llamarOpenAI(texto);
    return enviarJSON(res, respuestaIA, "openai_o_respaldo");

  } catch (error) {
    console.error("Error general:", error.name, error.message);

    return enviarJSON(
      res,
      "Estoy aquí para ayudarte 💙 Escríbeme nuevamente tu duda sobre el Mega Pack y te respondo.",
      "error_controlado"
    );
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`VICA SYSTEMS activo en puerto ${PORT}`);
});
