const fs = require("fs");
const path = require("path");
const config = require("../config");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const LOG_PATH = path.join(__dirname, "../sentMessages.json");

let sentMessages = [];
if (fs.existsSync(LOG_PATH)) {
  sentMessages = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
}

function saveLog() {
  fs.writeFileSync(LOG_PATH, JSON.stringify(sentMessages, null, 2));
}

function includesKeywords(text, keywords) {
  return keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()));
}

function extractText(msg) {
  const m = msg.message;
  if (!m) return null;

  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return m.imageMessage.caption;
  if (m.videoMessage?.caption) return m.videoMessage.caption;
  if (m.documentMessage?.caption) return m.documentMessage.caption;
  if (m.buttonsMessage?.contentText) return m.buttonsMessage.contentText;

  return null;
}

function hasDateWithin7Days(text) {
  const regex = /\b(\d{1,2})[./-](\d{1,2})\b/g;
  const matches = [...text.matchAll(regex)];
  const today = new Date();
  const currentYear = today.getFullYear();

  for (const match of matches) {
    const [_, dayStr, monthStr] = match;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);

    let eventDate = new Date(currentYear, month - 1, day);
    if (eventDate < today.setHours(0, 0, 0, 0)) {
      eventDate = new Date(currentYear + 1, month - 1, day); // שנה הבאה
    }

    const diffInDays = (eventDate - new Date()) / (1000 * 60 * 60 * 24);
    if (diffInDays >= 0 && diffInDays <= 7) {
      return true;
    }
  }

  return false;
}

// ✅ שליחת נוכחות כדי להבטיח הצפנה מול קבוצת היעד
async function ensureSession(sock, jid) {
  try {
    await sock.sendPresenceUpdate("available", jid);
    await sock.presenceSubscribe(jid);
  } catch (err) {
    console.error("⚠️ שגיאה ב־ensureSession:", err.message);
  }
}

async function handleMessage(sock, msg) {
  try {
    const from = msg.key.remoteJid;
    if (from !== config.sourceGroupId) return;
    if (msg.key.fromMe) return;

    const messageType = Object.keys(msg.message || {})[0];
    const message = msg.message?.[messageType];
    const contentText = extractText(msg);
    if (!contentText) return;

    const keyWords = config.keywords;
    let hasKeyword;
    if (keyWords.length !== 0) {
      hasKeyword = includesKeywords(contentText, config.keywords);
    }
    const hasValidDate = hasDateWithin7Days(contentText);
    console.log(contentText);
    if (!hasKeyword && !hasValidDate) {
      console.log("⛔ לא נמצאו גם מילות מפתח וגם תאריך בטווח 7 ימים");
      return;
    }

    if (!hasValidDate) {
      console.log("⛔ תאריך לא בטווח של 7 ימים");
      return;
    }
    if (sentMessages.includes(contentText)) {
      console.log("⛔ הודעה כפולה - לא נשלחת שוב");
      return;
    }

    // 📡 ודא session עם קבוצת היעד
    await ensureSession(sock, config.myNumberId);

    if (
      ["imageMessage", "videoMessage", "audioMessage"].includes(messageType) &&
      message
    ) {
      const mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
      await sock.sendMessage(config.myNumberId, {
        [messageType.replace("Message", "")]: mediaBuffer,
        caption: contentText,
        mimetype: message.mimetype,
      });
    } else {
      await sock.sendMessage(config.myNumberId, { text: contentText });
    }

    console.log("✅ הודעה נשלחה אליך ישירות");
    sentMessages.push(contentText);
    saveLog();
  } catch (err) {
    console.error("❌ שגיאה בטיפול בהודעה:", err.message);
  }
}

module.exports = { handleMessage };
