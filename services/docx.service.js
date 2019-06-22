const docx = require('docx');
const fs = require('fs');
const path = require('path');

const styles = {
  TITLE: "exTitleStyle",
  BODY: "exBodyStyle"
}

async function generateDocx(document) {
  let doc = new docx.Document();

  document.forEach((verse, index) => {
    const paragraph = new docx.Paragraph();
    paragraph.spacing({line: 300});
    let title = new docx.TextRun(verse.verseTitle)
    .bold()
    .size(32)
    .font('Calibri')
    .color("2e6dc5");

    if (index != 0) title.break();
    paragraph.addRun(title);

    verse.verseBody.forEach(v => {
      const body = new docx.TextRun(v);
      body.break();
      body.size(28)
      .font('Calibri');
      paragraph.addRun(body)
    });

    doc.addParagraph(paragraph);
  });

  let packer = new docx.Packer();
  let buffer = await packer.toBuffer(doc);
  fs.writeFileSync(`${path.resolve()}/documents/verses.docx`, buffer);
}

exports.generateDocx = generateDocx;