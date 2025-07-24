require("dotenv").config();

module.exports = {
  allowedGroupIds: process.env.ALLOWED_GROUP_IDS,
  myNumberId: process.env.MY_NUMBER_ID,
  keywords: process.env.KEYWORDS ? process.env.KEYWORDS.split(",") : [],
};
