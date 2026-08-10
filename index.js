const http = require("http");

const PORT = Number(process.env.PORT || 8080);
const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();

const SYSTEM_PROMPT = `
Eres Víctor Candelaria, asesor de VICA SYSTEMS.

Atiendes por WhatsApp dudas sobre el producto digital
"Mega Pack Alimentación Sana para Diabéticos".

RESPONDE:
- De forma natural, breve, clara y humana.
- Máximo 1 o 2 párrafos cortos.
- Sin sonar robótico.
- Sin inventar datos.
- Sin presionar.
- Si no existe información oficial suficiente, indica que necesitas confirmarlo con el equipo.

INFORMACIÓN OFICIAL:
- Negocio: VICA SYSTEMS.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Precio: $79 MXN.
- Formato: digital en PDF.
- Entrega: después de confirmar el pago.
- Métodos de pago: transferencia bancaria o pago en efectivo.
- Incluye: Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes.
- Bonos: Guía de Remedios Naturales y Hábitos Saludables y Recetario de Postres Saludables.

REGLAS MÉDICAS:
- No diagnostiques.
- No prometas curar ni revertir la diabetes.
- No prometas eliminar medicamentos.
- No garantices resultados médicos.
- No sustituyas la atención profesional.

Puedes usar de forma natural conceptos como:
control, libertad, tranquilidad, bienestar, energía, seguridad,
familia, salud, confianza y esperanza.
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

function incluyeAlguna(textoNormalizado, frases) {
  const texto = ` ${textoNormalizado} `;
  return frases.some((frase) => {
    const objetivo = ` ${normalizarTexto(frase)} `;
    return texto.includes(objetivo);
  });
}

function cierrePago() {
  return elegirAleatoria([
    `💙 El Mega Pack está disponible por $79 MXN. Puedes pagar por transferencia bancaria o en efectivo.`,
    `🥗 El Mega Pack completo cuesta $79 MXN y se entrega digitalmente después de confirmar tu pago.`,
    `😊 El precio del Mega Pack es de $79 MXN. Puedes realizar el pago por transferencia o en efectivo.`
  ]);
}

function respuestaDirecta(textoNormalizado) {
  if (
    textoNormalizado === "precio" ||
    textoNormalizado === "costo" ||
    incluyeAlguna(textoNormalizado, [
      "cuanto cuesta",
      "cual es el precio",
      "precio del mega pack",
      "costo del mega pack",
      "cuanto vale",
      "79 pesos"
    ])
  ) {
    return `El Mega Pack completo tiene un precio de $79 MXN. 😊

${cierrePago()}`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "como puedo pagar",
    "metodos de pago",
    "forma de pago",
    "transferencia bancaria",
    "pago en efectivo",
    "quiero pagar",
    "datos para pagar"
  ])) {
    return `Puedes pagar mediante transferencia bancaria o en efectivo. 😊

${cierrePago()}`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "que incluye el mega pack",
    "que contiene el mega pack",
    "que trae el paquete",
    "contenido del mega pack",
    "cuales son los modulos",
    "que materiales incluye"
  ])) {
    return `Incluye Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes. También incluye dos bonos: Guía de Remedios Naturales y Hábitos Saludables y Recetario de Postres Saludables. 💙

${cierrePago()}`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "incluye postres",
    "trae postres",
    "recetas de postres",
    "recetario de postres",
    "postres saludables"
  ])) {
    return `Sí 😊 El Mega Pack incluye un Recetario de Postres Saludables como bono.

${cierrePago()}`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "como recibo el producto",
    "como entregan el material",
    "en que formato",
    "es digital",
    "es fisico",
    "recibir el pdf",
    "descargar el pdf",
    "link de descarga"
  ])) {
    return `El Mega Pack es digital en PDF. Después de confirmar tu pago recibirás el material para descargarlo. 😊

${cierrePago()}`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "cuando lo recibo",
    "cuando llega",
    "cuanto tarda",
    "tiempo de entrega",
    "entrega inmediata",
    "en cuanto tiempo"
  ])) {
    return `La entrega es digital y se realiza después de confirmar el pago. 💙

${cierrePago()}`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "que frutas puedo comer",
    "frutas para diabeticos",
    "puedo comer fruta",
    "puedo comer platano",
    "puedo comer mango",
    "puedo comer uvas",
    "puedo comer manzana"
  ])) {
    return `Las frutas pueden formar parte de una alimentación organizada, pero las porciones pueden variar según cada persona y la orientación de su profesional de salud. 💙`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "puedo comer tortillas",
    "puedo comer tortilla",
    "puedo comer arroz",
    "puedo comer pan",
    "tengo que dejar la tortilla",
    "tengo que dejar el pan",
    "tengo que dejar el arroz"
  ])) {
    return `El objetivo no es prohibir alimentos de forma general. Las cantidades de tortilla, arroz o pan pueden variar según cada persona. 💙`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "tendre que dejar de comer",
    "todo esta prohibido",
    "que hago con los antojos",
    "puedo seguir comiendo lo que me gusta",
    "hay alimentos prohibidos"
  ])) {
    return `El objetivo no es hacerte sentir que todo está prohibido, sino ayudarte a encontrar alternativas y organizar mejor tu alimentación. 😊`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "ingredientes caros",
    "recetas costosas",
    "recetas caras",
    "recetas complicadas",
    "recetas dificiles",
    "ingredientes faciles de conseguir",
    "son recetas faciles"
  ])) {
    return `Las recetas están pensadas para facilitar la alimentación diaria. La disponibilidad y el precio de los ingredientes pueden variar según tu localidad. 😊`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "es facil de entender",
    "necesito saber nutricion",
    "es complicado",
    "es dificil de entender",
    "sirve para principiantes",
    "puedo entenderlo",
    "como se usa"
  ])) {
    return `El material está presentado con lenguaje sencillo y práctico. No necesitas conocimientos de nutrición para consultarlo. 😊`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "que voy a aprender",
    "que aprendere",
    "para que sirve el material",
    "que beneficios tiene",
    "que ensena"
  ])) {
    return `Aprenderás a organizar mejor tus comidas, consultar opciones de recetas y realizar compras más inteligentes. 😊`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "sirve para diabetes tipo 1",
    "sirve para diabetes tipo 2",
    "sirve para prediabetes",
    "es para diabeticos",
    "puedo usarlo si tengo diabetes",
    "para quien es"
  ])) {
    return `Es una guía educativa para personas que desean mejorar y organizar su alimentación. No sustituye las indicaciones de un médico o profesional de salud. 💙`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "por que deberia comprarlo",
    "por que comprar el mega pack",
    "vale la pena",
    "que diferencia tiene",
    "por que me conviene"
  ])) {
    return `Porque reúne en un solo lugar herramientas para organizar comidas, consultar recetas y hacer compras más inteligentes. 😊

${cierrePago()}`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "tengo una duda",
    "necesito ayuda",
    "tengo un problema",
    "problema con el pago",
    "problema con la descarga",
    "no puedo descargar",
    "no recibi el material",
    "necesito soporte"
  ])) {
    return `Puedes escribirnos con confianza. Te ayudaremos con dudas relacionadas con pago, entrega o acceso al material. 😊`;
  }

  if (incluyeAlguna(textoNormalizado, [
    "quiero controlar mi glucosa",
    "quiero controlar el azucar",
    "quiero sentirme mejor",
    "quiero mas energia",
    "quiero cuidar mi salud",
    "quiero cuidar a mi familia",
    "quiero cambiar mis habitos",
    "necesito mas confianza",
    "busco bienestar",
    "quiero mejorar mi vida"
  ])) {
    return `Entiendo 💙 Buscar más claridad y tranquilidad al organizar tu alimentación es una preocupación muy común. La guía está pensada para acompañarte de forma práctica.`;
  }

  return null;
}

function buscarTexto(obj, profundidad = 0) {
  if (profundidad > 8 || obj == null) return "";

  if (typeof obj === "string") {
    return obj.trim();
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const encontrado = buscarTexto(item, profundidad + 1);
      if (encontrado) return encontrado;
    }
    return "";
  }

  if (typeof obj === "object") {
    const prioritarias = [
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

    for (const clave of prioritarias) {
      if (Object.prototype.hasOwnProperty.call(obj, clave)) {
        const encontrado = buscarTexto(obj[clave], profundidad + 1);
        if (encontrado) return encontrado;
      }
    }

    for (const [clave, valor] of Object.entries(obj)) {
      if (/text|message|mensaje|input|content/i.test(clave)) {
        const encontrado = buscarTexto(valor, profundidad + 1);
        if (encontrado) return encontrado;
      }
    }

    for (const valor of Object.values(obj)) {
      if (valor && typeof valor === "object") {
        const encontrado = buscarTexto(valor, profundidad + 1);
        if (encontrado) return encontrado;
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

async function responderOpenAI(texto) {
  if (!OPENAI_API_KEY) {
    return "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
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
      signal: controller.signal
    });

    if (!r.ok) {
      console.error("OpenAI status:", r.status);
      return "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
    }

    const data = await r.json();

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
    console.error("OpenAI error:", error.name, error.message);
    return "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
  } finally {
    clearTimeout(timer);
  }
}

function enviarJSON(res, respuesta) {
  const body = JSON.stringify({ respuesta: String(respuesta || "") });

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(body);
}

let ultimoDiagnostico = {
  fecha: null,
  metodo: null,
  contentType: null,
  bodyRecibido: false,
  textoDetectado: false,
  longitudTexto: 0
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Bot ventas activo ✅");
    }

    if (url.pathname === "/diagnostico") {
      return enviarJSON(
        res,
        JSON.stringify({
          servidor: "activo",
          puerto: PORT,
          openaiConfigurado: Boolean(OPENAI_API_KEY),
          ultimoRequest: ultimoDiagnostico
        })
      );
    }

    if (url.pathname !== "/mensaje") {
      return enviarJSON(res, "Ruta no encontrada.");
    }

    let texto = "";

    if (req.method === "GET") {
      texto =
        url.searchParams.get("texto") ||
        url.searchParams.get("mensaje") ||
        url.searchParams.get("message") ||
        url.searchParams.get("text") ||
        "";

      ultimoDiagnostico = {
        fecha: new Date().toISOString(),
        metodo: "GET",
        contentType: "",
        bodyRecibido: false,
        textoDetectado: Boolean(texto),
        longitudTexto: String(texto || "").length
      };
    } else if (req.method === "POST") {
      const chunks = [];

      for await (const chunk of req) {
        chunks.push(chunk);
      }

      const raw = Buffer.concat(chunks).toString("utf8");
      const contentType = String(req.headers["content-type"] || "").toLowerCase();
      const body = parsearBody(raw, contentType);
      texto = buscarTexto(body);

      ultimoDiagnostico = {
        fecha: new Date().toISOString(),
        metodo: "POST",
        contentType,
        bodyRecibido: raw.length > 0,
        textoDetectado: Boolean(texto),
        longitudTexto: String(texto || "").length
      };
    } else {
      return enviarJSON(res, "Método no permitido.");
    }

    texto = String(texto || "").trim();

    if (!texto) {
      return enviarJSON(
        res,
        "No pude identificar el mensaje recibido. Revisa el campo enviado desde ManyChat."
      );
    }

    const normalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(normalizado);

    if (directa) {
      return enviarJSON(res, directa);
    }

    const respuestaIA = await responderOpenAI(texto);
    return enviarJSON(res, respuestaIA);

  } catch (error) {
    console.error("Error general:", error.name, error.message);
    return enviarJSON(
      res,
      "En este momento no pude procesar el mensaje. Inténtalo nuevamente. 😊"
    );
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`VICA SYSTEMS activo en puerto ${PORT}`);
});
