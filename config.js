exports.mail = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  // requireTLS: true,
  auth: {
    user: "wciptech@gmail.com",
    pass: "wciptech"
  },
  // authMethod: "login"
}

exports.oauth2Info = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUrl: "https://developers.google.com/oauthplayground",
  refreshToken: process.env.REFRESH_TOKEN
}