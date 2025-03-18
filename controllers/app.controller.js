const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const appService = require("../services/app.service");
const { success } = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
require("../services/index");
const { makeLimitOffset } = require("../utils/pagination");
const aiService = require("../services/ai.service");
const geminiService = require("../services/gemini.service");

// const handleUserRequest = catchAsync(async (req, res) => {
//   const data = await geminiService.queryProducts(req.body.query);
//   res.status(httpStatus.OK).send(success({ ...data }));
// });
// const getConversations = catchAsync(async (req, res) => {
//   const data = await appService.getConversations();
//   res.status(httpStatus.OK).send(success(data));
// });

// const deleteConversation = catchAsync(async (req, res) => {
//   const data = await appService.deleteConversation();
//   res.status(httpStatus.OK).send(success(data));
// });

const generateCard = catchAsync(async (req, res) => {
  const data = await geminiService.generateCard(req.body);
  res.status(httpStatus.OK).send(success(data));
});
module.exports = {
  generateCard,
};
