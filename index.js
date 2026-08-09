require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.text({ type: "text/*", limit: "1mb" }));

const PORT = process.env.PORT || 8080;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `
Eres Víctor Candelaria, asesor de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el producto digital "Mega Pack Alimentación Sana para Diabéticos".

Tu trabajo es responder dudas de forma NATURAL, BREVE, HUMANA, CERCANA y PROFESIONAL.

IMPORTANTE:
- Nunca suenes robótico.
- Nunca digas que eres una inteligencia artificial.
- Varía ligeramente las palabras y la estructura.
- Responde máximo en 1 o 2 párrafos cortos.
- Usa español sencillo y claro.
- Usa emojis con moderación.
- Resuelve primero la duda.
- No presiones para vender.
- No inventes información.
- Si falta un dato oficial, indica que debes confirmarlo con el equipo de VICA SYSTEMS.

REGLAS:
- NO hagas diagnósticos.
- NO prometas curar o revertir la diabetes.
- NO prometas eliminar medicamentos.
- NO garantices resultados médicos.
- NO sustituyas la valoración de un médico o profesional de la salud.
- NO atribuyas propiedades médicas a un alimento o remedio si no aparecen en la información oficial.
- El material es educativo y está enfocado en alimentación y hábitos saludables.
- NO digas que el producto es físico.
- NO inventes garantías, precios, promociones, métodos de pago o beneficios.

INFORMACIÓN REAL:
- Negocio: VICA SYSTEMS.
- Agente: Víctor Candelaria.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Tipo: producto digital en PDF.
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

CONCEPTOS EMOCIONALES DEL AVATAR:
Utiliza de forma natural, solo cuando encajen con la conversación, ideas relacionadas con control, libertad, tranquilidad, bienestar, energía, seguridad, familia, salud, confianza y esperanza.
Nunca conviertas estos conceptos en promesas médicas.

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

function extraerTexto(body) {
  if (typeof body === "string") return body.trim();
  if (!body || typeof body !== "object") return "";

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
  ];

  const valor = candidatos.find(
    (item) => typeof item === "string" && item.trim().length > 0
  );

  return valor ? valor.trim() : "";
}

function fraseExacta(texto, frases) {
  const limpio = ` ${normalizarTexto(texto)} `;
  return frases.some((frase) => {
    const objetivo = ` ${normalizarTexto(frase)} `;
    return objetivo.trim() && limpio.includes(objetivo);
  });
}

function cierreVenta() {
  return elegirAleatoria([
    `💙 El Mega Pack está disponible por $79 MXN. Puedes pagar por transferencia bancaria o en efectivo.`,
    `🥗 El Mega Pack completo cuesta $79 MXN y se entrega en formato digital después de confirmar tu pago.`,
    `😊 Si deseas adquirirlo, el Mega Pack está disponible por $79 MXN mediante transferencia bancaria o pago en efectivo.`,
  ]);
}

function respuesta(intencion, opciones, conCierre = false) {
  const base = limpiarRespuesta(elegirAleatoria(opciones));
  return {
    intencion,
    respuesta: conCierre ? `${base}\n\n${cierreVenta()}` : base,
  };
}

function respuestaDirecta(textoNormalizado) {
  // 1. Precio
  if (fraseExacta(textoNormalizado, [
    "cuanto cuesta", "cual es el precio", "precio del mega pack",
    "costo del mega pack", "cuanto vale", "precio", "costo", "79 pesos"
  ])) {
    return respuesta("precio", [
      `El Mega Pack completo tiene un precio de $79 MXN. 😊`,
      `Actualmente el Mega Pack cuesta $79 MXN. 💙`,
      `El precio del Mega Pack digital es de $79 MXN. 🥗`,
    ], true);
  }

  // 2. Métodos de pago
  if (fraseExacta(textoNormalizado, [
    "como puedo pagar", "metodos de pago", "forma de pago", "transferencia bancaria",
    "pago en efectivo", "puedo pagar en efectivo", "quiero pagar", "datos para pagar"
  ])) {
    return respuesta("metodos_pago", [
      `Puedes pagar mediante transferencia bancaria o en efectivo. 😊`,
      `Aceptamos transferencia bancaria y pago en efectivo. 💙`,
      `El pago puede realizarse por transferencia bancaria o en efectivo. 🥗`,
    ], true);
  }

  // 3. Postres
  if (fraseExacta(textoNormalizado, [
    "incluye postres", "trae postres", "hay recetas de postres", "recetario de postres",
    "postres saludables", "postres para diabeticos", "recetas de postres"
  ])) {
    return respuesta("postres", [
      `Sí 😊 La oferta incluye un Recetario de Postres Saludables como bono.`,
      `Sí 💙 Dentro de los bonos recibirás un Recetario de Postres Saludables.`,
      `Sí 🍰 El Mega Pack incluye un bono dedicado a postres saludables.`,
    ], true);
  }

  // 4. Entrega / formato
  if (fraseExacta(textoNormalizado, [
    "como recibo el producto", "como entregan el material", "donde descargo", "en que formato",
    "es digital", "es fisico", "recibir el pdf", "descargar el pdf", "enlace de descarga", "link de descarga"
  ])) {
    return respuesta("entrega", [
      `El Mega Pack es digital en PDF. Después de confirmar tu pago recibirás el material para descargarlo. 😊`,
      `La entrega es digital. En cuanto se confirme el pago recibirás el acceso al Mega Pack en PDF. 💙`,
      `No se envía ningún producto físico. Todo el material se entrega en PDF después de confirmar el pago. 🥗`,
    ], true);
  }

  // 5. Tiempo de entrega
  if (fraseExacta(textoNormalizado, [
    "cuando lo recibo", "cuando llega", "cuanto tarda", "tiempo de entrega",
    "entrega inmediata", "lo recibo hoy", "demora la entrega", "en cuanto tiempo"
  ])) {
    return respuesta("tiempo_entrega", [
      `Después de confirmar tu pago recibirás el acceso digital al material. 😊`,
      `La entrega se realiza después de validar el pago y el material se envía en formato digital. 💙`,
      `No necesitas esperar un envío físico; el acceso se entrega digitalmente después de confirmar el pago. 🥗`,
    ], true);
  }

  // 6. Contenido
  if (fraseExacta(textoNormalizado, [
    "que incluye el mega pack", "que contiene el mega pack", "que trae el paquete",
    "contenido del paquete", "contenido del mega pack", "cuales son los modulos", "que materiales incluye"
  ])) {
    return respuesta("contenido", [
      `Incluye el Plan Integral de Alimentación, el Recetario Saludable y la Guía de Compras Inteligentes. Además, incluye dos bonos: Guía de Remedios Naturales y Hábitos Saludables y Recetario de Postres Saludables. 😊`,
      `Recibirás tres recursos principales y dos bonos complementarios relacionados con hábitos y postres saludables. 💙`,
    ], true);
  }

  // 7. Frutas
  if (fraseExacta(textoNormalizado, [
    "que frutas puedo comer", "frutas para diabeticos", "puedo comer fruta", "puedo comer platano",
    "puedo comer mango", "puedo comer uvas", "puedo comer manzana", "que fruta recomiendan"
  ])) {
    return respuesta("frutas", [
      `El material incluye orientación general para ayudarte a organizar mejor tus elecciones de alimentos. Las porciones y opciones de fruta pueden variar según cada persona, por lo que conviene seguir también las indicaciones de tu profesional de salud. 💙`,
      `Las frutas pueden formar parte de una alimentación organizada, pero las cantidades deben adaptarse a las necesidades individuales y a la orientación profesional. 😊`,
    ]);
  }

  // 8. Tortilla, arroz, pan
  if (fraseExacta(textoNormalizado, [
    "puedo comer tortillas", "puedo comer tortilla", "puedo comer arroz", "puedo comer pan",
    "tengo que dejar la tortilla", "tengo que dejar el pan", "tengo que dejar el arroz"
  ])) {
    return respuesta("carbohidratos", [
      `El objetivo del material no es prohibir alimentos de forma general, sino ayudarte a organizar mejor tus elecciones. Las cantidades de tortilla, arroz o pan pueden variar según cada persona. 💙`,
      `No todas las personas necesitan las mismas porciones. La guía es educativa y debe complementarse con las indicaciones de tu profesional de salud. 😊`,
    ]);
  }

  // 9. Facilidad
  if (fraseExacta(textoNormalizado, [
    "es facil de entender", "necesito saber nutricion", "es complicado", "es dificil",
    "sirve para principiantes", "lenguaje sencillo", "puedo entenderlo", "como se usa"
  ])) {
    return respuesta("facilidad", [
      `Sí 😊 El Mega Pack está presentado con lenguaje sencillo y práctico para que puedas consultarlo sin conocimientos especializados de nutrición.`,
      `No necesitas ser especialista. El material está organizado para que sea fácil de consultar y aplicar en el día a día. 💙`,
    ]);
  }

  // 10. Ingredientes
  if (fraseExacta(textoNormalizado, [
    "los ingredientes son caros", "ingredientes caros", "recetas costosas", "recetas caras",
    "recetas complicadas", "recetas dificiles", "ingredientes faciles de conseguir",
    "necesito productos especiales", "se consigue en supermercado", "son recetas faciles"
  ])) {
    return respuesta("ingredientes", [
      `El objetivo es ofrecer opciones prácticas con ingredientes que puedan encontrarse en supermercados y comercios habituales. 😊`,
      `Las recetas buscan facilitar la alimentación diaria sin depender necesariamente de ingredientes difíciles de conseguir. 💙`,
    ]);
  }

  // 11. Soporte
  if (fraseExacta(textoNormalizado, [
    "tengo una duda", "necesito ayuda", "tengo un problema", "problema con el pago",
    "problema con la descarga", "no puedo descargar", "no recibi el material", "necesito soporte"
  ])) {
    return respuesta("soporte", [
      `Puedes escribirnos con confianza. El equipo de VICA SYSTEMS te ayudará con dudas relacionadas con el pago, la entrega o el acceso al material. 😊`,
      `Con gusto te ayudaremos a revisar cualquier inconveniente con tu compra o con la descarga del Mega Pack. 💙`,
    ]);
  }

  // 12. Para quién es
  if (fraseExacta(textoNormalizado, [
    "sirve para diabetes tipo 1", "sirve para diabetes tipo 2", "sirve para prediabetes",
    "es para diabeticos", "puedo usarlo si tengo diabetes", "para quien es", "funciona para cualquier diabetico"
  ])) {
    return respuesta("publico", [
      `El Mega Pack es una guía educativa para personas que desean mejorar y organizar su alimentación. No sustituye el tratamiento ni las indicaciones de un profesional de salud. 💙`,
      `El material ofrece información práctica sobre alimentación saludable. Cada persona tiene necesidades distintas, por eso debe mantenerse el seguimiento profesional. 😊`,
    ]);
  }

  // 13. Qué aprenderá / beneficios
  if (fraseExacta(textoNormalizado, [
    "que voy a aprender", "que aprendere", "para que sirve el material", "que beneficios tiene", "que ensena"
  ])) {
    return respuesta("aprendizaje", [
      `Aprenderás a organizar mejor tus comidas, conocer opciones de recetas y hacer compras más inteligentes. 😊`,
      `El material busca facilitar la planificación de tu alimentación con guías y recetas prácticas. 💙`,
    ], true);
  }

  // 14. Razón de compra
  if (fraseExacta(textoNormalizado, [
    "por que deberia comprarlo", "por que comprar el mega pack", "vale la pena",
    "que diferencia tiene", "por que me conviene"
  ])) {
    return respuesta("razon_compra", [
      `Porque reúne en un solo lugar herramientas para organizar comidas, preparar recetas y hacer compras más inteligentes, sin tener que buscar información dispersa. 😊`,
      `Su principal ventaja es integrar alimentación, recetas y compras en una misma guía digital fácil de consultar. 💙`,
    ], true);
  }

  // 15. Emocional: al final para no chocar con FAQ específicas
  if (fraseExacta(textoNormalizado, [
    "glucosa", "azucar", "control", "energia", "bienestar",
    "familia", "esperanza", "confianza", "vida", "cambio"
  ])) {
    return respuesta("bienestar_emocional", [
      `Entiendo 💙 Muchas personas buscan más claridad y tranquilidad al organizar su alimentación. El Mega Pack está pensado como una guía práctica para apoyar mejores decisiones en el día a día, sin sustituir la orientación médica.`,
      `Cuidar la alimentación puede ayudar a sentir más orden y confianza al decidir qué comprar y preparar. 🥗 El material reúne herramientas prácticas para organizar mejor tus hábitos.`,
    ]);
  }

  return null;
}

function tieneIntencionComercial(textoNormalizado) {
  return fraseExacta(textoNormalizado, [
    "quiero comprar", "quiero adquirir", "quiero el mega pack", "me interesa comprar",
    "como lo compro", "donde pago", "quiero pagar", "datos bancarios"
  ]);
}

app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    servicio: "VICA SYSTEMS",
    mensaje: "Bot ventas activo ✅",
  });
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto = extraerTexto(req.body);
    console.log("Mensaje recibido:", texto ? "[contenido recibido]" : "[vacío]");

    if (!texto) {
      return res.status(200).json({
        respuesta: "No pude identificar tu mensaje. Escríbelo nuevamente, por favor. 😊",
      });
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Intención detectada:", directa.intencion);
      return res.status(200).json({ respuesta: directa.respuesta });
    }

    if (!openai) {
      console.error("OPENAI_API_KEY no configurada");
      return res.status(200).json({
        respuesta: "Necesito confirmar esa información con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊",
      });
    }

    console.log("Intención detectada: consulta_abierta");

    const response = await openai.responses.create({
      model: MODEL,
      instructions: SYSTEM_PROMPT,
      input: texto,
      max_output_tokens: 220,
    });

    let respuestaIA = limpiarRespuesta(response.output_text || "");

    if (!respuestaIA) {
      respuestaIA = "Necesito confirmar esa información con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
    }

    if (tieneIntencionComercial(textoNormalizado)) {
      respuestaIA = `${respuestaIA}\n\n${cierreVenta()}`;
    }

    return res.status(200).json({ respuesta: respuestaIA });
  } catch (error) {
    console.error("Error en /mensaje:", error?.message || error);
    return res.status(200).json({
      respuesta: "En este momento no pude procesar tu mensaje. Inténtalo nuevamente en unos minutos. 😊",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ respuesta: "Ruta no encontrada." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor VICA SYSTEMS activo en puerto ${PORT}`);
});
