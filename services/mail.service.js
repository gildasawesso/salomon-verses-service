const nodemailer = require('nodemailer');
const config = require('../config');

async function sendMail(attachements, receiver) {
  let transporter = nodemailer.createTransport(config.mail);
  try {
    const result = await transporter.sendMail({
      from: '"WCIP Technical Unit 😀" <wciptech@gmail.com>',
      to: receiver,
      subject: "Versés",
      text: "Test verses",
      attachments: attachements
    });
    return result;
  } catch(err) {
    console.error(err);
    return err;
  }
  
}

exports.sendMail = sendMail;
