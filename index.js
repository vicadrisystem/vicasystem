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
Utiliza de forma natural, solo cuando encajen con la conversación, ideas relacionadas con:
- control
- libertad
- tranquilidad
- bienestar
- energía
- seguridad
- familia
- salud
- confianza
- esperanza

Nunca conviertas estos conceptos en promesas médicas.

OBJETIVO:
Después de resolver correctamente la duda, dirige suavemente a la compra solamente cuando exista intención comercial clara.
El cierre debe sentirse natural y nunca como presión.
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
    .replace(/¿[^?]*(quieres saber más|quieres saber mas|te interesa|te gustaría|te gustaria|te ayudo en algo más|te ayudo en algo mas|quieres que te cuente)[^?]*\?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function contieneAlguna(textoNormalizado, palabras) {
  return palabras.some((palabra) =>
    textoNormalizado.includes(normalizarTexto(palabra))
  );
}

function cierreVenta() {
  const cierres = [
    `💙 El Mega Pack está disponible por $79 MXN. Puedes realizar tu pago por transferencia bancaria o en efectivo.`,
    `🥗 El Mega Pack completo tiene un precio de $79 MXN y la entrega es digital después de confirmar tu pago.`,
    `😊 Si deseas adquirirlo, el Mega Pack está disponible por $79 MXN mediante transferencia bancaria o pago en efectivo.`,
  ];

  return elegirAleatoria(cierres);
}

function agregarCierreSiCorresponde(texto, debeCerrar) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return debeCerrar
      ? cierreVenta()
      : "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
  }

  if (!debeCerrar) {
    return limpio;
  }

  return `${limpio}\n\n${cierreVenta()}`;
}

function respuestaDirecta(textoNormalizado) {
  // 1. POSTRES: va antes de restricciones para evitar choque con "puedo comer postres".
  if (
    contieneAlguna(textoNormalizado, [
      "incluye postres",
      "trae postres",
      "hay recetas de postres",
      "recetario de postres",
      "postres saludables",
      "postres para diabeticos",
      "recetas de postres",
    ])
  ) {
    return {
      intencion: "postres",
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Sí 😊 La oferta incluye un Recetario de Postres Saludables como bono del Mega Pack.`,
          `Sí 💙 Dentro de los bonos recibirás un Recetario de Postres Saludables.`,
          `Sí 🍰 El Mega Pack incluye un bono dedicado a postres saludables.`,
        ]),
        true
      ),
    };
  }

  // 2. PRECIO.
  if (
    contieneAlguna(textoNormalizado, [
      "cuanto cuesta",
      "cual es el precio",
      "precio del mega pack",
      "costo del mega pack",
      "cuanto vale",
      "precio",
      "costo",
      "79 pesos",
    ])
  ) {
    return {
      intencion: "precio",
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `El Mega Pack completo tiene un precio de $79 MXN. 😊`,
          `Actualmente el precio del Mega Pack es de $79 MXN. 💙`,
          `El Mega Pack digital cuesta $79 MXN. 🥗`,
        ]),
        true
      ),
    };
  }

  // 3. MÉTODOS DE PAGO.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Puedes realizar tu pago mediante transferencia bancaria o en efectivo. 😊`,
          `Aceptamos transferencia bancaria y pago en efectivo. 💙`,
          `El pago puede hacerse por transferencia bancaria o en efectivo. 🥗`,
        ]),
        true
      ),
    };
  }

  // 4. ENTREGA Y FORMATO DIGITAL.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `El Mega Pack es completamente digital en PDF. Después de confirmar tu pago recibirás el material para descargarlo. 😊`,
          `La entrega es digital. En cuanto se confirme el pago recibirás el acceso al Mega Pack en PDF. 💙`,
          `No se envía ningún producto físico. Todo el material se entrega en formato PDF después de confirmar el pago. 🥗`,
        ]),
        true
      ),
    };
  }

  // 5. TIEMPO DE ENTREGA.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Después de confirmar tu pago recibirás el Mega Pack de forma digital. 😊`,
          `La entrega se realiza después de confirmar el pago y recibirás el material en PDF. 💙`,
          `Al ser digital, el material se entrega una vez que el pago queda confirmado. 🥗`,
        ]),
        true
      ),
    };
  }

  // 6. CONTENIDO DEL MEGA PACK.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `El Mega Pack incluye un Plan Integral de Alimentación, un Recetario Saludable y una Guía de Compras Inteligentes. También incluye una Guía de Remedios Naturales y Hábitos Saludables y un Recetario de Postres Saludables como bonos. 😊`,
          `Recibirás el Plan Integral de Alimentación, el Recetario Saludable y la Guía de Compras Inteligentes, además de los dos bonos incluidos en la oferta. 💙`,
          `Es un paquete digital con alimentación, recetas, compras inteligentes y dos bonos complementarios. 🥗`,
        ]),
        true
      ),
    };
  }

  // 7. FRUTAS.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Las frutas pueden formar parte de una alimentación organizada, pero la cantidad y frecuencia deben adaptarse a las necesidades de cada persona y a las indicaciones de su profesional de la salud. 💙`,
          `El material ofrece orientación general para elegir mejor tus alimentos, incluyendo frutas. Las porciones deben ajustarse de forma individual. 😊`,
          `No existe una única fruta o porción adecuada para todas las personas. La guía es educativa y debe complementarse con la orientación profesional. 🥗`,
        ]),
        false
      ),
    };
  }

  // 8. TORTILLA, ARROZ Y PAN.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `El objetivo no es prohibir alimentos de manera general. Las cantidades y elecciones de tortilla, arroz o pan pueden variar según cada persona. 💙`,
          `La guía puede orientarte a organizar mejor tus alimentos, pero las porciones deben adaptarse a tus necesidades y a la orientación de tu profesional de la salud. 😊`,
          `No todas las personas necesitan las mismas cantidades. El material es educativo y no reemplaza un plan nutricional personalizado. 🥗`,
        ]),
        false
      ),
    };
  }

  // 9. RESTRICCIONES Y ANTOJOS.
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
      intencion: "restricciones_alimentarias",
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `El objetivo del Mega Pack no es hacerte sentir que todo está prohibido, sino ayudarte a conocer alternativas y organizar mejor tu alimentación. 😊`,
          `La guía busca ayudarte a tomar decisiones más informadas y encontrar opciones prácticas para tu alimentación. 💙`,
          `El enfoque es ofrecer alternativas y organización, no imponer restricciones extremas. 🥗`,
        ]),
        false
      ),
    };
  }

  // 10. INGREDIENTES Y FACILIDAD DE LAS RECETAS.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Las recetas están pensadas para facilitar la alimentación diaria con opciones prácticas. La disponibilidad y el precio de los ingredientes pueden variar según tu localidad. 😊`,
          `El objetivo es utilizar opciones prácticas y alimentos que puedan encontrarse en supermercados y comercios habituales. 💙`,
          `La guía busca evitar complicaciones innecesarias al momento de preparar tus comidas. 🥗`,
        ]),
        false
      ),
    };
  }

  // 11. FACILIDAD DE USO.
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
      intencion: "facilidad_uso",
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `El material está presentado con un lenguaje sencillo y práctico. No necesitas tener conocimientos de nutrición para consultarlo. 😊`,
          `No necesitas ser especialista. El Mega Pack está organizado para que puedas leerlo y utilizarlo de manera sencilla. 💙`,
          `La información se presenta de forma clara y accesible para facilitar su consulta diaria. 🥗`,
        ]),
        false
      ),
    };
  }

  // 12. QUÉ APRENDERÁ.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Aprenderás a organizar mejor tus comidas, conocer opciones de recetas y realizar compras más inteligentes. 😊`,
          `El material busca ayudarte a planificar tu alimentación y encontrar ideas prácticas para el día a día. 💙`,
          `Encontrarás herramientas para organizar tus comidas, recetas y compras de una forma más sencilla. 🥗`,
        ]),
        false
      ),
    };
  }

  // 13. PARA QUIÉN ES.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `El Mega Pack es una guía educativa para personas que desean mejorar y organizar su alimentación. No sustituye la valoración ni las indicaciones de un profesional de la salud. 💙`,
          `Es un material educativo sobre alimentación saludable. Cada persona puede tener necesidades diferentes, por eso debe complementarse con el seguimiento profesional. 😊`,
          `Puede utilizarse como apoyo educativo para mejorar hábitos de alimentación, pero no reemplaza un plan médico o nutricional personalizado. 🥗`,
        ]),
        false
      ),
    };
  }

  // 14. POR QUÉ COMPRARLO.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Porque reúne en un solo lugar herramientas para organizar tus comidas, consultar recetas y hacer compras más inteligentes. 😊`,
          `El Mega Pack concentra recursos prácticos para facilitar la planificación de tu alimentación diaria. 💙`,
          `Su principal ventaja es integrar alimentación, recetas y compras en un mismo paquete digital. 🥗`,
        ]),
        true
      ),
    };
  }

  // 15. SOPORTE.
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
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Puedes escribirnos con confianza. Te ayudaremos con cualquier duda relacionada con el pago, la entrega o el acceso al material. 😊`,
          `Con gusto revisaremos cualquier inconveniente relacionado con tu compra o con la descarga del Mega Pack. 💙`,
          `Si tienes un problema con el pago o el acceso, podemos revisarlo para darte una respuesta correcta. 🥗`,
        ]),
        false
      ),
    };
  }

  // 16. INTENCIÓN EMOCIONAL. Está al final para no interferir con preguntas específicas.
  if (
    contieneAlguna(textoNormalizado, [
      "glucosa",
      "azucar",
      "control",
      "energia",
      "bienestar",
      "familia",
      "esperanza",
      "confianza",
      "vida",
      "cambio",
    ])
  ) {
    return {
      intencion: "bienestar_emocional",
      respuesta: agregarCierreSiCorresponde(
        elegirAleatoria([
          `Entiendo 💙 Buscar más claridad y tranquilidad al organizar la alimentación es una preocupación muy común. El Mega Pack está pensado como una guía práctica y educativa para facilitar esas decisiones.`,
          `Cuidar la alimentación puede ayudarte a sentir más organización y confianza en tus decisiones diarias. 🥗 El material reúne recursos prácticos para acompañar ese proceso.`,
          `Es comprensible querer sentir más control y seguridad al organizar tus comidas. 💙 La guía busca ayudarte con información práctica, siempre como complemento de la orientación profesional.`,
        ]),
        false
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
    "precio",
    "cuanto cuesta",
    "transferencia",
    "pago en efectivo",
    "metodo de pago",
  ]);
}

app.get("/", (req, res) => {
  res.send("Bot VICA SYSTEMS activo ✅");
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto =
      req.body.texto ||
      req.body.mensaje ||
      req.body.message ||
      "";

    console.log("Texto recibido:", texto ? "[contenido recibido]" : "[vacío]");

    if (!texto) {
      return res.json({
        respuesta: "No pude identificar tu mensaje. Por favor, escríbelo nuevamente. 😊",
      });
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Intención detectada:", directa.intencion);
      console.log("Respuesta generada: base de conocimiento");

      return res.json({
        respuesta: directa.respuesta,
      });
    }

    console.log("Intención detectada: consulta abierta");

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.4,
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: texto,
        },
      ],
    });

    const respuestaIA = limpiarRespuesta(response.output_text || "");

    if (!respuestaIA) {
      return res.json({
        respuesta:
          "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊",
      });
    }

    const respuestaFinal = agregarCierreSiCorresponde(
      respuestaIA,
      tieneIntencionComercial(textoNormalizado)
    );

    console.log("Respuesta generada: OpenAI");

    return res.json({
      respuesta: respuestaFinal,
    });
  } catch (error) {
    console.error("Error en /mensaje:", error.message);

    return res.status(200).json({
      respuesta:
        "En este momento no pude procesar tu mensaje. Por favor, inténtalo nuevamente en unos minutos. 😊",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor VICA SYSTEMS corriendo en puerto ${PORT}`);
});
