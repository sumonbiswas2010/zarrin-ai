const sequelize = require("sequelize");
const { Op } = sequelize;
const ApiError = require("../utils/ApiError");
const { Conversation, SearchProduct } = require("../models");

const getConversations = async (limit, offset) => {
  try {
    const conversations = await Conversation.findAll({
      order: [["id", "ASC"]],
      include: [SearchProduct],
    });
    const final = [];
    conversations.forEach((conversation) => {
      if (
        conversation.task === "refineQuery" &&
        conversation.role === "model" &&
        !conversation?.parts?.[0].text?.falseQuery
      ) {
      } else {
        let isGhapla =
          conversation.role === "model" && conversation.task === "salesAgent";
        const isString = typeof conversation.parts[0].text === "string";
        const isBot = conversation.role !== "user";
        const searchProducts = conversation.search_product;
        const temp = isString
          ? {
              id: conversation.id,
              role: conversation.role,
              task: conversation.task,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
              text: conversation?.parts?.[0].text,
              isBot,
              tips: isGhapla ? conversation?.parts?.[0].text : undefined,
              searchProducts,
            }
          : {
              id: conversation.id,
              role: conversation.role,
              task: conversation.task,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
              ...conversation?.parts?.[0].text,
              searchProducts,
              isBot,
            };

        final.push(temp);
      }
    });
    return final;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw new ApiError(-1, error.message);
  }
};
const deleteConversation = async () => {
  try {
    const del1 = await SearchProduct.destroy({ where: {} });
    const del2 = await Conversation.destroy({ where: {} });
    if (!del2) throw new ApiError(-1, "Nothing To Delete");
    return true;
  } catch (err) {
    console.log("Error deleting conversations:", err);
    throw new ApiError(-1, err.message);
  }
};
module.exports = {
  getConversations,
  deleteConversation,
};
