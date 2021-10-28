import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDER_KEY) // Do not forget this and double check that process.env.SENDGRID_KEY is NOT undefined
console.log(process.env.SENDER_KEY)
console.log(process.env.SENDER_EMAIL)

export const sendRegistrationEmail = async recipientAddress => {
    console.log({recipientAddress})
  const msg = {
    to: recipientAddress,
    from: process.env.SENDER_EMAIL,
    subject: "Sending with Twilio SendGrid is Fun",
    text: "and easy to do anywhere, even with Node.js",
    html: "<strong>and easy to do anywhere, even with Node.js</strong>",
  }

  await sgMail.send(msg)
}