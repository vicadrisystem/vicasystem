const http = require("http");

const PORT = Number(process.env.PORT || 8080);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const SYSTEM_PROMPT = `
Eres Víctor Candelaria, asesor de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el producto digital
"Mega Pack Alimentación Sana para Diabéticos".

Responde de forma NATURAL, BREVE, HUMANA, CERCANA y PROFESIONAL.

REGLAS:
- Nunca suenes robótico.
- Nunca digas que eres una inteligencia artificial.
- Responde máximo en 1 o 2 párrafos cortos.
- Usa español sencillo.
- Usa emojis con moderación.
- Primero resuelve la duda.
- No presiones.
- No inventes información.
- Si falta información oficial, indica que debes confirmarla con el equipo.

REGLAS MÉDICAS:
- No diagnostiques.
- No prometas curar o revertir la diabetes.
- No prometas eliminar medicamentos.
- No garantices resultados médicos.
- No sustituyas a un médico o profesional de la salud.

INFORMACIÓN OFICIAL:
- Negocio: VICA SYSTEMS.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Formato: digital en PDF.
- Precio: $79 MXN.
- Entrega: digital después de confirmar el pago.
- Métodos de pago: transferencia bancaria o pago en efectivo.
- Contenido: Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes.
- Bonos: Guía de Remedios Naturales y Hábitos Saludables y Recetario de Postres Saludables.

CONCEPTOS EMOCIONALES:
control, libertad, tranquilidad, bienestar, energía, seguridad,
familia, salud, confianza y esperanza.

OBJETIVO:
Resolver la duda y, cuando exista intención comercial clara,
dirigir suavemente a la compra del Mega Pack.
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

function contiene(textoNormalizado, frases) {
  const texto = ` ${textoNormalizado} `;
  return frases.some((frase) => {
    const objetivo = ` ${normalizarTexto(frase)} `;
    return texto.includes(objetivo);
  });
}

function cierreVenta() {
  return elegirAleatoria([
    "💙 El Mega Pack está disponible por $79 MXN. Puedes pagar por transferencia bancaria o en efectivo.",
    "🥗 El Mega Pack completo cuesta $79 MXN y se entrega digitalmente después de confirmar tu pago.",
    "😊 Si deseas adquirirlo, el precio es de $79 MXN. Puedes pagar por transferencia o en efectivo."
  ]);
}

function respuestaDirecta(textoNormalizado) {
  if (contiene(textoNormalizado, [
    "incluye postres", "trae postres", "recetas de postres",
    "recetario de postres", "postres saludables", "postres para diabeticos"
  ])) {
    return {
      intencion: "postres",
      respuesta: `Sí 😊 El Mega Pack incluye un Recetario de Postres Saludables como bono.\n\n${cierreVenta()}`
    };
  }

  if (
    contiene(textoNormalizado, [
      "cuanto cuesta", "cual es el precio", "precio del mega pack",
      "costo del mega pack", "cuanto vale", "79 pesos"
    ]) ||
    textoNormalizado === "precio" ||
    textoNormalizado === "costo"
  ) {
    return {
      intencion: "precio",
      respuesta: `El Mega Pack completo tiene un precio de $79 MXN. 😊\n\n${cierreVenta()}`
    };
  }

  if (contiene(textoNormalizado, [
    "como puedo pagar", "metodos de pago", "forma de pago",
    "transferencia bancaria", "pago en efectivo", "puedo pagar en efectivo",
    "quiero pagar", "datos para pagar"
  ])) {
    return {
      intencion: "metodos_pago",
      respuesta: `Puedes pagar mediante transferencia bancaria o en efectivo. 😊\n\n${cierreVenta()}`
    };
  }

  if (contiene(textoNormalizado, [
    "como recibo el producto", "como entregan el material", "donde descargo",
    "en que formato", "es digital", "es fisico", "recibir el pdf",
    "descargar el pdf", "enlace de descarga", "link de descarga"
  ])) {
    return {
      intencion: "entrega",
      respuesta: `El Mega Pack es digital en PDF. Después de confirmar tu pago recibirás el material para descargarlo. 😊\n\n${cierreVenta()}`
    };
  }

  if (contiene(textoNormalizado, [
    "cuando lo recibo", "cuando llega", "cuanto tarda",
    "tiempo de entrega", "entrega inmediata", "lo recibo hoy", "en cuanto tiempo"
  ])) {
    return {
      intencion: "tiempo_entrega",
      respuesta: `La entrega es digital y se realiza después de confirmar el pago. 💙\n\n${cierreVenta()}`
    };
  }

  if (contiene(textoNormalizado, [
    "que incluye el mega pack", "que contiene el mega pack", "que trae el paquete",
    "contenido del mega pack", "contenido del paquete", "cuales son los modulos",
    "que materiales incluye"
  ])) {
    return {
      intencion: "contenido",
      respuesta: `Incluye Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes, además de los dos bonos de la oferta. 😊\n\n${cierreVenta()}`
    };
  }

  if (contiene(textoNormalizado, [
    "que frutas puedo comer", "frutas para diabeticos", "puedo comer fruta",
    "puedo comer platano", "puedo comer mango", "puedo comer uvas",
    "puedo comer manzana", "que fruta recomiendan"
  ])) {
    return {
      intencion: "frutas",
      respuesta: "Las frutas pueden formar parte de una alimentación organizada, pero la cantidad y frecuencia dependen de las necesidades de cada persona y de la orientación profesional. 💙"
    };
  }

  if (contiene(textoNormalizado, [
    "puedo comer tortillas", "puedo comer tortilla", "puedo comer arroz",
    "puedo comer pan", "tengo que dejar la tortilla", "tengo que dejar el pan",
    "tengo que dejar el arroz", "que pasa con el pan", "que pasa con la tortilla"
  ])) {
    return {
      intencion: "carbohidratos",
      respuesta: "El objetivo no es prohibir alimentos de forma general. Las cantidades de tortilla, arroz o pan pueden variar según cada persona. 💙"
    };
  }

  if (contiene(textoNormalizado, [
    "tendre que dejar de comer", "todo esta prohibido", "que hago con los antojos",
    "puedo seguir comiendo lo que me gusta", "hay alimentos prohibidos"
  ])) {
    return {
      intencion: "restricciones",
      respuesta: "El objetivo no es hacerte sentir que todo está prohibido, sino ayudarte a conocer alternativas y organizar mejor tu alimentación. 😊"
    };
  }

  if (contiene(textoNormalizado, [
    "ingredientes caros", "recetas costosas", "recetas caras",
    "recetas complicadas", "recetas dificiles", "ingredientes faciles de conseguir",
    "necesito productos especiales", "se consigue en supermercado", "son recetas faciles"
  ])) {
    return {
      intencion: "ingredientes",
      respuesta: "Las recetas están pensadas para facilitar la alimentación diaria. El precio y disponibilidad de ingredientes pueden variar según tu localidad. 😊"
    };
  }

  if (contiene(textoNormalizado, [
    "es facil de entender", "necesito saber nutricion", "es complicado",
    "es dificil de entender", "sirve para principiantes", "lenguaje sencillo",
    "puedo entenderlo", "como se usa"
  ])) {
    return {
      intencion: "facilidad",
      respuesta: "El material está presentado con lenguaje sencillo y práctico. No necesitas conocimientos de nutrición para consultarlo. 😊"
    };
  }

  if (contiene(textoNormalizado, [
    "que voy a aprender", "que aprendere", "para que sirve el material",
    "que beneficios tiene", "que ensena"
  ])) {
    return {
      intencion: "aprendizaje",
      respuesta: "Aprenderás a organizar mejor tus comidas, consultar opciones de recetas y realizar compras más inteligentes. 😊"
    };
  }

  if (contiene(textoNormalizado, [
    "sirve para diabetes tipo 1", "sirve para diabetes tipo 2",
    "sirve para prediabetes", "es para diabeticos",
    "puedo usarlo si tengo diabetes", "para quien es",
    "funciona para cualquier diabetico"
  ])) {
    return {
      intencion: "publico_objetivo",
      respuesta: "Es una guía educativa para personas que desean mejorar y organizar su alimentación. No sustituye las indicaciones profesionales. 💙"
    };
  }

  if (contiene(textoNormalizado, [
    "por que deberia comprarlo", "por que comprar el mega pack",
    "vale la pena", "que diferencia tiene", "por que me conviene"
  ])) {
    return {
      intencion: "razon_compra",
      respuesta: `Porque reúne en un solo lugar herramientas para organizar comidas, consultar recetas y hacer compras más inteligentes. 😊\n\n${cierreVenta()}`
    };
  }

  if (contiene(textoNormalizado, [
    "tengo una duda", "necesito ayuda", "tengo un problema",
    "problema con el pago", "problema con la descarga", "no puedo descargar",
    "no recibi el material", "necesito soporte", "quiero hablar con un asesor"
  ])) {
    return {
      intencion: "soporte",
      respuesta: "Puedes escribirnos con confianza. Te ayudaremos con dudas relacionadas con pago, entrega o acceso al material. 😊"
    };
  }

  if (contiene(textoNormalizado, [
    "quiero controlar mi glucosa", "quiero controlar el azucar",
    "quiero sentirme mejor", "quiero mas energia", "quiero cuidar mi salud",
    "quiero cuidar a mi familia", "quiero cambiar mis habitos",
    "necesito mas confianza", "busco bienestar", "quiero mejorar mi vida"
  ])) {
    return {
      intencion: "emocional",
      respuesta: "Entiendo 💙 Buscar más claridad y tranquilidad al organizar tu alimentación es una preocupación muy común. La guía está pensada para acompañarte de forma práctica."
    };
  }

  return null;
}

function buscarTextoRecursivo(valor, profundidad = 0) {
  if (profundidad > 6 || valor == null) return "";

  if (typeof valor === "string") {
    const limpio = valor.trim();
    return limpio.length >= 2 ? limpio : "";
  }

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const encontrado = buscarTextoRecursivo(item, profundidad + 1);
      if (encontrado) return encontrado;
    }
    return "";
  }

  if (typeof valor === "object") {
    const clavesPrioritarias = [
      "texto", "mensaje", "message", "text", "input",
      "user_message", "last_text_input", "content", "query"
    ];

    for (const clave of clavesPrioritarias) {
      if (Object.prototype.hasOwnProperty.call(valor, clave)) {
        const encontrado = buscarTextoRecursivo(valor[clave], profundidad + 1);
        if (encontrado) return encontrado;
      }
    }

    for (const [clave, contenido] of Object.entries(valor)) {
      if (/text|message|mensaje|input|content|query/i.test(clave)) {
        const encontrado = buscarTextoRecursivo(contenido, profundidad + 1);
        if (encontrado) return encontrado;
      }
    }

    // Si ManyChat envuelve el mensaje dentro de objetos como
    // data, payload, contact, subscriber, fields, etc.,
    // recorremos únicamente objetos y arrays adicionales.
    // No tomamos strings de claves desconocidas para evitar
    // confundir IDs, nombres u otros datos con el mensaje.
    for (const contenido of Object.values(valor)) {
      if (
        contenido &&
        (typeof contenido === "object" || Array.isArray(contenido))
      ) {
        const encontrado = buscarTextoRecursivo(contenido, profundidad + 1);
        if (encontrado) return encontrado;
      }
    }
  }

  return "";
}

function parsearBody(rawBody, contentType) {
  const raw = String(rawBody || "").trim();
  if (!raw) return {};

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return { texto: raw };
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { texto: raw };
  }
}

async function llamarOpenAI(texto) {
  if (!OPENAI_API_KEY) {
    return "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
  }

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 6500);

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
        max_output_tokens: 180
      }),
      signal: controlador.signal
    });

    if (!response.ok) {
      const detalle = await response.text().catch(() => "");
      console.error("OpenAI HTTP", response.status, detalle.slice(0, 300));
      return "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
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

    return partes.join("\n").trim() ||
      "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
  } catch (error) {
    console.error("Error OpenAI:", error.name, error.message);
    return "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
  } finally {
    clearTimeout(timeout);
  }
}

function enviarJSON(res, texto, intencion = "desconocida") {
  const payload = JSON.stringify({
    respuesta: texto,
    response: texto,
    text: texto,
    ok: true,
    intencion
  });

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store"
  });

  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      });
      return res.end();
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return enviarJSON(res, "Bot ventas activo ✅", "health");
    }

    if (url.pathname === "/debug") {
      return enviarJSON(
        res,
        `Servidor activo. Método: ${req.method}. Ruta: ${url.pathname}`,
        "debug"
      );
    }

    if (url.pathname !== "/mensaje") {
      return enviarJSON(res, "Ruta no encontrada.", "ruta_no_encontrada");
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
          return enviarJSON(res, "El mensaje es demasiado grande.", "body_grande");
        }
        chunks.push(chunk);
      }

      const rawBody = Buffer.concat(chunks).toString("utf8");
      const contentType = String(req.headers["content-type"] || "").toLowerCase();
      const body = parsearBody(rawBody, contentType);

      texto = buscarTextoRecursivo(body);
    } else {
      return enviarJSON(res, "Método no permitido.", "metodo_no_permitido");
    }

    texto = String(texto || "").trim();

    console.log(
      new Date().toISOString(),
      "mensaje:",
      texto ? "[recibido]" : "[vacío]",
      "método:",
      req.method
    );

    if (!texto) {
      return enviarJSON(
        res,
        "No pude identificar tu mensaje. Por favor, escríbelo nuevamente. 😊",
        "mensaje_vacio"
      );
    }

    const normalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(normalizado);

    if (directa) {
      console.log("intencion:", directa.intencion);
      return enviarJSON(res, directa.respuesta, directa.intencion);
    }

    const respuestaIA = await llamarOpenAI(texto);
    return enviarJSON(res, respuestaIA, "consulta_abierta");
  } catch (error) {
    console.error("Error general:", error.name, error.message);
    return enviarJSON(
      res,
      "En este momento no pude procesar tu mensaje. Inténtalo nuevamente. 😊",
      "error_controlado"
    );
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor VICA SYSTEMS activo en puerto ${PORT}`);
});
