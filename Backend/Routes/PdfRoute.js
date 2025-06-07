
const {Router} = require("express");
const { GeneratePdf } =require("../Controllers/pdf.controller.js") 

const router = Router();

router.post("/generate-pdf",GeneratePdf);

module.exports = router