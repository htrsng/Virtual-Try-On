const { Router } = require("express");
const { authenticateToken, requireDbReady } = require("../middleware");
const { listAddresses, addAddress, updateAddress } = require("../controllers/addresses.controller");

const router = Router();
router.get("/", authenticateToken, requireDbReady, listAddresses);
router.post("/", authenticateToken, requireDbReady, addAddress);
router.put("/:addressId", authenticateToken, requireDbReady, updateAddress);
module.exports = router;
