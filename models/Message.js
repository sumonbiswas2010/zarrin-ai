const { Sequelize, Op } = require("sequelize");
const db = require("../config/sequelize.config");
const User = require("./User");
const Channel = require("./Channel");
const sq = require("sequelize");

const Message = db.define(
  "message",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    channel_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    ts: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    client_msg_id: {
      type: Sequelize.STRING,
      unique: true,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    sub_type: {
      type: Sequelize.STRING,
    },
    text: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    reply_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    latest_reply: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    hasNewReply: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    files:{
      type: Sequelize.JSON,
      allowNull: true,
    }
  },
  {
    hooks: {
      beforeBulkCreate: async (messages, options) => {
        // Get all ts values from incoming messages
        const tsValues = messages.map((msg) => msg.ts);

        // Fetch existing messages with the same ts from the database
        const existingMessages = await Message.findAll({
          attributes: ["ts", "latest_reply"],
          where: { ts: { [Op.in]: tsValues } },
        });

        // Create a map of existing messages by ts for quick lookup
        const existingMessagesMap = new Map(
          existingMessages.map((msg) => [msg.ts, msg])
        );

        // Compare current and previous values
        messages.forEach((message) => {
          const existingMessage = existingMessagesMap.get(message.ts);
          if (existingMessage) {
            // Compare `latest_reply` values
            if (existingMessage.latest_reply !== message.latest_reply) {
              message.hasNewReply = true;
            } else {
              message.hasNewReply = false;
            }
          } else {
            // If no existing message, it's a new entry
            message.hasNewReply = message.reply_count ? true : false;
          }
        });
      },
    },
  }
);
Message.belongsTo(User, { foreignKey: "user_id", as: "sender" });
Message.belongsTo(Channel, { foreignKey: "channel_id" });
User.hasMany(Message, { foreignKey: "user_id" });
Channel.hasMany(Message, { foreignKey: "channel_id" });
// Message.sync({ alter: true });
module.exports = Message;
