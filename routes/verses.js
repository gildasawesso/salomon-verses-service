const express = require('express');
const path = require('path');
var router = express.Router();
let verseService = require('../services/verses.service');
let docxService = require('../services/docx.service');
let mailService = require('../services/mail.service');

router.post('/generate/:language', async (req, res) => {
  const language = req.params.language === "1" ? "french": "english";
  let verses = req.body.verses;
  try {
    let versesAsText = await verseService.generate(verses, language);
    await docxService.generateDocx(versesAsText);
    await res.json(versesAsText);
  } catch(err) {
    res.status(400);
    console.error(err);
    await res.json(err);
  }
});

router.post('/sendmail', async (req, res) => {
  let receiver = req.body.email;
  try {
    const attachements = [
      {
        filename: "Verses",
        path: `${path.resolve()}/documents/verses.docx`,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    ];
   let result = await mailService.sendMail(attachements, receiver);
    res.json(result);
  } catch(err) {
    console.error(err);
    res.status(400);
    res.json(err);
  }
});

module.exports = router;
