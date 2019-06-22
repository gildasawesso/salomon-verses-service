const nodemailer = require('nodemailer');
const config = require('../config');
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  config.oauth2Info.clientId,
  config.oauth2Info.clientSecret,
  config.oauth2Info.redirectUrl
);

oauth2Client.setCredentials({
  refresh_token: config.oauth2Info.refreshToken
});

async function sendMail(attachements, receiver) {

  const tokens = await oauth2Client.refreshAccessToken()
  const accessToken = tokens.credentials.access_token

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "wciptech@gmail.com",
      clientId: config.oauth2Info.clientId,
      clientSecret: config.oauth2Info.clientSecret,
      refreshToken: config.oauth2Info.refreshToken,
      accessToken: accessToken
    }
  });

  try {
    const result = await transporter.sendMail({
      from: '"WCIP Technical Unit 😀" <wciptech@gmail.com>',
      to: receiver,
      subject: "Versés",
      text: "Test verses",
      attachments: attachements
    });
    transporter.close();
    return result;
  } catch (err) {
    console.error(err);
    transporter.close();
    return err;
  }

}

exports.sendMail = sendMail;
