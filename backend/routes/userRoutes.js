const { getUsers, getUserById } = require("../controllers/userController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

const express = require("express")

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.get("/:id", protect, getUserById);
// router.delete("/:id", protect,adminOnly , deleteUSer)

module.exports = router;
