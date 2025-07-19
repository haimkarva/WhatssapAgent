const {
  default: makeWASocket,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { handleMessage } = require("./handlers/messageHandler");
const { getJoinedGroupsAndSave } = require("./utils/fetchGroups");

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    process.env.WA_AUTH_FOLDER || "auth"
  );

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: "silent" }),
    browser: ["MyBot", "Chrome", "1.0.0"],
    getMessage: async () => null,
  });

  sock.ev.on("creds.update", saveCreds);

  // ✅ נמתין לחיבור מלא לפני שליפת קבוצות
  sock.ev.on("connection.update", async ({ connection }) => {
    if (connection === "open") {
      console.log("✅ חיבור ל־WhatsApp נוצר בהצלחה");
      await getJoinedGroupsAndSave(sock); // force = false
    }
  });

  // ✅ פקודת רענון קבוצות מהודעת טקסט
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    if (text?.trim() === "!refreshGroups") {
      await getJoinedGroupsAndSave(sock, true); // force = true
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🔄 רשימת הקבוצות עודכנה ונשמרה מחדש.",
      });
      return;
    }

    await handleMessage(sock, msg);
  });
}

module.exports = { startWhatsApp };
