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

Contenido general:
- Ideas para desayunos.
- Ideas para comidas.
- Ideas para cenas.
- Snacks.
- Recetas prácticas.
- Recursos para tener más variedad y organización en la alimentación.

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

  if (!texto) {
    return null;
  }

  // --------------------------------------------------------
  // LISTO / COMPROBANTE
  // --------------------------------------------------------

  if (
    texto === "listo" ||
    contieneAlguna(texto, [
      "ya pague",
      "ya transferi",
      "ya deposite",
      "hice el pago",
      "hice la transferencia",
      "hice el deposito",
      "voy a mandar comprobante",
      "mandar comprobante",
      "enviar comprobante"
    ])
  ) {
    return [
      "Perfecto 💙",
      "",
      "Ahora sí, envíame la foto o captura completa de tu comprobante para continuar con la validación."
    ].join("\n");
  }

  // --------------------------------------------------------
  // PAGAR DESPUÉS
  // Debe evaluarse antes de la intención genérica de pago.
  // --------------------------------------------------------

  const preguntaPagoPosterior =
    contieneAlguna(texto, [
      "pagar despues",
      "pago despues",
      "depositar despues",
      "transferir despues",
      "hacerlo despues",
      "puedo hacerlo despues",
      "puedo pagar manana",
      "pagar manana",
      "pago manana",
      "depositar manana",
      "transferir manana",
      "lo hago manana",
      "mas tarde",
      "otro dia",
      "la proxima semana",
      "cuando tenga dinero"
    ]) ||
    texto === "despues" ||
    texto === "manana";

  if (preguntaPagoPosterior) {
    return respuestaPagoPosterior();
  }

  // --------------------------------------------------------
  // APORTACIÓN VOLUNTARIA
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "quiero apoyar",
      "quiero aportar",
      "aportacion",
      "aportacion voluntaria",
      "apoyo voluntario",
      "puedo dar mas",
      "puedo pagar mas",
      "80 pesos",
      "100 pesos",
      "150 pesos",
      "apoyar el proyecto"
    ])
  ) {
    return respuestaAportacion();
  }

  // --------------------------------------------------------
  // DATOS BANCARIOS
  // --------------------------------------------------------

  const preguntaCuenta =
    contieneAlguna(texto, [
      "numero de cuenta",
      "numero para depositar",
      "numero para transferir",
      "datos bancarios",
      "datos de transferencia",
      "cuenta bancaria",
      "a que cuenta",
      "en que cuenta",
      "donde transfiero",
      "cual es la cuenta",
      "cual cuenta",
      "pasame la cuenta",
      "mandame la cuenta",
      "clave interbancaria",
      "clabe"
    ]) ||
    texto === "cuenta";

  if (preguntaCuenta) {
    return respuestaCuenta();
  }

  // --------------------------------------------------------
  // OXXO
  // --------------------------------------------------------

  const preguntaOxxo =
    contieneAlguna(texto, [
      "deposito en oxxo",
      "depositar en oxxo",
      "pagar en oxxo",
      "pago en oxxo",
      "como pago en oxxo",
      "como deposito en oxxo",
      "codigo de oxxo",
      "qr de oxxo",
      "ticket de oxxo"
    ]) ||
    texto === "oxxo";

  if (preguntaOxxo) {
    return respuestaOxxo();
  }

  // --------------------------------------------------------
  // PRECIO PRINCIPAL
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "cuanto cuesta",
      "cuanto vale",
      "que precio",
      "precio",
      "costo",
      "79 pesos",
      "cuanto pago",
      "cuanto deposito",
      "cuanto transfiero",
      "cuanto debo pagar"
    ])
  ) {
    return respuestaPrecio();
  }

  // --------------------------------------------------------
  // CONTENIDO
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "que incluye",
      "que contiene",
      "que trae",
      "contenido",
      "mega pack",
      "que voy a recibir"
    ])
  ) {
    return respuestaContenido();
  }

  // --------------------------------------------------------
  // FORMAS DE PAGO
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "como pago",
      "formas de pago",
      "metodos de pago",
      "metodo de pago",
      "quiero pagar"
    ])
  ) {
    return cierrePago();
  }

  // --------------------------------------------------------
  // ENTREGA / PDF
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "es fisico",
      "producto fisico",
      "es digital",
      "es pdf",
      "archivo pdf",
      "como lo recibo",
      "cuando lo recibo",
      "donde lo recibo",
      "como se entrega",
      "entrega",
      "envio",
      "domicilio"
    ])
  ) {
    return respuestaEntrega();
  }

  // --------------------------------------------------------
  // BONOS / POSTRES
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "bonos",
      "postres",
      "incluye postres",
      "recetas de postres",
      "habitos saludables"
    ])
  ) {
    return [
      "🎁 Sí. La oferta incluye:",
      "",
      `🍰 ${PRODUCTO.bonos[0]}`,
      `🌱 ${PRODUCTO.bonos[1]}`,
      "",
      "Se entregan junto con tu material después de confirmar el pago."
    ].join("\n");
  }

  // --------------------------------------------------------
  // UPSELL / PACK DE $70
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "pack complementario",
      "70 pesos",
      "otro pack",
      "paquete adicional",
      "producto adicional",
      "jugos y batidos",
      "registro de glucometrias",
      "resistencia a la insulina"
    ])
  ) {
    return respuestaUpsell();
  }

  // --------------------------------------------------------
  // FRUTAS
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "frutas",
      "que frutas puedo comer",
      "puedo comer fruta"
    ])
  ) {
    return [
      "🍎 Las frutas pueden formar parte de una alimentación equilibrada.",
      "",
      "La cantidad y elección adecuada puede variar según cada persona, sus medicamentos y las indicaciones de su profesional de salud."
    ].join("\n");
  }

  // --------------------------------------------------------
  // TORTILLA, PAN Y ARROZ
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "tortilla",
      "arroz",
      "pan"
    ])
  ) {
    return [
      "💙 No se trata de prohibir alimentos de forma general.",
      "",
      "Las porciones y combinaciones adecuadas pueden variar según cada persona. Si tienes una indicación médica específica, conviene seguirla."
    ].join("\n");
  }

  // --------------------------------------------------------
  // RECETAS / INGREDIENTES
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "recetas",
      "ingredientes",
      "cocinar",
      "son faciles",
      "son dificiles"
    ])
  ) {
    return [
      "🥗 El material reúne distintas recetas e ideas para ayudarte a tener más opciones en desayunos, comidas, cenas y snacks.",
      "",
      "Encontrarás preparaciones de diferentes niveles de dificultad para que puedas elegir las que mejor se adapten a ti."
    ].join("\n");
  }

  // --------------------------------------------------------
  // FACILIDAD DE USO
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "es facil",
      "es dificil",
      "como se usa",
      "puedo entenderlo"
    ])
  ) {
    return [
      "😊 El material está organizado para que puedas consultarlo de forma práctica desde tu celular.",
      "",
      "Puedes ir directamente a la sección o receta que necesites sin tener que leer todo de principio a fin."
    ].join("\n");
  }

  // --------------------------------------------------------
  // BENEFICIOS
  // --------------------------------------------------------

  if (
    contieneAlguna(texto, [
      "beneficios",
      "para que sirve",
      "que aprendere"
    ])
  ) {
    return [
      "💙 El objetivo del material es darte más ideas, variedad y organización al momento de preparar tus alimentos.",
      "",
      "No sustituye la orientación de tu médico o nutriólogo."
    ].join("\n");
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

app.post("/mensaje", async (req, res) => {
  try {
    const mensaje =
      req.body?.texto ??
      req.body?.mensaje ??
      req.body?.message ??
      "";

    const textoUsuario =
      String(mensaje).trim();

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
      agregarCierre(respuestaIA);

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
