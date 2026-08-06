require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

const PALABRAS_EMOCIONALES_AVATAR = Object.freeze([
  "control",
  "libertad",
  "tranquilidad",
  "bienestar",
  "energía",
  "seguridad",
  "familia",
  "salud",
  "confianza",
  "esperanza",
]);

/* ==========================================================
   CONFIGURACIÓN GENERAL DEL AGENTE
========================================================== */

const SYSTEM_PROMPT = `
Eres Víctor Candelaria, asesor oficial de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el Mega Pack Alimentación Sana para Diabéticos.

Tu trabajo es responder de forma natural, breve, humana, cercana, amable y profesional.
Nunca debes parecer un chatbot ni una inteligencia artificial.

PERSONALIDAD:
- Cercano.
- Amable.
- Paciente.
- Profesional.
- Natural.
- Empático.
- Persuasivo sin presionar.

FORMA DE ESCRIBIR:
- Responde en español neutro.
- Usa lenguaje sencillo.
- Máximo dos párrafos cortos.
- Máximo 120 palabras.
- Usa emojis con moderación.
- No escribas textos largos.
- Resuelve primero la duda del usuario.
- Solo agrega un cierre comercial cuando exista intención de compra.

NO DEBES DECIR:
- "Como inteligencia artificial".
- "Según mi base de datos".
- "¿Te gustaría saber más?".
- "¿Quieres que te cuente?".
- "¿Puedo ayudarte en algo más?".
- "Hoy más que nunca".
- "Imagina por un momento".
- "No es magia".

REGLAS MÉDICAS:
- Nunca prometas curar, revertir o eliminar la diabetes.
- Nunca prometas eliminar medicamentos.
- Nunca garantices resultados médicos.
- Nunca hagas diagnósticos.
- Nunca sustituyas la valoración de un médico o profesional de la salud.
- Cuando corresponda, aclara que el Mega Pack es una guía educativa sobre alimentación saludable.

INFORMACIÓN OFICIAL DEL NEGOCIO:
- Empresa: VICA SYSTEMS.
- Agente: Víctor Candelaria.
- Producto: Mega Pack Alimentación Sana para Diabéticos.
- Tipo de producto: digital en PDF.
- Precio oficial vigente: $79 MXN.
- Entrega: digital e inmediata después de confirmar el pago.
- Métodos de pago: transferencia bancaria o pago en efectivo.

CONTENIDO PRINCIPAL:
- Plan Integral de Alimentación.
- Recetario Saludable.
- Guía de Compras Inteligentes.

BONOS:
- Guía de Remedios Naturales y Hábitos Saludables.
- Recetario de Postres Saludables.

DESENCADENANTES EMOCIONALES DEL AVATAR:
Utiliza de forma natural, moderada y coherente estas 10 palabras cuando ayuden a responder la duda o conectar con el prospecto:
- Control.
- Libertad.
- Tranquilidad.
- Bienestar.
- Energía.
- Seguridad.
- Familia.
- Salud.
- Confianza.
- Esperanza.

No las fuerces ni las repitas todas en una misma respuesta.
No las uses para prometer resultados médicos.
Úsalas para transmitir empatía, claridad, acompañamiento y beneficios emocionales reales.

OBJETIVO COMERCIAL:
- Resolver la duda de manera correcta.
- Reducir objeciones.
- Facilitar la compra cuando exista intención comercial.
- No presionar al usuario.
- No inventar información que no aparezca en esta base oficial.
- Si falta un dato, indica que necesitas confirmarlo con el equipo de VICA SYSTEMS.

CIERRES PERMITIDOS CUANDO HAYA INTENCIÓN DE COMPRA:
- "La promoción continúa disponible 😊".
- "En cuanto se confirme tu pago recibirás el Mega Pack de inmediato".
- "Puedes aprovechar el precio especial mientras la promoción siga activa".

Nunca repitas exactamente el mismo cierre en todas las conversaciones.
`;

/* ==========================================================
   FUNCIONES AUXILIARES
========================================================== */

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function limpiarRespuesta(texto) {
  return String(texto || "")
    .trim()
    .replace(/^hola[\s😊🙏❤️💙✨🥗🍎,!.]*/i, "")
    .replace(/^buenos dias[\s😊🙏❤️💙✨🥗🍎,!.]*/i, "")
    .replace(/^buenas tardes[\s😊🙏❤️💙✨🥗🍎,!.]*/i, "")
    .replace(/^buenas noches[\s😊🙏❤️💙✨🥗🍎,!.]*/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function contieneAlguna(textoNormalizado, palabrasClave) {
  return palabrasClave.some((palabra) =>
    textoNormalizado.includes(normalizarTexto(palabra))
  );
}

/* ==========================================================
   CIERRES COMERCIALES
========================================================== */

function cierreVenta() {
  const cierres = [
    `💙 El Mega Pack sigue disponible por $79 MXN. Puedes pagar mediante transferencia bancaria o en efectivo.`,
    `🥗 La promoción continúa disponible. Cuando se confirme tu pago, recibirás inmediatamente todo el material en PDF.`,
    `😊 Puedes aprovechar el precio especial de $79 MXN. La entrega es digital después de confirmar el pago.`,
  ];

  return elegirAleatoria(cierres);
}

function debeAgregarCierre(intencion) {
  const intencionesComerciales = [
    "contenido",
    "entrega",
    "precio",
    "metodos_pago",
    "razon_compra",
    "tiempo_entrega",
    "postres",
  ];

  return intencionesComerciales.includes(intencion);
}

function agregarCierre(texto, intencion) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return debeAgregarCierre(intencion)
      ? cierreVenta()
      : "Necesito confirmar ese dato con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";
  }

  if (!debeAgregarCierre(intencion)) {
    return limpio;
  }

  return `${limpio}\n\n${cierreVenta()}`;
}

function crearRespuesta(intencion, respuestas) {
  return {
    intencion,
    respuesta: agregarCierre(elegirAleatoria(respuestas), intencion),
  };
}

/* ==========================================================
   RESPUESTAS DIRECTAS
========================================================== */

function respuestaDirecta(textoNormalizado) {
  if (
    contieneAlguna(textoNormalizado, [
      "que incluye el mega pack",
      "que contiene el mega pack",
      "que trae el paquete",
      "contenido del paquete",
      "contenido del mega pack",
      "cuales son los modulos",
      "que materiales incluye",
    ])
  ) {
    return crearRespuesta("contenido", [
      `El Mega Pack incluye un Plan Integral de Alimentación, un Recetario Saludable y una Guía de Compras Inteligentes. También recibirás una Guía de Remedios Naturales y Hábitos Saludables y un Recetario de Postres Saludables como bonos. 😊`,
      `Recibirás tres recursos principales: el Plan Integral de Alimentación, el Recetario Saludable y la Guía de Compras Inteligentes. Además, la oferta incluye dos bonos complementarios. 🥗`,
      `Es un paquete digital completo con un plan de alimentación, recetas saludables, una guía para comprar mejor y dos bonos relacionados con hábitos y postres saludables. 💙`,
    ]);
  }

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
    return crearRespuesta("entrega", [
      `El producto es completamente digital. Después de confirmar tu pago recibirás el Mega Pack en formato PDF para descargarlo desde tu celular, computadora o tablet. 😊`,
      `La entrega se realiza de forma digital. Cuando se confirme el pago te enviaremos el acceso al Mega Pack en PDF. 💙`,
      `No se envía ningún producto físico. Todo el material se entrega en PDF después de validar tu pago. 🥗`,
    ]);
  }

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
    return crearRespuesta("publico_objetivo", [
      `El Mega Pack es una guía educativa para personas que desean mejorar y organizar su alimentación. No sustituye la valoración, el tratamiento ni las indicaciones de un profesional de la salud. 💙`,
      `El material ofrece información práctica sobre alimentación saludable. Cada persona tiene necesidades distintas, por eso es importante mantener el seguimiento con su médico o especialista. 😊`,
      `Puede utilizarse como apoyo educativo para mejorar hábitos de alimentación, pero no reemplaza un plan médico o nutricional personalizado. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "que voy a aprender",
      "que aprendere",
      "para que sirve el material",
      "que beneficios tiene",
      "que ensena",
    ])
  ) {
    return crearRespuesta("aprendizaje", [
      `Aprenderás a organizar mejor tus comidas, conocer opciones de recetas, hacer compras más inteligentes y desarrollar hábitos que faciliten cuidar tu alimentación cada día. 😊`,
      `El material te ayudará a planificar tu alimentación, encontrar ideas prácticas para cocinar y elegir mejor tus alimentos en el supermercado. 💙`,
      `Encontrarás herramientas sencillas para dejar de improvisar tanto al momento de comprar, cocinar y organizar tus comidas. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "cuanto cuesta",
      "cual es el precio",
      "precio del mega pack",
      "costo del mega pack",
      "cuanto vale",
      "precio",
      "costo",
      "$79",
      "79 pesos",
    ])
  ) {
    return crearRespuesta("precio", [
      `El Mega Pack completo tiene un precio especial de $79 MXN durante la promoción vigente. 😊`,
      `Actualmente puedes obtener todo el material y los bonos incluidos por $79 MXN. 💙`,
      `La oferta activa del Mega Pack digital es de $79 MXN. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "como puedo pagar",
      "que metodos de pago",
      "forma de pago",
      "pago por transferencia",
      "transferencia bancaria",
      "pago en efectivo",
      "puedo pagar en efectivo",
      "datos para pagar",
      "quiero pagar",
    ])
  ) {
    return crearRespuesta("metodos_pago", [
      `Puedes realizar tu pago mediante transferencia bancaria o en efectivo. Después de confirmar el pago recibirás el acceso digital. 😊`,
      `Aceptamos transferencia bancaria y pago en efectivo. Cuando el pago quede validado te enviaremos el Mega Pack. 💙`,
      `El pago puede hacerse por transferencia o en efectivo, según la opción que te resulte más cómoda. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "por que deberia comprarlo",
      "por que comprar el mega pack",
      "vale la pena",
      "que diferencia tiene",
      "por que me conviene",
    ])
  ) {
    return crearRespuesta("razon_compra", [
      `Porque reúne en un solo lugar herramientas para organizar tus comidas, preparar recetas saludables y hacer compras más inteligentes, sin tener que buscar información dispersa. 😊`,
      `El Mega Pack concentra recursos prácticos que pueden facilitar la planificación de tu alimentación diaria. 💙`,
      `Su principal ventaja es que integra alimentación, recetas y compras en una misma guía digital fácil de consultar. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "tendre que dejar de comer",
      "todo esta prohibido",
      "puedo comer postres",
      "incluye postres",
      "que hago con los antojos",
      "puedo seguir comiendo lo que me gusta",
      "hay alimentos prohibidos",
    ])
  ) {
    return crearRespuesta("restricciones_alimentarias", [
      `El objetivo no es hacerte sentir que todo está prohibido, sino ayudarte a conocer alternativas y organizar una alimentación más variada y práctica. 😊`,
      `El Mega Pack incluye recetas y opciones de postres saludables para ayudarte a encontrar alternativas dentro de una alimentación mejor organizada. 💙`,
      `La guía busca facilitar mejores decisiones y ofrecerte opciones, no imponer restricciones extremas. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "cuando lo recibo",
      "cuando llega",
      "cuanto tarda",
      "tiempo de entrega",
      "entrega inmediata",
      "lo recibo hoy",
      "demora la entrega",
      "en cuanto tiempo",
    ])
  ) {
    return crearRespuesta("tiempo_entrega", [
      `Después de confirmar tu pago recibirás el Mega Pack de forma digital para descargarlo de inmediato. 😊`,
      `La entrega se realiza en cuanto el pago queda confirmado. Recibirás todo el material en formato PDF. 💙`,
      `No necesitas esperar un envío físico. El acceso digital se entrega después de validar tu pago. 🥗`,
    ]);
  }

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
      "contactar al equipo",
    ])
  ) {
    return crearRespuesta("soporte", [
      `Puedes escribirnos con confianza. El equipo de VICA SYSTEMS te ayudará con cualquier duda relacionada con el pago, la entrega o el acceso al material. 😊`,
      `Con gusto te ayudaremos a revisar cualquier inconveniente con tu compra o con la descarga del Mega Pack. 💙`,
      `Si presentas algún problema con el pago o el acceso, necesitamos revisar tu caso con el equipo para darte una respuesta correcta. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "puedo comer tortillas",
      "puedo comer tortilla",
      "puedo comer arroz",
      "puedo comer pan",
      "tengo que dejar la tortilla",
      "tengo que dejar el pan",
      "tengo que dejar el arroz",
      "incluye carbohidratos",
      "que pasa con el pan",
      "que pasa con la tortilla",
    ])
  ) {
    return crearRespuesta("carbohidratos_comunes", [
      `El Mega Pack busca ayudarte a tomar decisiones más organizadas sobre tu alimentación, no a prohibir alimentos de manera general. Las cantidades y elecciones adecuadas pueden variar según cada persona. 💙`,
      `La guía incluye recomendaciones prácticas para mejorar la selección de alimentos. Sin embargo, las porciones de tortilla, arroz o pan deben ajustarse a tus necesidades y a las indicaciones de tu profesional de la salud. 😊`,
      `No todas las personas necesitan las mismas cantidades. El material puede orientarte de forma educativa, pero no sustituye un plan nutricional personalizado. 🥗`,
    ]);
  }

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
    return crearRespuesta("frutas", [
      `El Mega Pack incluye orientación general para ayudarte a elegir mejor tus alimentos, incluyendo frutas. Las porciones y opciones adecuadas pueden variar según cada persona. 💙`,
      `Las frutas pueden formar parte de una alimentación organizada, pero la cantidad y frecuencia deben adaptarse a tus necesidades y a las indicaciones de tu profesional de la salud. 😊`,
      `Dentro del material encontrarás recomendaciones educativas para planificar mejor tu alimentación. No se establece una única fruta o porción para todas las personas. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "incluye postres",
      "trae postres",
      "hay recetas de postres",
      "recetario de postres",
      "postres saludables",
      "postres para diabeticos",
      "puedo preparar postres",
      "recetas dulces",
      "recetas de pastel",
      "recetas de galletas",
    ])
  ) {
    return crearRespuesta("postres", [
      `Sí. La oferta incluye un Recetario de Postres Saludables con diferentes opciones para complementar el Mega Pack. 🍰`,
      `Recibirás un bono especial con recetas de postres saludables y opciones prácticas para preparar en casa. 😊`,
      `El Mega Pack incluye recetas saludables y, como bono, un recetario dedicado a postres. 💙`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "es facil de entender",
      "necesito saber nutricion",
      "es complicado",
      "es dificil",
      "sirve para principiantes",
      "lenguaje sencillo",
      "puedo entenderlo",
      "como se usa",
    ])
  ) {
    return crearRespuesta("facilidad_uso", [
      `El Mega Pack está presentado con un lenguaje sencillo y práctico para que puedas consultarlo sin necesidad de tener conocimientos de nutrición. 😊`,
      `No necesitas ser especialista. El material está organizado para que puedas leerlo y utilizarlo de manera sencilla. 💙`,
      `La información se presenta de forma clara y accesible, con recursos prácticos para el día a día. 🥗`,
    ]);
  }

  if (
    contieneAlguna(textoNormalizado, [
      "los ingredientes son caros",
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
    return crearRespuesta("ingredientes_recetas", [
      `El objetivo del Mega Pack es ofrecer ideas prácticas con ingredientes que puedan encontrarse en supermercados y comercios habituales. 😊`,
      `Las recetas están pensadas para facilitar la alimentación diaria, sin depender necesariamente de ingredientes difíciles de conseguir. 💙`,
      `La guía busca ayudarte a organizar tus comidas con opciones prácticas. La disponibilidad y el precio de los ingredientes pueden variar según tu localidad. 🥗`,
    ]);
  }

  return null;
}

/* ==========================================================
   DETECCIÓN DE INTENCIÓN COMERCIAL EN CONSULTAS ABIERTAS
========================================================== */

function detectarIntencionComercial(textoNormalizado) {
  if (
    contieneAlguna(textoNormalizado, [
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
      "datos bancarios",
    ])
  ) {
    return "precio";
  }

  return "consulta_abierta";
}

/* ==========================================================
   RUTA DE COMPROBACIÓN
========================================================== */

app.get("/", (req, res) => {
  return res.status(200).json({
    estado: "activo",
    agente: "VICA SYSTEMS",
    mensaje: "Agente de ventas activo ✅",
  });
});

/* ==========================================================
   ENDPOINT PRINCIPAL PARA MANYCHAT
========================================================== */

app.post("/mensaje", async (req, res) => {
  try {
    const texto =
      req.body?.texto ||
      req.body?.mensaje ||
      req.body?.message ||
      "";

    console.log(
      "Mensaje recibido:",
      String(texto).trim() ? "[contenido recibido]" : "[mensaje vacío]"
    );

    if (!String(texto).trim()) {
      console.log("Intención detectada: mensaje_vacio");

      return res.status(200).json({
        respuesta:
          "No pude identificar tu mensaje. Por favor, escríbelo nuevamente y con gusto te ayudamos. 😊",
      });
    }

    const textoNormalizado = normalizarTexto(texto);
    const respuestaEncontrada = respuestaDirecta(textoNormalizado);

    if (respuestaEncontrada) {
      console.log("Intención detectada:", respuestaEncontrada.intencion);
      console.log("Respuesta enviada: [base de conocimiento]");

      return res.status(200).json({
        respuesta: respuestaEncontrada.respuesta,
      });
    }

    console.log("Intención detectada: consulta_abierta");

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: SYSTEM_PROMPT,
      input: String(texto),
      max_output_tokens: 250,
    });

    const respuestaIA = limpiarRespuesta(response.output_text || "");
    const intencionComercial =
      detectarIntencionComercial(textoNormalizado);

    const respuestaFinal = respuestaIA
      ? agregarCierre(respuestaIA, intencionComercial)
      : "En este momento necesito confirmar esa información con el equipo de VICA SYSTEMS para darte una respuesta correcta. 😊";

    console.log("Respuesta enviada: [OpenAI]");

    return res.status(200).json({
      respuesta: respuestaFinal,
    });
  } catch (error) {
    console.error(
      "Error controlado en POST /mensaje:",
      error?.message || "Error desconocido"
    );

    return res.status(200).json({
      respuesta:
        "En este momento no pude procesar correctamente tu mensaje. Por favor, inténtalo nuevamente en unos minutos. 😊",
    });
  }
});

/* ==========================================================
   RUTAS NO ENCONTRADAS
========================================================== */

app.use((req, res) => {
  return res.status(404).json({
    respuesta: "Ruta no encontrada.",
  });
});

/* ==========================================================
   INICIO DEL SERVIDOR
========================================================== */

app.listen(PORT, () => {
  console.log(`Servidor de VICA SYSTEMS corriendo en el puerto ${PORT}`);
});
