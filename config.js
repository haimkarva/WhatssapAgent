require("dotenv").config();

module.exports = {
  sourceGroupId: process.env.SOURCE_GROUP_ID,
  myNumberId: process.env.MY_NUMBER_ID,
  keywords: process.env.KEYWORDS ? process.env.KEYWORDS.split(",") : [],
};
