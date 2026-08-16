require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8080;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ==========================================================
// INFORMACIÓN OFICIAL - VICA SYSTEMS
// FUNNEL PREPAGO
// PRIMERO PAGA -> LISTO -> COMPROBANTE -> VALIDACIÓN -> ENTREGA
// ==========================================================

const DATOS_PAGO = {
  banco: "Spin by OXXO",
  titular: "Víctor Adrián Candelaria",
  clabe: "728969000180849818",
  oxxo: "2242170100440082",

  precioPrincipal: 79,

  aportacionesVoluntarias: {
    gratitud: 80,
    proyecto: 100,
    especial: 150
  },

  precioUpsell: 70
};

const PRODUCTO = {
  nombre: "Mega Pack de Alimentación para la Diabetes",
  formato: "Digital en PDF",

  bonos: [
    "Recetario de Postres Saludables",
    "Guía de Hábitos Saludables"
  ],

  upsell: {
    nombre: "Pack Complementario",
    precio: 70,
    recursos: [
      "Jugos y Batidos",
      "Guía de Jugos Naturales",
      "Guía de Compras",
      "Resistencia a la Insulina",
      "Registro de Glucometrías"
    ]
  }
};

// ==========================================================
// PROMPT DEL AGENTE
// ==========================================================

const SYSTEM_PROMPT = `
Eres Isabel Romero ❤️, asistente de atención y ventas de VICA SYSTEMS.

Atiendes por WhatsApp a personas interesadas en el
"Mega Pack de Alimentación para la Diabetes".

Tu personalidad es amable, cálida, paciente, cercana,
clara, respetuosa y humana.

Responde como una persona real por WhatsApp.

REGLAS DE ESTILO:

- Responde siempre en español.
- Utiliza mensajes breves y fáciles de leer.
- Usa párrafos cortos.
- Deja una línea en blanco entre ideas cuando ayude a la lectura.
- Usa emojis con moderación.
- No repitas información innecesariamente.
- No saludes nuevamente si la conversación ya comenzó.
- Responde directamente la duda del usuario.
- No hagas preguntas innecesarias.
- No inventes promociones, cuentas, enlaces ni información.
- No digas que eres una inteligencia artificial.
- No uses lenguaje médico alarmista.
- No prometas curar, revertir, controlar o tratar la diabetes.
- No sustituyas indicaciones de médicos o nutriólogos.
- Si una duda depende de la situación médica personal,
  recomienda consultar a su profesional de salud.

REGLA PRINCIPAL DEL FUNNEL:

ESTA ES UNA OFERTA PREPAGO.

PRIMERO SE REALIZA EL PAGO DE $79 MXN.
DESPUÉS LA PERSONA ESCRIBE LISTO.
DESPUÉS ENVÍA EL COMPROBANTE.
SE VALIDA EL PAGO.
FINALMENTE SE ENTREGA EL MATERIAL DIGITAL.

NUNCA digas:
- que el material ya fue entregado si todavía no existe pago confirmado;
- que puede revisar el material antes de pagar;
- que los $79 son una aportación o donación;
- que la compra principal es voluntaria.

INFORMACIÓN OFICIAL DE LA OFERTA PRINCIPAL:

Producto:
Mega Pack de Alimentación para la Diabetes.

Precio único de compra:
$79 MXN.

Formato:
Digital en PDF.

Contenido principal:
- Plan Integral de Alimentación.
- Recetario Saludable con ideas para desayunos, comidas, cenas y snacks.
- Guía de Compras Inteligentes para orientar la organización de las compras y selección de alimentos.

El material está pensado como recurso educativo y práctico para dar más variedad,
organización e ideas en la alimentación diaria.

No afirmes que una receta, fruta o alimento específico es adecuado para todas las personas.
Las porciones y necesidades individuales pueden variar.


Bonos incluidos:
- Recetario de Postres Saludables.
- Guía de Hábitos Saludables.

MÉTODOS DE PAGO:

- Transferencia bancaria.
- Depósito en OXXO.

DATOS DE TRANSFERENCIA:

Banco: Spin by OXXO
Titular: Víctor Adrián Candelaria
CLABE: 728969000180849818

DEPÓSITO EN OXXO:

Número: 2242170100440082
Titular: Víctor Adrián Candelaria

PROCESO DEL COMPROBANTE:

1. La persona realiza su pago.
2. Después escribe LISTO.
3. Espera la respuesta del flujo.
4. Envía la imagen o fotografía del comprobante.
5. Se valida el pago.
6. Una vez confirmado, se entrega el Mega Pack y sus bonos.

SI LA PERSONA DESEA PAGAR DESPUÉS:

Responde con amabilidad.
No presiones.
Aclara que el material quedará pendiente
y se entregará cuando el pago de $79 MXN sea confirmado.

APORTACIONES VOLUNTARIAS:

Después de explicar claramente que el precio del producto es $79 MXN,
puedes mencionar, SOLO cuando sea apropiado, que existe la opción
de apoyar voluntariamente el proyecto con una aportación adicional.

Opciones voluntarias:
- $80 MXN: gesto de gratitud.
- $100 MXN: apoyo para seguir creando nuevas guías y recursos.
- $150 MXN: apoyo especial para continuar desarrollando contenido.

IMPORTANTE:
- La aportación es completamente opcional.
- No es necesaria para recibir el producto.
- No sustituye el pago de $79 MXN.
- Nunca hagas sentir culpa, presión u obligación.
- Preséntala con agradecimiento y relacionándola con el valor del trabajo,
  el tiempo de investigación, organización y creación de materiales,
  y con el deseo de seguir produciendo recursos útiles para la comunidad.
- Si la persona solo quiere pagar $79 MXN, respétalo completamente.

UPSELL POSTCOMPRA:

Después de la compra principal existe un Pack Complementario
opcional por $70 MXN.

Incluye:
- Jugos y Batidos.
- Guía de Jugos Naturales.
- Guía de Compras.
- Resistencia a la Insulina.
- Registro de Glucometrías.

El upsell es adicional y no forma parte
del Mega Pack principal de $79 MXN.

Cuando respondas una pregunta concreta,
NO repitas todo el discurso de venta.
Contesta solamente lo necesario,
de forma clara, amable, breve y visual.
`;

// ==========================================================
// FUNCIONES GENERALES
// ==========================================================

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contieneAlguna(texto, frases) {
  return frases.some((frase) => texto.includes(frase));
}

function limpiarRespuesta(valor) {
  return String(valor ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ==========================================================
// MENSAJES REUTILIZABLES
// ==========================================================

function cierrePago() {
  return [
    `💙 El Mega Pack tiene un precio de $${DATOS_PAGO.precioPrincipal} MXN.`,
    "",
    "Puedes realizar tu pago mediante:",
    "",
    "🏦 Transferencia bancaria",
    "🏪 Depósito en OXXO",
    "",
    "¿Cuál método prefieres?"
  ].join("\n");
}

function cierreAportacionVoluntaria() {
  return [
    "💙 Y si además deseas apoyar voluntariamente este proyecto, puedes hacerlo con:",
    "",
    `💖 $${DATOS_PAGO.aportacionesVoluntarias.gratitud} MXN — gesto de gratitud`,
    `💗 $${DATOS_PAGO.aportacionesVoluntarias.proyecto} MXN — apoyo para seguir creando nuevas guías y recursos`,
    `💞 $${DATOS_PAGO.aportacionesVoluntarias.especial} MXN — apoyo especial al desarrollo de nuevo contenido`,
    "",
    "Es completamente opcional. Con tu pago de $79 MXN recibes tu material completo. 🙏"
  ].join("\n");
}

function agregarCierre(respuesta) {
  const respuestaLimpia = limpiarRespuesta(respuesta);

  if (!respuestaLimpia) {
    return cierrePago();
  }

  const normalizada = normalizarTexto(respuestaLimpia);

  const yaIncluyeCierre =
    normalizada.includes("cual metodo prefieres") ||
    normalizada.includes("elige tu metodo de pago") ||
    (
      normalizada.includes("transferencia bancaria") &&
      normalizada.includes("deposito en oxxo")
    );

  if (yaIncluyeCierre) {
    return respuestaLimpia;
  }

  return `${respuestaLimpia}\n\n${cierrePago()}`;
}

function instruccionesComprobante() {
  return [
    "📸 Para validar correctamente tu pago:",
    "",
    "1️⃣ Envíame primero la palabra LISTO ✅",
    "2️⃣ Espera mi respuesta.",
    "3️⃣ Después envíame la foto o captura de tu comprobante.",
    "",
    "Una vez confirmado el pago, continuamos con la entrega de tu material digital. 💙"
  ].join("\n");
}

function respuestaCuenta() {
  return [
    "Claro 😊 Estos son los datos para realizar tu pago por transferencia:",
    "",
    `🏦 Banco: ${DATOS_PAGO.banco}`,
    `👤 Titular: ${DATOS_PAGO.titular}`,
    `🔢 CLABE: ${DATOS_PAGO.clabe}`,
    "",
    instruccionesComprobante()
  ].join("\n");
}

function respuestaPagoPosterior() {
  return [
    "Claro 😊 No hay problema si deseas realizar tu pago más tarde.",
    "",
    `Tu Mega Pack de $${DATOS_PAGO.precioPrincipal} MXN quedará pendiente y se entregará una vez que confirmemos el pago.`,
    "",
    "Cuando estés listo(a), escríbeme y continuamos con mucho gusto. 💙"
  ].join("\n");
}

function respuestaOxxo() {
  return [
    "Claro 😊 Puedes realizar tu pago mediante depósito en OXXO:",
    "",
    `🏪 Número: ${DATOS_PAGO.oxxo}`,
    `👤 Titular: ${DATOS_PAGO.titular}`,
    "",
    "Conserva tu ticket completo y legible.",
    "",
    instruccionesComprobante()
  ].join("\n");
}

function respuestaEntrega() {
  return [
    `📲 El ${PRODUCTO.nombre} es completamente digital y se entrega en formato PDF.`,
    "",
    "Primero confirmamos tu pago de $79 MXN y después recibes el material directamente por WhatsApp. 💙"
  ].join("\n");
}

function respuestaPrecio() {
  return [
    `💙 El ${PRODUCTO.nombre} tiene un precio único de $${DATOS_PAGO.precioPrincipal} MXN.`,
    "",
    "Incluye la colección principal y los bonos de la oferta:",
    "",
    `🎁 ${PRODUCTO.bonos[0]}`,
    `🎁 ${PRODUCTO.bonos[1]}`,
    "",
    cierrePago()
  ].join("\n");
}

function respuestaContenido() {
  return [
    "🥗 El Mega Pack reúne material práctico para darte más ideas y variedad:",
    "",
    "✅ Desayunos",
    "✅ Comidas",
    "✅ Cenas",
    "✅ Snacks y preparaciones prácticas",
    "",
    "🎁 Además incluye:",
    `✅ ${PRODUCTO.bonos[0]}`,
    `✅ ${PRODUCTO.bonos[1]}`,
    "",
    `Todo por $${DATOS_PAGO.precioPrincipal} MXN.`
  ].join("\n");
}

function respuestaUpsell() {
  return [
    `🎁 Después de tu compra principal puedes agregar el ${PRODUCTO.upsell.nombre} por $${PRODUCTO.upsell.precio} MXN.`,
    "",
    "Incluye 5 recursos adicionales:",
    "",
    ...PRODUCTO.upsell.recursos.map((r) => `✅ ${r}`),
    "",
    "Es completamente opcional y no sustituye el Mega Pack principal."
  ].join("\n");
}

function respuestaAportacion() {
  return [
    "💙 Primero quiero aclararte algo importante:",
    "",
    `El Mega Pack tiene un precio fijo de $${DATOS_PAGO.precioPrincipal} MXN y con ese pago recibes todo tu material.`,
    "",
    "Si además deseas apoyar voluntariamente el proyecto, lo agradecemos muchísimo.",
    "",
    "Cada guía requiere tiempo de investigación, organización y preparación, y ese apoyo nos permite seguir creando materiales que puedan ser útiles en el día a día de más personas.",
    "",
    `💖 $${DATOS_PAGO.aportacionesVoluntarias.gratitud} MXN — gesto de gratitud`,
    `💗 $${DATOS_PAGO.aportacionesVoluntarias.proyecto} MXN — apoyo al proyecto`,
    `💞 $${DATOS_PAGO.aportacionesVoluntarias.especial} MXN — apoyo especial`,
    "",
    "🙏 Es totalmente opcional. No necesitas aportar más para recibir tu compra."
  ].join("\n");
}

// ==========================================================
// RESPUESTAS DIRECTAS
// ==========================================================

function respuestaDirecta(mensajeOriginal) {
  const texto = normalizarTexto(mensajeOriginal);

  if (!texto) return null;

  // ========================================================
  // COMPROBANTE
  // ========================================================
  if (
    texto === "listo" ||
    contieneAlguna(texto, [
      "ya pague", "ya transferi", "ya deposite",
      "hice el pago", "hice la transferencia", "hice el deposito"
    ])
  ) {
    return [
      "Perfecto 💙",
      "",
      "Ahora sí, envíame la foto o captura completa de tu comprobante para continuar con la validación.",
      "",
      "En cuanto confirmemos tu pago, seguimos con la entrega de tu Mega Pack y sus bonos. 📲✨"
    ].join("\n");
  }

  // ========================================================
  // DISPARADORES EXACTOS DE MANYCHAT
  // ========================================================

  if (texto === "precio") {
    return [
      "💙 El Mega Pack completo tiene un precio único de $79 MXN.",
      "",
      "Incluye el material principal, recetas, guía de compras y los bonos de la oferta. 🥗📚",
      "",
      "Primero realizas tu pago y, una vez confirmado, te entregamos todo por WhatsApp.",
      "",
      "👇 Puedes continuar por transferencia bancaria o depósito en OXXO."
    ].join("\n");
  }

  if (texto === "contenido") {
    return [
      "🥗 Tu Mega Pack incluye:",
      "",
      "📘 Plan Integral de Alimentación",
      "🍽️ Recetario con desayunos, comidas, cenas y snacks",
      "🛒 Guía de Compras Inteligentes",
      "",
      "🎁 También recibes el Recetario de Postres Saludables y la Guía de Hábitos Saludables.",
      "",
      "💙 Todo por $79 MXN. Primero confirmamos tu pago y después te entregamos el paquete digital."
    ].join("\n");
  }

  if (texto === "pago") {
    return [
      "💙 El pago del Mega Pack es de $79 MXN.",
      "",
      "Puedes elegir:",
      "🏦 Transferencia bancaria",
      "🏪 Depósito en OXXO",
      "",
      "Después de pagar escribe LISTO ✅, espera mi respuesta y envía tu comprobante.",
      "",
      "📲 Una vez validado, te entregamos todo el material."
    ].join("\n");
  }

  if (texto === "entrega") {
    return [
      "📲 La entrega es digital por WhatsApp.",
      "",
      "Primero realizas tu pago de $79 MXN, escribes LISTO ✅ y envías tu comprobante.",
      "",
      "Cuando el pago quede confirmado, recibes tu Mega Pack y bonos en PDF. 💙"
    ].join("\n");
  }

  if (texto === "postres") {
    return [
      "🍰 Sí. Tu compra incluye un Recetario de Postres Saludables como bono.",
      "",
      "Así tendrás más ideas cuando quieras preparar algo diferente sin quedarte siempre con las mismas opciones. 💙",
      "",
      "🎁 Está incluido en los $79 MXN y se entrega junto con tu material después de confirmar el pago."
    ].join("\n");
  }

  if (texto === "frutas") {
    return [
      "🍎 Las frutas pueden formar parte de una alimentación organizada.",
      "",
      "El material te brinda ideas y orientación práctica, aunque las porciones adecuadas pueden variar según cada persona y las indicaciones de su profesional de salud.",
      "",
      "💙 El Mega Pack cuesta $79 MXN y lo recibes después de confirmar tu pago."
    ].join("\n");
  }

  if (texto === "comidas" || texto === "comida") {
    return [
      "🥗 Si una de tus dudas diarias es “¿qué preparo hoy?”, justamente para eso reunimos este material.",
      "",
      "Encontrarás ideas para desayunos, comidas, cenas y snacks para tener más variedad y organización. 📚",
      "",
      "💙 El Mega Pack completo cuesta $79 MXN. Primero realizas tu pago y después de validarlo te entregamos todo por WhatsApp."
    ].join("\n");
  }

  if (texto === "recetas") {
    return [
      "🍽️ Sí. Encontrarás recetas e ideas para desayunos, comidas, cenas, snacks y otras preparaciones.",
      "",
      "La intención es darte más opciones para que no tengas que recurrir siempre a las mismas comidas. 🥗✨",
      "",
      "📚 Todo está incluido en el Mega Pack de $79 MXN y se entrega después de confirmar tu pago."
    ].join("\n");
  }

  if (texto === "facil") {
    return [
      "😊 Sí. El material está organizado para consultarlo fácilmente desde tu celular.",
      "",
      "Puedes ir directamente a las recetas o secciones que necesites sin leer todo de principio a fin. 📲",
      "",
      "💙 La idea es hacer más práctica tu alimentación. El Mega Pack cuesta $79 MXN y se entrega después de validar el pago."
    ].join("\n");
  }

  if (texto === "beneficios") {
    return [
      "💙 El principal beneficio es tener más ideas y opciones para organizar tu alimentación sin preguntarte todos los días “¿qué preparo hoy?” 🥗",
      "",
      "Tendrás recursos para desayunos, comidas, cenas, snacks, postres y compras reunidos en un solo lugar. 📚✨",
      "",
      "🎁 Todo el Mega Pack está disponible por $79 MXN.",
      "",
      "Primero realizas tu pago y, una vez confirmado, te entregamos todo por WhatsApp.",
      "",
      "👇 Puedes continuar por transferencia o depósito en OXXO."
    ].join("\n");
  }

  // ========================================================
  // PAGAR DESPUÉS
  // ========================================================
  if (
    contieneAlguna(texto, [
      "pagar despues", "pago despues", "puedo pagar manana",
      "pagar manana", "mas tarde", "otro dia", "cuando tenga dinero"
    ])
  ) {
    return respuestaPagoPosterior();
  }

  // ========================================================
  // PRECIO — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "precio", "costo", "cuanto cuesta", "cuanto vale",
      "79 pesos", "cuanto pago", "cuanto debo pagar"
    ])
  ) {
    return [
      "💙 El Mega Pack completo tiene un precio único de $79 MXN.",
      "",
      "Por ese precio recibes el material principal con ideas para organizar tus comidas, recetas y recursos prácticos, además de tus bonos. 🥗📚",
      "",
      "Primero realizas tu pago y, una vez confirmado, te entregamos todo el material digital por WhatsApp.",
      "",
      "👇 Puedes pagar por transferencia bancaria o depósito en OXXO."
    ].join("\n");
  }

  // ========================================================
  // CONTENIDO — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "contenido", "que incluye", "que contiene",
      "que trae", "mega pack", "que voy a recibir"
    ])
  ) {
    return [
      "🥗 El Mega Pack reúne en un solo lugar recursos para que tengas más opciones y menos dudas al organizar tu alimentación.",
      "",
      "📘 Plan Integral de Alimentación",
      "🍽️ Recetario con ideas para desayunos, comidas, cenas y snacks",
      "🛒 Guía de Compras Inteligentes",
      "",
      "🎁 Además incluye un Recetario de Postres Saludables y una Guía de Hábitos Saludables.",
      "",
      "💙 Todo el paquete cuesta $79 MXN. Después de confirmar tu pago te entregamos el material digital por WhatsApp."
    ].join("\n");
  }

  // ========================================================
  // PAGO — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "pago", "como pago", "formas de pago", "metodos de pago",
      "metodo de pago", "quiero pagar"
    ])
  ) {
    return [
      "💙 Puedes realizar el pago de $79 MXN de la forma que te resulte más cómoda:",
      "",
      "🏦 Transferencia bancaria",
      "🏪 Depósito en OXXO",
      "",
      "Después de pagar, envíame primero la palabra LISTO ✅, espera mi respuesta y enseguida manda tu comprobante.",
      "",
      "📲 Una vez validado, continuamos con la entrega de todo tu material."
    ].join("\n");
  }

  // ========================================================
  // ENTREGA — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "entrega", "como lo recibo", "cuando lo recibo",
      "es digital", "es pdf", "archivo pdf", "donde lo recibo"
    ])
  ) {
    return [
      "📲 Todo el Mega Pack es digital y se entrega en formato PDF directamente por WhatsApp.",
      "",
      "La dinámica es sencilla: primero realizas tu pago de $79 MXN, envías LISTO ✅ y tu comprobante; después de validarlo te entregamos el material y los bonos.",
      "",
      "💙 Así puedes guardarlo en tu celular y consultarlo cuando lo necesites."
    ].join("\n");
  }

  // ========================================================
  // POSTRES — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "postres", "incluye postres", "recetas de postres",
      "recetario de postres", "algo dulce"
    ])
  ) {
    return [
      "🍰 Sí. La oferta incluye un Recetario de Postres Saludables como bono.",
      "",
      "La idea es que también tengas alternativas cuando quieras preparar algo diferente y no sentir que cuidar tu alimentación significa renunciar por completo a los postres. 💙",
      "",
      "🎁 El bono viene incluido dentro de tu compra de $79 MXN y se entrega después de confirmar el pago."
    ].join("\n");
  }

  // ========================================================
  // FRUTAS — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "frutas", "que frutas puedo comer", "puedo comer fruta",
      "platano", "mango", "uvas", "manzana"
    ])
  ) {
    return [
      "🍎 Sí, las frutas pueden formar parte de una alimentación organizada.",
      "",
      "El material te ayuda a tener más orientación e ideas para elegir y combinar tus alimentos, pero las porciones adecuadas pueden variar según cada persona y las indicaciones de su profesional de salud.",
      "",
      "💙 Si lo que buscas es dejar de sentir que todo está prohibido y tener más opciones para organizarte, el Mega Pack puede servirte como recurso práctico. Está disponible por $79 MXN."
    ].join("\n");
  }

  // ========================================================
  // COMIDAS — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "comidas", "comida", "que puedo comer", "que preparo",
      "desayunos", "cenas", "snacks", "tortilla", "pan", "arroz"
    ])
  ) {
    return [
      "🥗 Justamente uno de los objetivos del material es ayudarte cuando aparece la pregunta: “¿qué preparo hoy?”",
      "",
      "Encontrarás ideas para desayunos, comidas, cenas y snacks, para que tengas más variedad y puedas organizar mejor tus opciones del día a día. 📚",
      "",
      "💙 No se trata de decir que un alimento está prohibido para todos; las porciones dependen de cada persona.",
      "",
      "El Mega Pack completo cuesta $79 MXN y lo recibes después de confirmar tu pago."
    ].join("\n");
  }

  // ========================================================
  // RECETAS — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "recetas", "ingredientes", "cocinar",
      "recetas faciles", "ingredientes faciles"
    ])
  ) {
    return [
      "🍽️ Sí. El Mega Pack incluye recetas e ideas para desayunos, comidas, cenas, snacks y otras preparaciones.",
      "",
      "Buscamos que tengas alternativas para no caer siempre en las mismas comidas y puedas elegir las preparaciones que mejor se adapten a ti. 🥗✨",
      "",
      "📚 Todo forma parte del paquete digital de $79 MXN.",
      "",
      "Después de confirmar tu pago te entregamos el material por WhatsApp."
    ].join("\n");
  }

  // ========================================================
  // FÁCIL — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "facil", "es facil", "es dificil", "como se usa",
      "puedo entenderlo", "es complicado", "principiante"
    ])
  ) {
    return [
      "😊 Sí. El material está organizado para que puedas consultarlo de forma sencilla desde tu celular.",
      "",
      "No necesitas leer todo de principio a fin ni tener conocimientos de nutrición: puedes ir directamente a las recetas, ideas o secciones que necesites. 🥗📲",
      "",
      "💙 La intención es hacer más práctica tu alimentación, no complicarla.",
      "",
      "Puedes obtener el Mega Pack completo por $79 MXN; primero confirmamos tu pago y después te entregamos todo."
    ].join("\n");
  }

  // ========================================================
  // BENEFICIOS — DISPARADOR MANYCHAT
  // ========================================================
  if (
    contieneAlguna(texto, [
      "beneficios", "para que sirve", "que aprendere",
      "me sirve", "vale la pena"
    ])
  ) {
    return [
      "💙 El principal beneficio es que tendrás más ideas y opciones para organizar tu alimentación, sin estar preguntándote todos los días “¿qué preparo hoy?” 🥗",
      "",
      "Encontrarás recursos para desayunos, comidas, cenas, snacks, postres y compras, reunidos en un solo lugar para que puedas consultarlos cuando los necesites. 📚✨",
      "",
      "🎁 Todo el Mega Pack está disponible por solo $79 MXN.",
      "",
      "Primero realizas tu pago y, una vez confirmado, te entregamos todo el material digital por WhatsApp.",
      "",
      "👇 Puedes continuar por transferencia o depósito en OXXO."
    ].join("\n");
  }

  // ========================================================
  // APORTACIÓN VOLUNTARIA
  // ========================================================
  if (
    contieneAlguna(texto, [
      "aportacion", "aportacion voluntaria", "apoyo voluntario",
      "quiero apoyar", "quiero aportar", "puedo dar mas",
      "80 pesos", "100 pesos", "150 pesos"
    ])
  ) {
    return respuestaAportacion();
  }

  // ========================================================
  // DATOS DE TRANSFERENCIA
  // ========================================================
  if (
    contieneAlguna(texto, [
      "transferencia", "clabe", "cuenta", "datos bancarios",
      "datos de transferencia", "donde transfiero"
    ])
  ) {
    return respuestaCuenta();
  }

  // ========================================================
  // OXXO
  // ========================================================
  if (
    contieneAlguna(texto, [
      "oxxo", "deposito en oxxo", "pagar en oxxo",
      "ticket de oxxo", "qr de oxxo"
    ])
  ) {
    return respuestaOxxo();
  }

  // ========================================================
  // UPSELL $70
  // ========================================================
  if (
    contieneAlguna(texto, [
      "pack complementario", "70 pesos", "paquete adicional",
      "producto adicional", "jugos y batidos",
      "registro de glucometrias", "resistencia a la insulina"
    ])
  ) {
    return respuestaUpsell();
  }

  return null;
}

// ==========================================================
// RUTAS
// ==========================================================

app.get("/", (req, res) => {
  return res
    .status(200)
    .send("Bot ventas activo ✅");
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    servicio: "VICA SYSTEMS",
    funnel: "prepago",
    precio: DATOS_PAGO.precioPrincipal,
    puerto: PORT
  });
});

app.post("/mensaje", async (req, res) => {
  try {
    // Compatible con el formato actual y variantes comunes de ManyChat.
    const mensaje =
      req.body?.texto ??
      req.body?.mensaje ??
      req.body?.message ??
      req.body?.text ??
      req.body?.data?.texto ??
      req.body?.data?.mensaje ??
      req.body?.data?.message ??
      req.body?.data?.text ??
      "";

    const valorMensaje =
      typeof mensaje === "object"
        ? (
            mensaje?.text ??
            mensaje?.texto ??
            mensaje?.message ??
            mensaje?.mensaje ??
            ""
          )
        : mensaje;

    const textoUsuario =
      String(valorMensaje ?? "").trim();

    console.log(
      "Mensaje recibido:",
      textoUsuario
    );

    if (!textoUsuario) {
      return res.json({
        respuesta: [
          "Estoy aquí para ayudarte 😊",
          "",
          "Puedes escribirme tu duda sobre el Mega Pack, el pago o la entrega."
        ].join("\n")
      });
    }

    const directa =
      respuestaDirecta(textoUsuario);

    if (directa) {
      const respuestaFinal =
        limpiarRespuesta(directa);

      console.log(
        "Respuesta directa enviada:",
        respuestaFinal
      );

      return res.json({
        respuesta: respuestaFinal
      });
    }

    const response =
      await openai.responses.create({
        model: "gpt-4.1-mini",

        temperature: 0.4,

        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: SYSTEM_PROMPT
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: textoUsuario
              }
            ]
          }
        ]
      });

    const respuestaIA =
      response.output_text || "";

    const respuestaFinal =
      respuestaIA.trim()
        ? agregarCierre(respuestaIA)
        : [
            "Con gusto te ayudo 😊",
            "",
            cierrePago()
          ].join("\n");

    console.log(
      "Respuesta enviada:",
      respuestaFinal
    );

    return res.json({
      respuesta: respuestaFinal
    });
  } catch (error) {
    console.error(
      "Error en /mensaje:",
      error
    );

    return res.json({
      respuesta: [
        "Con mucho gusto te ayudo 😊",
        "",
        cierrePago()
      ].join("\n")
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});
