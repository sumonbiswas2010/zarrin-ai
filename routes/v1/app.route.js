const express = require("express");
const tokenValidation = require("../../validations/token.validation");
const appController = require("../../controllers/app.controller.js");
const appValidation = require("../../validations/app.validation");

const router = express.Router();

// router.post("/find_product", appController.handleUserRequest);
// router.get("/conversations", appController.getConversations);
// router.delete("/conversation/", appController.deleteConversation);

router.post("/generate/", appController.generateCard);

module.exports = router;
