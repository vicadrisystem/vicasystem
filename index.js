const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 8080;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const SYSTEM_PROMPT = `
Eres Víctor Candelaria, asesor oficial de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el producto digital "Mega Pack Alimentación Sana para Diabéticos".

Tu trabajo es responder dudas de forma NATURAL, BREVE, HUMANA, CERCANA y PROFESIONAL.

REGLAS DE COMUNICACIÓN:
- Nunca suenes robótico.
- Nunca digas que eres una inteligencia artificial.
- Responde máximo en 1 o 2 párrafos cortos.
- Usa español sencillo y claro.
- Usa emojis con moderación.
- Resuelve primero la duda.
- No presiones para vender.
- No inventes información.
- Si falta un dato oficial, indica que debes confirmarlo con el equipo de VICA SYSTEMS.

REGLAS DE SALUD:
- No hagas diagnósticos.
- No prometas curar o revertir la diabetes.
- No prometas eliminar medicamentos.
- No garantices resultados médicos.
- No sustituyas la valoración de un médico o profesional de la salud.
- El material es educativo y está enfocado en alimentación y hábitos saludables.

INFORMACIÓN OFICIAL:
- Negocio: VICA SYSTEMS.
- Agente: Víctor Candelaria.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Formato: producto digital en PDF.
- Precio oficial: $79 MXN.
- Entrega: digital después de confirmar el pago.
- Métodos de pago: transferencia bancaria o pago en efectivo.

CONTENIDO PRINCIPAL:
- Plan Integral de Alimentación.
- Recetario Saludable.
- Guía de Compras Inteligentes.

BONOS:
- Guía de Remedios Naturales y Hábitos Saludables.
- Recetario de Postres Saludables.

CONCEPTOS EMOCIONALES:
Cuando encajen de manera natural, puedes hablar de control, libertad, tranquilidad, bienestar, energía, seguridad, familia, salud, confianza y esperanza. Nunca los conviertas en promesas médicas.

OBJETIVO:
Después de resolver correctamente la duda, dirige suavemente a la compra solamente cuando exista intención comercial clara.
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()\[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function limpiarRespuesta(texto) {
  return String(texto || "")
    .trim()
    .replace(/^¡?\s*hola\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^gracias por preguntar\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenos d[ií]as\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenas tardes\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenas noches\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const CLAVES_MENSAJE = new Set([
  "texto", "mensaje", "message", "text", "input", "usermessage",
  "lasttextinput", "lastinputtext", "content", "query", "question"
]);

function buscarMensajeEnObjeto(valor, profundidad = 0) {
  if (profundidad > 8 || valor == null) return "";
  if (typeof valor === "string") return valor.trim();

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const hallado = buscarMensajeEnObjeto(item, profundidad + 1);
      if (hallado) return hallado;
    }
    return "";
  }

  if (typeof valor !== "object") return "";

  for (const [clave, contenido] of Object.entries(valor)) {
    const claveNormalizada = normalizarTexto(clave).replace(/\s+/g, "");
    if (CLAVES_MENSAJE.has(claveNormalizada) && typeof contenido === "string" && contenido.trim()) {
      return contenido.trim();
    }
  }

  for (const contenido of Object.values(valor)) {
    if (contenido && typeof contenido === "object") {
      const hallado = buscarMensajeEnObjeto(contenido, profundidad + 1);
      if (hallado) return hallado;
    }
  }

  return "";
}

function contieneFrase(texto, frases) {
  const limpio = ` ${normalizarTexto(texto)} `;
  return frases.some((frase) => {
    const objetivo = normalizarTexto(frase);
    return objetivo && limpio.includes(` ${objetivo} `);
  });
}

function cierreVenta() {
  return elegirAleatoria([
    `💙 El Mega Pack está disponible por $79 MXN. Puedes pagar por transferencia bancaria o en efectivo.`,
    `🥗 El Mega Pack completo cuesta $79 MXN y se entrega en formato digital después de confirmar tu pago.`,
    `😊 Si deseas adquirirlo, el Mega Pack está disponible por $79 MXN mediante transferencia bancaria o pago en efectivo.`,
  ]);
}

function crearRespuesta(intencion, opciones, conCierre = false) {
  const base = limpiarRespuesta(elegirAleatoria(opciones));
  return {
    intencion,
    respuesta: conCierre ? `${base}\n\n${cierreVenta()}` : base,
  };
}

function respuestaDirecta(textoNormalizado) {
  if (contieneFrase(textoNormalizado, [
    "cuanto cuesta", "cual es el precio", "precio del mega pack", "costo del mega pack",
    "cuanto vale", "precio", "costo", "79 pesos"
  ])) {
    return crearRespuesta("precio", [
      `El Mega Pack completo tiene un precio de $79 MXN. 😊`,
      `Actualmente el Mega Pack cuesta $79 MXN. 💙`,
      `El precio del Mega Pack digital es de $79 MXN. 🥗`,
    ], true);
  }

  if (contieneFrase(textoNormalizado, [
    "como puedo pagar", "metodos de pago", "forma de pago", "transferencia bancaria",
    "transferencia", "pago en efectivo", "efectivo", "puedo pagar en efectivo",
    "quiero pagar", "datos para pagar"
  ])) {
    return crearRespuesta("metodos_pago", [
      `Puedes pagar mediante transferencia bancaria o en efectivo. 😊`,
      `Aceptamos transferencia bancaria y pago en efectivo. 💙`,
      `El pago puede realizarse por transferencia bancaria o en efectivo. 🥗`,
    ], true);
  }

  if (contieneFrase(textoNormalizado, [
    "incluye postres", "trae postres", "hay recetas de postres", "recetario de postres",
    "postres saludables", "postres para diabeticos", "recetas de postres", "postres"
  ])) {
    return crearRespuesta("postres", [
      `Sí 😊 La oferta incluye un Recetario de Postres Saludables como bono.`,
      `Sí 💙 Dentro de los bonos recibirás un Recetario de Postres Saludables.`,
      `Sí 🍰 El Mega Pack incluye un bono dedicado a postres saludables.`,
    ], true);
  }

  if (contieneFrase(textoNormalizado, [
    "como recibo el producto", "como entregan el material", "donde descargo", "en que formato",
    "es digital", "es fisico", "recibir el pdf", "descargar el pdf", "enlace de descarga",
    "link de descarga", "pdf", "digital"
  ])) {
    return crearRespuesta("entrega", [
      `El Mega Pack es digital en PDF. Después de confirmar tu pago recibirás el material para descargarlo. 😊`,
      `La entrega es digital. En cuanto se confirme el pago recibirás el acceso al Mega Pack en PDF. 💙`,
      `No se envía ningún producto físico. Todo el material se entrega en PDF después de confirmar el pago. 🥗`,
    ], true);
  }

  if (contieneFrase(textoNormalizado, [
    "cuando lo recibo", "cuando llega", "cuanto tarda", "tiempo de entrega", "entrega inmediata",
    "lo recibo hoy", "demora la entrega", "en cuanto tiempo"
  ])) {
    return crearRespuesta("tiempo_entrega", [
      `Después de confirmar tu pago recibirás el acceso digital al material. 😊`,
      `La entrega se realiza después de validar el pago y el material se envía en formato digital. 💙`,
      `No necesitas esperar un envío físico; el acceso se entrega digitalmente después de confirmar el pago. 🥗`,
    ], true);
  }

  if (contieneFrase(textoNormalizado, [
    "que incluye el mega pack", "que contiene el mega pack", "que trae el paquete",
    "contenido del paquete", "contenido del mega pack", "cuales son los modulos", "que materiales incluye",
    "que incluye", "contenido"
  ])) {
    return crearRespuesta("contenido", [
      `Incluye el Plan Integral de Alimentación, el Recetario Saludable y la Guía de Compras Inteligentes. Además, incluye dos bonos: Guía de Remedios Naturales y Hábitos Saludables y Recetario de Postres Saludables. 😊`,
      `Recibirás tres recursos principales y dos bonos complementarios relacionados con hábitos y postres saludables. 💙`,
    ], true);
  }

  if (contieneFrase(textoNormalizado, [
    "que frutas puedo comer", "frutas para diabeticos", "puedo comer fruta", "puedo comer platano",
    "puedo comer mango", "puedo comer uvas", "puedo comer manzana", "que fruta recomiendan", "frutas"
  ])) {
    return crearRespuesta("frutas", [
      `El material incluye orientación general para ayudarte a organizar mejor tus elecciones de alimentos. Las porciones y opciones de fruta pueden variar según cada persona, por lo que conviene seguir también las indicaciones de tu profesional de salud. 💙`,
      `Las frutas pueden formar parte de una alimentación organizada, pero las cantidades deben adaptarse a las necesidades individuales y a la orientación profesional. 😊`,
    ]);
  }

  if (contieneFrase(textoNormalizado, [
    "puedo comer tortillas", "puedo comer tortilla", "puedo comer arroz", "puedo comer pan",
    "tengo que dejar la tortilla", "tengo que dejar el pan", "tengo que dejar el arroz",
    "tortilla", "arroz", "pan"
  ])) {
    return crearRespuesta("carbohidratos", [
      `El objetivo del material no es prohibir alimentos de forma general, sino ayudarte a organizar mejor tus elecciones. Las cantidades de tortilla, arroz o pan pueden variar según cada persona. 💙`,
      `No todas las personas necesitan las mismas porciones. La guía es educativa y debe complementarse con las indicaciones de tu profesional de salud. 😊`,
    ]);
  }

  if (contieneFrase(textoNormalizado, [
    "es facil de entender", "necesito saber nutricion", "es complicado", "es dificil",
    "sirve para principiantes", "lenguaje sencillo", "puedo entenderlo", "como se usa"
  ])) {
    return crearRespuesta("facilidad", [
      `Sí 😊 El Mega Pack está presentado con lenguaje sencillo y práctico para que puedas consultarlo sin conocimientos especializados de nutrición.`,
      `No necesitas ser especialista. El material está organizado para que sea fácil de consultar y aplicar en el día a día. 💙`,
    ]);
  }

  if (contieneFrase(textoNormalizado, [
    "los ingredientes son caros", "ingredientes caros", "recetas costosas", "recetas caras",
    "recetas complicadas", "recetas dificiles", "ingredientes faciles de conseguir",
    "necesito productos especiales", "se consigue en supermercado", "son recetas faciles", "ingredientes"
  ])) {
    return crearRespuesta("ingredientes", [
      `El objetivo es ofrecer opciones prácticas con ingredientes que puedan encontrarse en supermercados y comercios habituales. 😊`,
      `Las recetas buscan facilitar la alimentación diaria sin depender necesariamente de ingredientes difíciles de conseguir. 💙`,
    ]);
  }

  if (contieneFrase(textoNormalizado, [
    "tengo una duda", "necesito ayuda", "tengo un problema", "problema con el pago",
    "problema con la descarga", "no puedo descargar", "no recibi el material", "necesito soporte",
    "ayuda", "soporte"
  ])) {
    return crearRespuesta("soporte", [
      `Puedes escribirnos con confianza. El equipo de VICA SYSTEMS te ayudará con dudas relacionadas con el pago, la entrega o el acceso al material. 😊`,
      `Con gusto te ayudaremos a revisar cualquier inconveniente con tu compra o con la descarga del Mega Pack. 💙`,
    ]);
  }

  if (contieneFrase(textoNormalizado, [
    "sirve para diabetes tipo 1", "sirve para diabetes tipo 2", "sirve para prediabetes",
    "es para diabeticos", "puedo usarlo si tengo diabetes", "para quien es", "funciona para cualquier diabetico"
  ])) {
    return crearRespuesta("publico", [
      `El Mega Pack es una guía educativa para personas que desean mejorar y organizar su alimentación. No sustituye el tratamiento ni las indicaciones de un profesional de salud. 💙`,
      `El material ofrece información práctica sobre alimentación saludable. Cada persona tiene necesidades distintas, por eso debe mantenerse el seguimiento profesional. 😊`,
    ]);
  }

  if (contieneFrase(textoNormalizado, [
    "que voy a aprender", "que aprendere", "para que sirve el material", "que beneficios tiene", "que ensena"
  ])) {
    return crearRespuesta("aprendizaje", [
      `Aprenderás a organizar mejor tus comidas, conocer opciones de recetas y hacer compras más inteligentes. 😊`,
      `El material busca facilitar la planificación de tu alimentación con guías y recetas prácticas. 💙`,
    ], true);
  }

  if (contieneFrase(textoNormalizado, [
    "por que deberia comprarlo", "por que comprar el mega pack", "vale la pena",
    "que diferencia tiene", "por que me conviene"
  ])) {
    return crearRespuesta("razon_compra", [
      `Porque reúne en un solo lugar herramientas para organizar comidas, preparar recetas y hacer compras más inteligentes, sin tener que buscar información dispersa. 😊`,
      `Su principal ventaja es integrar alimentación, recetas y compras en una misma guía digital fácil de consultar. 💙`,
    ], true);
  }

  // Emocional al final para no robar FAQ específicas.
  if (contieneFrase(textoNormalizado, [
    "glucosa", "azucar", "control", "energia", "bienestar", "familia",
    "esperanza", "confianza", "vida", "cambio", "salud"
  ])) {
    return crearRespuesta("bienestar_emocional", [
      `Entiendo 💙 Muchas personas buscan más claridad y tranquilidad al organizar su alimentación. El Mega Pack está pensado como una guía práctica para apoyar mejores decisiones en el día a día, sin sustituir la orientación médica.`,
      `Cuidar la alimentación puede ayudar a sentir más orden y confianza al decidir qué comprar y preparar. 🥗 El material reúne herramientas prácticas para organizar mejor tus hábitos.`,
    ]);
  }

  return null;
}

function tieneIntencionComercial(textoNormalizado) {
  return contieneFrase(textoNormalizado, [
    "quiero comprar", "quiero adquirir", "quiero el mega pack", "me interesa comprar",
    "como lo compro", "donde pago", "quiero pagar", "datos bancarios"
  ]);
}

function extraerTextoRespuestaAPI(data) {
  if (!data || typeof data !== "object") return "";
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();

  if (Array.isArray(data.output)) {
    const textos = [];
    for (const item of data.output) {
      if (!item || !Array.isArray(item.content)) continue;
      for (const contenido of item.content) {
        if (contenido && contenido.type === "output_text" && typeof contenido.text === "string") {
          textos.push(contenido.text);
        }
      }
    }
    return textos.join("\n").trim();
  }

  return "";
}

async function consultarOpenAI(texto) {
  if (!OPENAI_API_KEY) return "";

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 20000);

  try {
    const respuesta = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: SYSTEM_PROMPT,
        input: texto,
        max_output_tokens: 220,
      }),
      signal: controlador.signal,
    });

    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      console.error("OpenAI HTTP error:", respuesta.status, data?.error?.message || "sin detalle");
      return "";
    }

    return extraerTextoRespuestaAPI(data);
  } catch (error) {
    console.error("OpenAI request error:", error?.name || "Error", error?.message || error);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function leerCuerpo(req, limite = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let datos = "";
    let total = 0;

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > limite) {
        reject(new Error("BODY_TOO_LARGE"));
        req.destroy();
        return;
      }
      datos += chunk.toString("utf8");
    });

    req.on("end", () => resolve(datos));
    req.on("error", reject);
  });
}

function parsearCuerpo(raw, contentType) {
  const texto = String(raw || "").trim();
  if (!texto) return {};

  if (contentType.includes("application/json")) {
    try { return JSON.parse(texto); } catch { return { text: texto }; }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(texto);
    return Object.fromEntries(params.entries());
  }

  // Algunos conectores mandan JSON pero con content-type incorrecto.
  if ((texto.startsWith("{") && texto.endsWith("}")) || (texto.startsWith("[") && texto.endsWith("]"))) {
    try { return JSON.parse(texto); } catch {}
  }

  return { text: texto };
}

function responderJSON(res, status, payload) {
  const cuerpo = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(cuerpo),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(cuerpo);
}

async function manejarMensaje(req, res, url) {
  try {
    let body = {};

    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      const raw = await leerCuerpo(req);
      body = parsearCuerpo(raw, String(req.headers["content-type"] || "").toLowerCase());
    }

    const queryObj = Object.fromEntries(url.searchParams.entries());
    const texto = buscarMensajeEnObjeto(body) || buscarMensajeEnObjeto(queryObj);

    console.log(
      "Solicitud /mensaje:",
      req.method,
      "content-type:",
      req.headers["content-type"] || "sin-content-type",
      "mensaje:",
      texto ? "[detectado]" : "[no detectado]"
    );

    if (!texto) {
      return responderJSON(res, 200, {
        respuesta: "No pude identificar tu mensaje. Escríbelo nuevamente, por favor. 😊",
      });
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Intención detectada:", directa.intencion);
      return responderJSON(res, 200, { respuesta: directa.respuesta });
    }

    console.log("Intención detectada: consulta_abierta");

    let respuestaIA = limpiarRespuesta(await consultarOpenAI(texto));

    if (!respuestaIA) {
      respuestaIA = OPENAI_API_KEY
        ? "En este momento no pude procesar esa consulta. Inténtalo nuevamente en unos minutos. 😊"
        : "Necesito confirmar esa información con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
    }

    if (tieneIntencionComercial(textoNormalizado)) {
      respuestaIA = `${respuestaIA}\n\n${cierreVenta()}`;
    }

    return responderJSON(res, 200, { respuesta: respuestaIA });
  } catch (error) {
    console.error("Error en /mensaje:", error?.message || error);
    return responderJSON(res, 200, {
      respuesta: "En este momento no pude procesar tu mensaje. Inténtalo nuevamente en unos minutos. 😊",
    });
  }
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
    return res.end();
  }

  if (url.pathname === "/") {
    return responderJSON(res, 200, {
      ok: true,
      servicio: "VICA SYSTEMS",
      mensaje: "Bot ventas activo ✅",
      openai: OPENAI_API_KEY ? "configurada" : "no_configurada",
    });
  }

  if (url.pathname === "/mensaje" || url.pathname === "/mensaje/") {
    return manejarMensaje(req, res, url);
  }

  return responderJSON(res, 404, { respuesta: "Ruta no encontrada." });
});

servidor.on("clientError", (error, socket) => {
  console.error("Client error:", error?.message || error);
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor VICA SYSTEMS activo en puerto ${PORT}`);
  console.log(`Modelo configurado: ${MODEL}`);
  console.log(`OPENAI_API_KEY: ${OPENAI_API_KEY ? "configurada" : "NO configurada"}`);
});
