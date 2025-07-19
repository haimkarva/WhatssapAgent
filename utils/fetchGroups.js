const fs = require("fs");
const path = require("path");

/**
 * שומר את כל הקבוצות שהבוט חבר בהן לקובץ chats.json
 * @param {WASocket} sock - מופע ה־socket של הבוט
 * @param {boolean} force - האם ליצור מחדש את הקובץ גם אם הוא כבר קיים
 */
async function getJoinedGroupsAndSave(sock, force = false) {
  try {
    const outputPath = path.join(__dirname, "../chats.json");

    // אם הקובץ כבר קיים ולא רוצים להכריח – לא נבצע שמירה
    if (!force && fs.existsSync(outputPath)) {
      console.log("ℹ️ הקובץ chats.json כבר קיים – לא נוצר מחדש.");
      return;
    }

    // שליפת כל הקבוצות שהבוט חבר בהן
    const chats = await sock.groupFetchAllParticipating();
    const groupsList = Object.entries(chats).map(([id, group]) => ({
      id,
      name: group.subject,
    }));

    // כתיבה לקובץ JSON
    fs.writeFileSync(outputPath, JSON.stringify(groupsList, null, 2), "utf-8");
    console.log(`✅ נשמרו ${groupsList.length} קבוצות לקובץ chats.json`);
  } catch (err) {
    console.error("❌ שגיאה בשליפת הקבוצות:", err.message);
  }
}

module.exports = { getJoinedGroupsAndSave };
