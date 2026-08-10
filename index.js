require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const PORT = Number(process.env.PORT || 8080);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `
Eres Víctor Candelaria 💙, asesor de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el producto digital "Mega Pack Alimentación Sana para Diabéticos".

Tu trabajo es responder dudas de forma NATURAL, BREVE, HUMANA, CERCANA y PROFESIONAL.

IMPORTANTE:
- Nunca suenes robótico.
- Varía ligeramente las palabras y estructura.
- Responde máximo en 1 o 2 párrafos cortos.
- Usa lenguaje sencillo.
- Usa emojis con moderación.
- Primero resuelve la duda.
- Después dirige suavemente al siguiente paso cuando tenga sentido.

REGLAS:
- NO saludes.
- NO uses "Hola".
- NO hagas múltiples preguntas.
- NO presiones.
- NO inventes información.
- NO diagnostiques.
- NO prometas curar o revertir la diabetes.
- NO prometas eliminar medicamentos.
- NO garantices resultados médicos.
- El material no sustituye la atención de un profesional de salud.
- Si falta información oficial, indica que necesitas confirmarla con el equipo.

INFORMACIÓN REAL:
- Negocio: VICA SYSTEMS.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Formato: DIGITAL en PDF.
- Precio: $79 MXN.
- Entrega: digital después de confirmar el pago.
- Métodos de pago: transferencia bancaria o pago en efectivo.

INCLUYE:
- Plan Integral de Alimentación.
- Recetario Saludable.
- Guía de Compras Inteligentes.

BONOS:
- Guía de Remedios Naturales y Hábitos Saludables.
- Recetario de Postres Saludables.

DOLORES DEL AVATAR:
- No saber qué comer.
- Miedo de equivocarse al elegir alimentos.
- Sentir que todo está prohibido.
- Confusión sobre frutas, pan, arroz, tortillas y postres.
- Dificultad para organizar las comidas.
- Información contradictoria.
- Preocupación por su bienestar y su familia.

DESEOS DEL AVATAR:
- Sentir más control y tranquilidad.
- Organizar mejor sus comidas.
- Aprender qué comprar.
- Encontrar recetas prácticas.
- Sentirse con más confianza.
- Cuidar su bienestar y a su familia.

PALABRAS EMOCIONALES:
control, libertad, tranquilidad, bienestar, energía, seguridad, familia, salud, confianza y esperanza.

OBJETIVO:
Después de resolver la duda, dirige suavemente a la persona hacia la compra cuando exista intención comercial clara.
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

function cierreVenta() {
  return elegirAleatoria([
    `💙 El Mega Pack completo está disponible por $79 MXN.\n\nPuedes realizar tu pago por transferencia bancaria o en efectivo. ¿Cuál opción prefieres?`,
    `🥗 El Mega Pack tiene un precio de $79 MXN.\n\nPuedes pagar por transferencia bancaria o en efectivo. ¿Qué método prefieres?`,
    `💙 El Mega Pack digital cuesta $79 MXN.\n\nSi deseas adquirirlo, puedes elegir transferencia bancaria o pago en efectivo.`
  ]);
}

function agregarCierre(texto) {
  const limpio = limpiarRespuesta(texto);
  if (!limpio) return cierreVenta();
  return `${limpio}\n\n${cierreVenta()}`;
}

function extraerTexto(body) {
  if (!body) return "";
  if (typeof body === "string") return body.trim();

  const candidatos = [
    body.texto,
    body.mensaje,
    body.message,
    body.text,
    body.input,
    body.user_message,
    body.last_text_input,
    body.lastTextInput,
    body.content,
    body?.data?.texto,
    body?.data?.mensaje,
    body?.data?.message,
    body?.data?.text
  ];

  const encontrado = candidatos.find(
    (valor) => typeof valor === "string" && valor.trim().length > 0
  );

  return encontrado ? encontrado.trim() : "";
}

function respuestaDirecta(textoNormalizado) {
  if (
    textoNormalizado.includes("postre") ||
    textoNormalizado.includes("postres") ||
    textoNormalizado.includes("recetario de postres")
  ) {
    return agregarCierre(elegirAleatoria([
      `Sí 😊 El Mega Pack incluye como bono un Recetario de Postres Saludables.`,
      `Sí 💙 Dentro de los bonos recibirás un Recetario de Postres Saludables con opciones prácticas.`,
      `Sí 🍰 La oferta incluye un bono especial dedicado a postres saludables.`
    ]));
  }

  if (
    textoNormalizado.includes("fruta") ||
    textoNormalizado.includes("frutas") ||
    textoNormalizado.includes("manzana") ||
    textoNormalizado.includes("platano") ||
    textoNormalizado.includes("mango") ||
    textoNormalizado.includes("uvas")
  ) {
    return elegirAleatoria([
      `Las frutas pueden formar parte de una alimentación organizada 💙 Las porciones y opciones adecuadas pueden variar según cada persona y la orientación profesional.`,
      `El material te orienta de forma general sobre mejores elecciones de alimentos, incluyendo frutas 😊 Las cantidades deben adaptarse a cada persona.`,
      `La guía es educativa y puede ayudarte a organizar mejor tus elecciones de alimentos 🥗 sin sustituir una indicación nutricional personalizada.`
    ]);
  }

  if (
    textoNormalizado.includes("tortilla") ||
    textoNormalizado.includes("tortillas") ||
    textoNormalizado.includes("arroz") ||
    textoNormalizado.includes("pan")
  ) {
    return elegirAleatoria([
      `El objetivo no es prohibir alimentos de forma general 💙 Las cantidades de tortilla, arroz o pan pueden variar según cada persona.`,
      `No necesariamente tienes que eliminar esos alimentos 😊 La cantidad adecuada depende de tus necesidades y orientación profesional.`,
      `La guía busca ayudarte a organizar mejor tu alimentación, no imponer prohibiciones extremas 🥗`
    ]);
  }

  if (
    textoNormalizado.includes("ingrediente") ||
    textoNormalizado.includes("ingredientes") ||
    textoNormalizado.includes("receta") ||
    textoNormalizado.includes("recetas") ||
    textoNormalizado.includes("cocinar")
  ) {
    return elegirAleatoria([
      `Las recetas están pensadas para ser prácticas y facilitar la alimentación diaria 😊 La disponibilidad y precio de los ingredientes puede variar según tu localidad.`,
      `El material incluye recetas saludables con un enfoque práctico 💙 para ayudarte a organizar tus comidas.`,
      `La idea es evitar preparaciones innecesariamente complicadas y darte opciones fáciles de consultar 🥗`
    ]);
  }

  if (
    textoNormalizado.includes("que incluye") ||
    textoNormalizado.includes("que contiene") ||
    textoNormalizado.includes("que trae") ||
    textoNormalizado.includes("contenido") ||
    textoNormalizado.includes("modulos") ||
    textoNormalizado.includes("mega pack")
  ) {
    return agregarCierre(elegirAleatoria([
      `El Mega Pack incluye Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes 💙 Además recibirás dos bonos especiales.`,
      `Recibirás tres recursos principales: Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes 🥗 más dos bonos.`,
      `Es un paquete digital completo con alimentación, recetas, compras inteligentes y dos bonos complementarios 😊`
    ]));
  }

  if (
    textoNormalizado.includes("envio") ||
    textoNormalizado.includes("enviar") ||
    textoNormalizado.includes("entrega") ||
    textoNormalizado.includes("fisico") ||
    textoNormalizado.includes("pdf") ||
    textoNormalizado.includes("digital") ||
    textoNormalizado.includes("descargar") ||
    textoNormalizado.includes("recibir") ||
    textoNormalizado.includes("recibo") ||
    textoNormalizado.includes("archivo") ||
    textoNormalizado.includes("llega")
  ) {
    return agregarCierre(elegirAleatoria([
      `El Mega Pack es completamente digital en PDF 😊 Después de confirmar tu pago recibirás el material para descargarlo.`,
      `No es un producto físico 💙 La entrega se realiza digitalmente después de confirmar el pago.`,
      `El material se entrega en formato PDF 🥗 para que puedas consultarlo desde tu dispositivo.`
    ]));
  }

  if (
    textoNormalizado.includes("cuanto") ||
    textoNormalizado.includes("cuesta") ||
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("vale") ||
    textoNormalizado.includes("pagar") ||
    textoNormalizado.includes("pago") ||
    textoNormalizado.includes("transferencia") ||
    textoNormalizado.includes("efectivo")
  ) {
    return agregarCierre(elegirAleatoria([
      `El Mega Pack completo tiene un precio de $79 MXN 💙 Puedes pagar por transferencia bancaria o en efectivo.`,
      `Actualmente el Mega Pack digital cuesta $79 MXN 😊 El pago puede realizarse por transferencia o en efectivo.`,
      `El precio del Mega Pack es de $79 MXN 🥗 y puedes elegir transferencia bancaria o pago en efectivo.`
    ]));
  }

  if (
    textoNormalizado.includes("facil") ||
    textoNormalizado.includes("dificil") ||
    textoNormalizado.includes("complicado") ||
    textoNormalizado.includes("entender") ||
    textoNormalizado.includes("nutricion")
  ) {
    return elegirAleatoria([
      `El material está presentado con lenguaje sencillo y práctico 😊 No necesitas conocimientos de nutrición para consultarlo.`,
      `Está organizado para que sea fácil de comprender 💙 y puedas usarlo como una guía práctica.`,
      `No necesitas ser especialista 🥗 El contenido busca explicar las ideas de forma clara y sencilla.`
    ]);
  }

  if (
    textoNormalizado.includes("tipo 1") ||
    textoNormalizado.includes("tipo 2") ||
    textoNormalizado.includes("prediabetes") ||
    textoNormalizado.includes("diabetico") ||
    textoNormalizado.includes("diabetica")
  ) {
    return elegirAleatoria([
      `Es una guía educativa para personas que desean mejorar y organizar su alimentación 💙 No sustituye indicaciones profesionales.`,
      `El material está enfocado en alimentación y hábitos saludables 😊 Cada persona puede tener necesidades diferentes.`,
      `Puede utilizarse como apoyo educativo 🥗 pero no sustituye un plan médico o nutricional personalizado.`
    ]);
  }

  if (
    textoNormalizado.includes("aprender") ||
    textoNormalizado.includes("aprendere") ||
    textoNormalizado.includes("beneficio") ||
    textoNormalizado.includes("beneficios") ||
    textoNormalizado.includes("sirve")
  ) {
    return agregarCierre(elegirAleatoria([
      `Aprenderás a organizar mejor tus comidas, consultar opciones de recetas y realizar compras más inteligentes 😊`,
      `El material busca ayudarte a planificar mejor tu alimentación y tomar decisiones con más claridad 💙`,
      `Encontrarás herramientas prácticas para organizar comidas, recetas y compras de una forma más sencilla 🥗`
    ]));
  }

  if (
    textoNormalizado.includes("duda") ||
    textoNormalizado.includes("ayuda") ||
    textoNormalizado.includes("problema") ||
    textoNormalizado.includes("soporte") ||
    textoNormalizado.includes("asesor")
  ) {
    return elegirAleatoria([
      `Puedes escribirnos con confianza 😊 Te ayudaremos con dudas relacionadas con el pago, entrega o acceso al material.`,
      `Con gusto revisaremos cualquier inconveniente con tu compra o descarga 💙`,
      `Estamos para ayudarte 🥗 Si tienes algún problema con el pago o el acceso, podemos revisarlo contigo.`
    ]);
  }

  if (
    textoNormalizado.includes("glucosa") ||
    textoNormalizado.includes("azucar") ||
    textoNormalizado.includes("control") ||
    textoNormalizado.includes("energia") ||
    textoNormalizado.includes("bienestar") ||
    textoNormalizado.includes("familia") ||
    textoNormalizado.includes("esperanza") ||
    textoNormalizado.includes("confianza") ||
    textoNormalizado.includes("salud") ||
    textoNormalizado.includes("cambio")
  ) {
    return agregarCierre(elegirAleatoria([
      `Entiendo 💙 Muchas personas buscan más claridad y tranquilidad al organizar su alimentación. La guía está pensada para acompañarte de forma práctica.`,
      `Cuidar la alimentación también puede darte más organización y confianza en tus decisiones diarias 🥗`,
      `Es comprensible querer sentir más control al organizar tus comidas 💙 El material busca darte una guía sencilla y educativa.`
    ]));
  }

  return null;
}

app.get("/", (req, res) => {
  res.send("Bot ventas activo ✅");
});

app.get("/mensaje", (req, res) => {
  const texto = String(req.query.texto || req.query.mensaje || req.query.message || req.query.text || "").trim();
  if (!texto) return res.json({ respuesta: "Endpoint activo ✅" });
  const directa = respuestaDirecta(normalizarTexto(texto));
  return res.json({ respuesta: directa || "Consulta recibida correctamente ✅" });
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto = extraerTexto(req.body);

    console.log("Texto recibido:", texto ? "[contenido recibido]" : "[vacío]");

    if (!texto) {
      return res.json({ respuesta: cierreVenta() });
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Respuesta directa detectada");
      return res.json({ respuesta: directa });
    }

    if (!openai) {
      console.error("OPENAI_API_KEY no configurada");
      return res.json({
        respuesta: "Necesito confirmar esa información con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊"
      });
    }

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      temperature: 0.4,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto }
      ]
    });

    const respuestaIA = response.output_text || "";
    const respuestaFinal = agregarCierre(respuestaIA);

    console.log("Respuesta generada mediante OpenAI");
    return res.json({ respuesta: respuestaFinal });
  } catch (error) {
    console.error("Error en /mensaje:", error?.message || error);
    return res.status(200).json({
      respuesta: "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente. 😊"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
