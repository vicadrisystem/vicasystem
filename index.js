require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres Víctor Candelaria 💙, asesor de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el producto digital:
"Mega Pack Alimentación Sana para Diabéticos".

Tu trabajo es responder dudas de forma NATURAL, BREVE, HUMANA, CERCANA y PROFESIONAL, como si fueras una persona real atendiendo por WhatsApp.

IMPORTANTE:
- Nunca suenes robótico.
- Nunca respondas exactamente igual cada vez.
- Varía ligeramente las palabras y estructura.
- No escribas demasiado.
- Responde máximo en 1 o 2 párrafos cortos.
- Usa lenguaje sencillo.
- Usa emojis con moderación.
- Primero resuelve la duda.
- Después dirige suavemente al siguiente paso cuando tenga sentido.

REGLAS:
- NO saludes.
- NO uses "Hola".
- NO hagas múltiples preguntas.
- NO hagas preguntas abiertas innecesarias.
- NO seas agresivo vendiendo.
- NO presiones.
- NO inventes información.
- NO prometas resultados médicos.
- NO diagnostiques.
- NO digas que el material sustituye al médico.
- NO prometas curar o revertir la diabetes.
- NO prometas eliminar medicamentos.
- Si falta información, indica que necesitas confirmarla con el equipo.

INFORMACIÓN REAL:
- Negocio: VICA SYSTEMS.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Formato: DIGITAL en PDF.
- Precio: $79 MXN.
- Entrega: digital después de confirmar el pago.
- Métodos de pago:
  - transferencia bancaria
  - pago en efectivo

EL MEGA PACK INCLUYE:
- Plan Integral de Alimentación.
- Recetario Saludable.
- Guía de Compras Inteligentes.

BONOS:
- Guía de Remedios Naturales y Hábitos Saludables.
- Recetario de Postres Saludables.

DOLORES DEL AVATAR:
- No saber qué comer.
- Tener miedo de equivocarse al elegir alimentos.
- Sentir que todo está prohibido.
- Confusión sobre frutas, pan, arroz, tortillas y postres.
- Dificultad para organizar las comidas.
- Información contradictoria.
- Preocupación por el futuro y por su familia.
- Cansancio de buscar soluciones complicadas.

DESEOS DEL AVATAR:
- Sentir más control.
- Tener tranquilidad al elegir alimentos.
- Organizar mejor sus comidas.
- Aprender qué comprar.
- Encontrar recetas prácticas.
- Sentirse con más confianza.
- Cuidar su bienestar y a su familia.
- Tener una guía sencilla que pueda consultar.

PALABRAS EMOCIONALES:
control, libertad, tranquilidad, bienestar, energía, seguridad,
familia, salud, confianza y esperanza.

OBJETIVO:
Después de resolver la duda de forma amable y humana, dirige suavemente a la persona hacia la compra del Mega Pack cuando exista intención comercial.

Haz que el cierre se sienta natural y útil, nunca como presión.
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
  texto = String(texto || "").trim();

  texto = texto
    .replace(/^¡?\s*hola\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^gracias por preguntar\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenos días\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenos dias\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenas tardes\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "")
    .replace(/^buenas noches\s*[😊🙏❤️💙✨🌿🥗🍎,.!]*\s*/gi, "");

  texto = texto
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function cierreVenta() {
  const cierres = [
    `💙 El Mega Pack completo está disponible por $79 MXN.

Puedes realizar tu pago por transferencia bancaria o en efectivo. ¿Cuál opción prefieres?`,

    `🥗 Si deseas aprovechar el Mega Pack, el precio es de $79 MXN.

Puedes pagar por transferencia bancaria o en efectivo. ¿Qué método prefieres?`,

    `💙 El Mega Pack digital tiene un precio de $79 MXN.

Si deseas adquirirlo, puedes elegir transferencia bancaria o pago en efectivo.`,
  ];

  return elegirAleatoria(cierres);
}

function agregarCierre(texto) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return cierreVenta();
  }

  return `${limpio}

${cierreVenta()}`;
}

function respuestaDirecta(textoNormalizado) {

  // 1. POSTRES — específica antes de preguntas generales de comida
  if (
    textoNormalizado.includes("postre") ||
    textoNormalizado.includes("postres") ||
    textoNormalizado.includes("recetario de postres")
  ) {
    const respuestas = [
      `Sí 😊 El Mega Pack incluye como bono un Recetario de Postres Saludables.`,
      `Sí 💙 Dentro de los bonos recibirás un Recetario de Postres Saludables con opciones prácticas.`,
      `Sí 🍰 La oferta incluye un bono especial dedicado a postres saludables.`,
    ];

    return agregarCierre(elegirAleatoria(respuestas));
  }

  // 2. FRUTAS
  if (
    textoNormalizado.includes("fruta") ||
    textoNormalizado.includes("frutas") ||
    textoNormalizado.includes("manzana") ||
    textoNormalizado.includes("platano") ||
    textoNormalizado.includes("mango") ||
    textoNormalizado.includes("uvas")
  ) {
    const respuestas = [
      `Las frutas pueden formar parte de una alimentación organizada 💙 Las porciones y opciones adecuadas pueden variar según cada persona y la orientación de su profesional de salud.`,
      `El material te orienta de forma general sobre mejores elecciones de alimentos, incluyendo frutas 😊 Las cantidades deben adaptarse a cada persona.`,
      `Sí pueden existir opciones de fruta dentro de una alimentación organizada 🥗 La guía es educativa y no sustituye una indicación nutricional personalizada.`,
    ];

    return elegirAleatoria(respuestas);
  }

  // 3. TORTILLA / ARROZ / PAN
  if (
    textoNormalizado.includes("tortilla") ||
    textoNormalizado.includes("tortillas") ||
    textoNormalizado.includes("arroz") ||
    textoNormalizado.includes("pan")
  ) {
    const respuestas = [
      `El objetivo no es prohibir alimentos de forma general 💙 Las cantidades de tortilla, arroz o pan pueden variar según cada persona.`,
      `No necesariamente tienes que eliminar esos alimentos 😊 La cantidad adecuada depende de tus necesidades y de la orientación profesional.`,
      `La guía busca ayudarte a organizar mejor tu alimentación, no imponer prohibiciones extremas 🥗`,
    ];

    return elegirAleatoria(respuestas);
  }

  // 4. INGREDIENTES / RECETAS
  if (
    textoNormalizado.includes("ingrediente") ||
    textoNormalizado.includes("ingredientes") ||
    textoNormalizado.includes("receta") ||
    textoNormalizado.includes("recetas") ||
    textoNormalizado.includes("cocinar")
  ) {
    const respuestas = [
      `Las recetas están pensadas para ser prácticas y facilitar la alimentación diaria 😊 La disponibilidad y precio de los ingredientes puede variar según tu localidad.`,
      `El material incluye recetas saludables con un enfoque práctico 💙 para que organizar tus comidas sea más sencillo.`,
      `La idea es evitar preparaciones innecesariamente complicadas y darte opciones que puedas consultar fácilmente 🥗`,
    ];

    return elegirAleatoria(respuestas);
  }

  // 5. CONTENIDO / QUÉ INCLUYE
  if (
    textoNormalizado.includes("que incluye") ||
    textoNormalizado.includes("que contiene") ||
    textoNormalizado.includes("que trae") ||
    textoNormalizado.includes("contenido") ||
    textoNormalizado.includes("modulos") ||
    textoNormalizado.includes("mega pack")
  ) {
    const respuestas = [
      `El Mega Pack incluye Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes 💙 Además recibirás la Guía de Remedios Naturales y Hábitos Saludables y el Recetario de Postres Saludables como bonos.`,
      `Recibirás tres recursos principales: Plan Integral de Alimentación, Recetario Saludable y Guía de Compras Inteligentes 🥗 más dos bonos especiales.`,
      `Es un paquete digital completo con alimentación, recetas, compras inteligentes y dos bonos complementarios 😊`,
    ];

    return agregarCierre(elegirAleatoria(respuestas));
  }

  // 6. ENTREGA / PDF / DESCARGA
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
    const respuestas = [
      `El Mega Pack es completamente digital en PDF 😊 Después de confirmar tu pago recibirás el material para descargarlo.`,
      `No es un producto físico 💙 La entrega se realiza digitalmente después de confirmar el pago.`,
      `El material se entrega en formato PDF 🥗 para que puedas consultarlo desde tu celular, computadora o tablet.`,
    ];

    return agregarCierre(elegirAleatoria(respuestas));
  }

  // 7. PRECIO / PAGO
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
    const respuestas = [
      `El Mega Pack completo tiene un precio de $79 MXN 💙 Puedes pagar por transferencia bancaria o en efectivo.`,
      `Actualmente el Mega Pack digital cuesta $79 MXN 😊 El pago puede realizarse por transferencia o en efectivo.`,
      `El precio del Mega Pack es de $79 MXN 🥗 y puedes elegir transferencia bancaria o pago en efectivo.`,
    ];

    return agregarCierre(elegirAleatoria(respuestas));
  }

  // 8. FÁCIL DE ENTENDER
  if (
    textoNormalizado.includes("facil") ||
    textoNormalizado.includes("dificil") ||
    textoNormalizado.includes("complicado") ||
    textoNormalizado.includes("entender") ||
    textoNormalizado.includes("nutricion")
  ) {
    const respuestas = [
      `El material está presentado con lenguaje sencillo y práctico 😊 No necesitas tener conocimientos de nutrición para consultarlo.`,
      `Está organizado para que sea fácil de comprender 💙 y puedas usarlo como una guía práctica.`,
      `No necesitas ser especialista 🥗 El contenido busca explicar las ideas de forma clara y sencilla.`,
    ];

    return elegirAleatoria(respuestas);
  }

  // 9. PARA QUIÉN ES
  if (
    textoNormalizado.includes("tipo 1") ||
    textoNormalizado.includes("tipo 2") ||
    textoNormalizado.includes("prediabetes") ||
    textoNormalizado.includes("diabetico") ||
    textoNormalizado.includes("diabetica")
  ) {
    const respuestas = [
      `Es una guía educativa para personas que desean mejorar y organizar su alimentación 💙 No sustituye las indicaciones de un médico o profesional de salud.`,
      `El material está enfocado en alimentación y hábitos saludables 😊 Cada persona puede tener necesidades diferentes, por eso no reemplaza una valoración profesional.`,
      `Puede utilizarse como apoyo educativo 🥗 pero no sustituye un plan médico o nutricional personalizado.`,
    ];

    return elegirAleatoria(respuestas);
  }

  // 10. QUÉ APRENDERÉ / BENEFICIOS
  if (
    textoNormalizado.includes("aprender") ||
    textoNormalizado.includes("aprendere") ||
    textoNormalizado.includes("beneficio") ||
    textoNormalizado.includes("beneficios") ||
    textoNormalizado.includes("sirve")
  ) {
    const respuestas = [
      `Aprenderás a organizar mejor tus comidas, consultar opciones de recetas y realizar compras más inteligentes 😊`,
      `El material busca ayudarte a planificar mejor tu alimentación y tomar decisiones con más claridad 💙`,
      `Encontrarás herramientas prácticas para organizar comidas, recetas y compras de una forma más sencilla 🥗`,
    ];

    return agregarCierre(elegirAleatoria(respuestas));
  }

  // 11. DUDAS / SOPORTE
  if (
    textoNormalizado.includes("duda") ||
    textoNormalizado.includes("ayuda") ||
    textoNormalizado.includes("problema") ||
    textoNormalizado.includes("soporte") ||
    textoNormalizado.includes("asesor")
  ) {
    const respuestas = [
      `Puedes escribirnos con confianza 😊 Te ayudaremos con dudas relacionadas con el pago, entrega o acceso al material.`,
      `Con gusto revisaremos cualquier inconveniente con tu compra o descarga 💙`,
      `Estamos para ayudarte 🥗 Si tienes algún problema con el pago o el acceso, podemos revisarlo contigo.`,
    ];

    return elegirAleatoria(respuestas);
  }

  // 12. DOLORES / DESEOS EMOCIONALES — SIEMPRE AL FINAL
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
    const respuestas = [
      `Entiendo 💙 Muchas personas buscan justamente más claridad y tranquilidad al organizar su alimentación. La guía está pensada para acompañarte de una forma práctica.`,
      `Cuidar la alimentación también puede ayudarte a sentir más organización y confianza en tus decisiones diarias 🥗`,
      `Es comprensible querer sentir más control al momento de organizar tus comidas 💙 El material busca darte una guía sencilla y educativa.`,
    ];

    return agregarCierre(elegirAleatoria(respuestas));
  }

  return null;
}

app.get("/", (req, res) => {
  res.send("Bot ventas activo ✅");
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto =
      req.body.texto ||
      req.body.mensaje ||
      req.body.message ||
      "";

    console.log(
      "Texto recibido:",
      texto ? "[contenido recibido]" : "[vacío]"
    );

    if (!texto) {
      return res.json({
        respuesta: cierreVenta(),
      });
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Respuesta directa detectada");

      return res.json({
        respuesta: directa,
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: SYSTEM_PROMPT,
      input: texto,
      max_output_tokens: 220,
    });

    const respuestaIA = response.output_text || "";
    const respuestaFinal = agregarCierre(respuestaIA);

    console.log("Respuesta generada mediante OpenAI");

    return res.json({
      respuesta: respuestaFinal,
    });
  } catch (error) {
    console.error("Error en /mensaje:", error.message);

    return res.json({
      respuesta: cierreVenta(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
