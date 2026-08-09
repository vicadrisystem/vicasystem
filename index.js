require("dotenv").config();

const express = require("express");
const OpenAIImport = require("openai");
const OpenAI = OpenAIImport.default || OpenAIImport;

const app = express();

app.use(express.json({ limit: "1mb", strict: false }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.text({ type: "text/*", limit: "1mb" }));

const PORT = process.env.PORT || 8080;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

let openai = null;

if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.error("Error inicializando OpenAI:", error.message);
  }
}

const SYSTEM_PROMPT = `
Eres Víctor Candelaria, asesor de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el producto digital
"Mega Pack Alimentación Sana para Diabéticos".

Tu trabajo es responder dudas de forma NATURAL, BREVE, HUMANA,
CERCANA y PROFESIONAL.

IMPORTANTE:
- Nunca suenes robótico.
- Nunca digas que eres una inteligencia artificial.
- Varía ligeramente las palabras y la estructura.
- Responde máximo en 1 o 2 párrafos cortos.
- Usa español sencillo.
- Usa emojis con moderación.
- Primero resuelve la duda.
- No presiones.
- No inventes información.
- Si no existe información oficial suficiente, indica que debes confirmarla con el equipo.

REGLAS MÉDICAS:
- No diagnostiques.
- No prometas curar o revertir la diabetes.
- No prometas eliminar medicamentos.
- No garantices resultados médicos.
- No sustituyas la valoración de un médico o profesional de la salud.
- El material es educativo y está enfocado en alimentación y hábitos saludables.

INFORMACIÓN OFICIAL:
- Negocio: VICA SYSTEMS.
- Agente: Víctor Candelaria.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Formato: digital en PDF.
- Precio: $79 MXN.
- Entrega: digital después de confirmar el pago.
- Métodos de pago: transferencia bancaria o pago en efectivo.

CONTENIDO:
- Plan Integral de Alimentación.
- Recetario Saludable.
- Guía de Compras Inteligentes.

BONOS:
- Guía de Remedios Naturales y Hábitos Saludables.
- Recetario de Postres Saludables.

CONCEPTOS EMOCIONALES:
Puedes utilizar con naturalidad ideas relacionadas con:
control, libertad, tranquilidad, bienestar, energía, seguridad,
familia, salud, confianza y esperanza.

Nunca conviertas estos conceptos en promesas médicas.

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

function limpiarRespuesta(texto) {
  let limpio = String(texto || "").trim();

  limpio = limpio
    .replace(/^¡?\s*hola\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^gracias por preguntar\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenos días\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenos dias\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenas tardes\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenas noches\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "");

  return limpio
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function contieneFrase(textoNormalizado, frase) {
  const texto = ` ${textoNormalizado} `;
  const objetivo = ` ${normalizarTexto(frase)} `;
  return texto.includes(objetivo);
}

function contieneAlguna(textoNormalizado, frases) {
  return frases.some((frase) => contieneFrase(textoNormalizado, frase));
}

function extraerTexto(req) {
  if (req.method === "GET") {
    return String(
      req.query.texto ||
      req.query.mensaje ||
      req.query.message ||
      req.query.text ||
      ""
    ).trim();
  }

  if (typeof req.body === "string") {
    return req.body.trim();
  }

  const body = req.body || {};

  const candidatos = [
    body.texto,
    body.mensaje,
    body.message,
    body.text,
    body.input,
    body.user_message,
    body.last_text_input,
    body.content,
    body?.data?.texto,
    body?.data?.mensaje,
    body?.data?.message,
    body?.data?.text,
    body?.contact?.last_input_text,
  ];

  const encontrado = candidatos.find(
    (valor) => typeof valor === "string" && valor.trim()
  );

  return encontrado ? encontrado.trim() : "";
}

function respuestaJSON(res, texto, meta = {}) {
  const respuesta = limpiarRespuesta(texto);

  return res.status(200).json({
    respuesta,
    response: respuesta,
    text: respuesta,
    ok: true,
    ...meta,
  });
}

function cierreVenta() {
  return elegirAleatoria([
    `💙 El Mega Pack está disponible por $79 MXN. Puedes pagar por transferencia bancaria o en efectivo.`,
    `🥗 El Mega Pack completo cuesta $79 MXN y se entrega en formato digital después de confirmar tu pago.`,
    `😊 Si deseas adquirirlo, el precio del Mega Pack es de $79 MXN. Puedes pagar por transferencia o en efectivo.`,
  ]);
}

function conCierre(texto, agregar = false) {
  const limpio = limpiarRespuesta(texto);

  if (!agregar) {
    return limpio;
  }

  return `${limpio}\n\n${cierreVenta()}`;
}

function respuestaDirecta(textoNormalizado) {
  // 1. POSTRES
  if (
    contieneAlguna(textoNormalizado, [
      "incluye postres",
      "trae postres",
      "recetas de postres",
      "recetario de postres",
      "postres saludables",
      "postres para diabeticos",
    ])
  ) {
    return {
      intencion: "postres",
      respuesta: conCierre(
        elegirAleatoria([
          `Sí 😊 El Mega Pack incluye un Recetario de Postres Saludables como bono.`,
          `Sí 💙 Dentro de los bonos recibirás un Recetario de Postres Saludables.`,
          `Sí 🍰 La oferta incluye un bono dedicado a postres saludables.`,
        ]),
        true
      ),
    };
  }

  // 2. PRECIO
  if (
    contieneAlguna(textoNormalizado, [
      "cuanto cuesta",
      "cual es el precio",
      "precio del mega pack",
      "costo del mega pack",
      "cuanto vale",
      "79 pesos",
    ]) ||
    textoNormalizado === "precio" ||
    textoNormalizado === "costo"
  ) {
    return {
      intencion: "precio",
      respuesta: conCierre(
        elegirAleatoria([
          `El Mega Pack completo tiene un precio de $79 MXN. 😊`,
          `Actualmente el precio del Mega Pack es de $79 MXN. 💙`,
          `El Mega Pack digital cuesta $79 MXN. 🥗`,
        ]),
        true
      ),
    };
  }

  // 3. MÉTODOS DE PAGO
  if (
    contieneAlguna(textoNormalizado, [
      "como puedo pagar",
      "metodos de pago",
      "forma de pago",
      "transferencia bancaria",
      "pago en efectivo",
      "puedo pagar en efectivo",
      "quiero pagar",
      "datos para pagar",
    ])
  ) {
    return {
      intencion: "metodos_pago",
      respuesta: conCierre(
        elegirAleatoria([
          `Puedes pagar mediante transferencia bancaria o en efectivo. 😊`,
          `Aceptamos transferencia bancaria y pago en efectivo. 💙`,
          `El pago puede realizarse por transferencia bancaria o en efectivo. 🥗`,
        ]),
        true
      ),
    };
  }

  // 4. ENTREGA / PDF
  if (
    contieneAlguna(textoNormalizado, [
      "como recibo el producto",
      "como entregan el material",
      "donde descargo",
      "en que formato",
      "es digital",
      "es fisico",
      "recibir el pdf",
      "descargar el pdf",
      "enlace de descarga",
      "link de descarga",
    ])
  ) {
    return {
      intencion: "entrega",
      respuesta: conCierre(
        elegirAleatoria([
          `El Mega Pack es digital en PDF. Después de confirmar tu pago recibirás el material para descargarlo. 😊`,
          `La entrega es digital. En cuanto se confirme el pago recibirás el Mega Pack en PDF. 💙`,
          `No se envía ningún producto físico. Todo el material se entrega digitalmente después de confirmar el pago. 🥗`,
        ]),
        true
      ),
    };
  }

  // 5. TIEMPO DE ENTREGA
  if (
    contieneAlguna(textoNormalizado, [
      "cuando lo recibo",
      "cuando llega",
      "cuanto tarda",
      "tiempo de entrega",
      "entrega inmediata",
      "lo recibo hoy",
      "en cuanto tiempo",
    ])
  ) {
    return {
      intencion: "tiempo_entrega",
      respuesta: conCierre(
        elegirAleatoria([
          `Después de confirmar tu pago recibirás el Mega Pack de forma digital. 😊`,
          `La entrega se realiza después de confirmar el pago. 💙`,
          `Al ser digital, el material se entrega una vez confirmado el pago. 🥗`,
        ]),
        true
      ),
    };
  }

  // 6. CONTENIDO
  if (
    contieneAlguna(textoNormalizado, [
      "que incluye el mega pack",
      "que contiene el mega pack",
      "que trae el paquete",
      "contenido del mega pack",
      "contenido del paquete",
      "cuales son los modulos",
      "que materiales incluye",
    ])
  ) {
    return {
      intencion: "contenido",
      respuesta: conCierre(
        elegirAleatoria([
          `Incluye Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes, además de los dos bonos de la oferta. 😊`,
          `Recibirás el Plan Integral de Alimentación, el Recetario Saludable y la Guía de Compras Inteligentes, más dos bonos. 💙`,
          `Es un paquete digital con alimentación, recetas, compras inteligentes y dos bonos complementarios. 🥗`,
        ]),
        true
      ),
    };
  }

  // 7. FRUTAS
  if (
    contieneAlguna(textoNormalizado, [
      "que frutas puedo comer",
      "frutas para diabeticos",
      "puedo comer fruta",
      "puedo comer platano",
      "puedo comer mango",
      "puedo comer uvas",
      "puedo comer manzana",
      "que fruta recomiendan",
    ])
  ) {
    return {
      intencion: "frutas",
      respuesta: conCierre(
        elegirAleatoria([
          `Las frutas pueden formar parte de una alimentación organizada, pero la cantidad y frecuencia dependen de las necesidades de cada persona y de la orientación profesional. 💙`,
          `El material ofrece orientación general para elegir mejor tus alimentos, incluyendo frutas. Las porciones deben ajustarse individualmente. 😊`,
          `No existe una misma porción adecuada para todas las personas. La guía es educativa y complementa la orientación profesional. 🥗`,
        ])
      ),
    };
  }

  // 8. TORTILLA / ARROZ / PAN
  if (
    contieneAlguna(textoNormalizado, [
      "puedo comer tortillas",
      "puedo comer tortilla",
      "puedo comer arroz",
      "puedo comer pan",
      "tengo que dejar la tortilla",
      "tengo que dejar el pan",
      "tengo que dejar el arroz",
      "que pasa con el pan",
      "que pasa con la tortilla",
    ])
  ) {
    return {
      intencion: "carbohidratos_comunes",
      respuesta: conCierre(
        elegirAleatoria([
          `El objetivo no es prohibir alimentos de forma general. Las cantidades de tortilla, arroz o pan pueden variar según cada persona. 💙`,
          `La guía puede orientarte a organizar mejor tus alimentos, pero las porciones deben adaptarse a tus necesidades. 😊`,
          `No todas las personas necesitan las mismas cantidades. El material no reemplaza un plan nutricional personalizado. 🥗`,
        ])
      ),
    };
  }

  // 9. RESTRICCIONES / ANTOJOS
  if (
    contieneAlguna(textoNormalizado, [
      "tendre que dejar de comer",
      "todo esta prohibido",
      "que hago con los antojos",
      "puedo seguir comiendo lo que me gusta",
      "hay alimentos prohibidos",
    ])
  ) {
    return {
      intencion: "restricciones",
      respuesta: conCierre(
        elegirAleatoria([
          `El objetivo no es hacerte sentir que todo está prohibido, sino ayudarte a conocer alternativas y organizar mejor tu alimentación. 😊`,
          `La guía busca ayudarte a tomar decisiones más informadas y encontrar opciones prácticas. 💙`,
          `El enfoque es ofrecer alternativas y organización, no imponer restricciones extremas. 🥗`,
        ])
      ),
    };
  }

  // 10. INGREDIENTES / RECETAS
  if (
    contieneAlguna(textoNormalizado, [
      "ingredientes caros",
      "recetas costosas",
      "recetas caras",
      "recetas complicadas",
      "recetas dificiles",
      "ingredientes faciles de conseguir",
      "necesito productos especiales",
      "se consigue en supermercado",
      "son recetas faciles",
    ])
  ) {
    return {
      intencion: "ingredientes_recetas",
      respuesta: conCierre(
        elegirAleatoria([
          `Las recetas están pensadas para facilitar la alimentación diaria. El precio y disponibilidad de ingredientes pueden variar según tu localidad. 😊`,
          `El objetivo es utilizar opciones prácticas y alimentos que puedan encontrarse en comercios habituales. 💙`,
          `La guía busca evitar complicaciones innecesarias al preparar tus comidas. 🥗`,
        ])
      ),
    };
  }

  // 11. FACILIDAD
  if (
    contieneAlguna(textoNormalizado, [
      "es facil de entender",
      "necesito saber nutricion",
      "es complicado",
      "es dificil de entender",
      "sirve para principiantes",
      "lenguaje sencillo",
      "puedo entenderlo",
      "como se usa",
    ])
  ) {
    return {
      intencion: "facilidad",
      respuesta: conCierre(
        elegirAleatoria([
          `El material está presentado con lenguaje sencillo y práctico. No necesitas conocimientos de nutrición para consultarlo. 😊`,
          `No necesitas ser especialista. El Mega Pack está organizado para utilizarse de manera sencilla. 💙`,
          `La información se presenta de forma clara y accesible para facilitar su consulta. 🥗`,
        ])
      ),
    };
  }

  // 12. APRENDIZAJE
  if (
    contieneAlguna(textoNormalizado, [
      "que voy a aprender",
      "que aprendere",
      "para que sirve el material",
      "que beneficios tiene",
      "que ensena",
    ])
  ) {
    return {
      intencion: "aprendizaje",
      respuesta: conCierre(
        elegirAleatoria([
          `Aprenderás a organizar mejor tus comidas, consultar opciones de recetas y realizar compras más inteligentes. 😊`,
          `El material busca ayudarte a planificar tu alimentación con ideas prácticas para el día a día. 💙`,
          `Encontrarás herramientas para organizar comidas, recetas y compras de forma sencilla. 🥗`,
        ])
      ),
    };
  }

  // 13. PARA QUIÉN ES
  if (
    contieneAlguna(textoNormalizado, [
      "sirve para diabetes tipo 1",
      "sirve para diabetes tipo 2",
      "sirve para prediabetes",
      "es para diabeticos",
      "puedo usarlo si tengo diabetes",
      "para quien es",
      "funciona para cualquier diabetico",
    ])
  ) {
    return {
      intencion: "publico_objetivo",
      respuesta: conCierre(
        elegirAleatoria([
          `Es una guía educativa para personas que desean mejorar y organizar su alimentación. No sustituye las indicaciones profesionales. 💙`,
          `Es material educativo sobre alimentación saludable. Cada persona puede tener necesidades diferentes. 😊`,
          `Puede utilizarse como apoyo educativo, pero no reemplaza un plan médico o nutricional personalizado. 🥗`,
        ])
      ),
    };
  }

  // 14. RAZÓN DE COMPRA
  if (
    contieneAlguna(textoNormalizado, [
      "por que deberia comprarlo",
      "por que comprar el mega pack",
      "vale la pena",
      "que diferencia tiene",
      "por que me conviene",
    ])
  ) {
    return {
      intencion: "razon_compra",
      respuesta: conCierre(
        elegirAleatoria([
          `Porque reúne en un solo lugar herramientas para organizar comidas, consultar recetas y hacer compras más inteligentes. 😊`,
          `El Mega Pack concentra recursos prácticos para facilitar la planificación de tu alimentación diaria. 💙`,
          `Su ventaja es integrar alimentación, recetas y compras en un mismo paquete digital. 🥗`,
        ]),
        true
      ),
    };
  }

  // 15. SOPORTE
  if (
    contieneAlguna(textoNormalizado, [
      "tengo una duda",
      "necesito ayuda",
      "tengo un problema",
      "problema con el pago",
      "problema con la descarga",
      "no puedo descargar",
      "no recibi el material",
      "necesito soporte",
      "quiero hablar con un asesor",
    ])
  ) {
    return {
      intencion: "soporte",
      respuesta: conCierre(
        elegirAleatoria([
          `Puedes escribirnos con confianza. Te ayudaremos con dudas relacionadas con pago, entrega o acceso al material. 😊`,
          `Con gusto revisaremos cualquier inconveniente con tu compra o descarga. 💙`,
          `Si tienes un problema con el pago o acceso, podemos revisarlo para darte una respuesta correcta. 🥗`,
        ])
      ),
    };
  }

  // 16. EMOCIONAL — SIEMPRE AL FINAL
  if (
    contieneAlguna(textoNormalizado, [
      "quiero controlar mi glucosa",
      "quiero controlar el azucar",
      "quiero sentirme mejor",
      "quiero mas energia",
      "quiero cuidar mi salud",
      "quiero cuidar a mi familia",
      "quiero cambiar mis habitos",
      "necesito mas confianza",
      "busco bienestar",
      "quiero mejorar mi vida",
    ])
  ) {
    return {
      intencion: "emocional",
      respuesta: conCierre(
        elegirAleatoria([
          `Entiendo 💙 Buscar más claridad y tranquilidad al organizar tu alimentación es una preocupación muy común. La guía está pensada para acompañarte de forma práctica.`,
          `Cuidar la alimentación puede ayudarte a sentir más organización y confianza en tus decisiones diarias. 🥗`,
          `Es comprensible querer sentir más control al organizar tus comidas. 💙 El material busca darte una guía práctica y educativa.`,
        ])
      ),
    };
  }

  return null;
}

function tieneIntencionComercial(textoNormalizado) {
  return contieneAlguna(textoNormalizado, [
    "quiero comprar",
    "quiero adquirir",
    "quiero el mega pack",
    "me interesa comprar",
    "como hago mi pedido",
    "como lo compro",
    "donde pago",
    "quiero pagar",
    "cuanto cuesta",
    "transferencia bancaria",
    "pago en efectivo",
  ]) || textoNormalizado === "precio";
}

async function generarConOpenAI(texto) {
  if (!openai) {
    return "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
  }

  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: SYSTEM_PROMPT,
    input: texto,
    max_output_tokens: 220,
  });

  return limpiarRespuesta(response.output_text || "");
}

app.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    servicio: "VICA SYSTEMS",
    mensaje: "Bot ventas activo ✅",
  });
});

async function manejarMensaje(req, res) {
  try {
    const texto = extraerTexto(req);

    console.log(
      "Mensaje recibido:",
      texto ? "[contenido recibido]" : "[vacío]",
      "| método:",
      req.method
    );

    if (!texto) {
      return respuestaJSON(
        res,
        "No pude identificar tu mensaje. Por favor, escríbelo nuevamente. 😊",
        { intencion: "mensaje_vacio" }
      );
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Intención detectada:", directa.intencion);

      return respuestaJSON(
        res,
        directa.respuesta,
        { intencion: directa.intencion }
      );
    }

    console.log("Intención detectada: consulta_abierta");

    const respuestaIA = await generarConOpenAI(texto);

    const respuestaFinal = conCierre(
      respuestaIA,
      tieneIntencionComercial(textoNormalizado)
    );

    return respuestaJSON(
      res,
      respuestaFinal,
      { intencion: "consulta_abierta" }
    );
  } catch (error) {
    console.error("Error en /mensaje:", error.message);

    return respuestaJSON(
      res,
      "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos. 😊",
      { intencion: "error_controlado" }
    );
  }
}

app.get("/mensaje", manejarMensaje);
app.post("/mensaje", manejarMensaje);

app.use((error, req, res, next) => {
  console.error("Error de Express:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  return respuestaJSON(
    res,
    "No pude leer correctamente el mensaje. Por favor, envíalo nuevamente. 😊",
    { intencion: "error_formato" }
  );
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor VICA SYSTEMS activo en puerto ${PORT}`);
});
