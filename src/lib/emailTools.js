//   **********************        CODE BY EJIROGHENE     ***********************     //

import sgMail from "@sendgrid/mail"

// SEND EMAIL FUNCTION
sgMail.setApiKey(process.env.SENDER_KEY) //
export const sendEmailToUser = async (emailRecipient, pdf , name) => {

	const msg = {
		to: emailRecipient,
		from: process.env.SENDER_EMAIL, // Use the email address or domain you verified above
		subject: 'Sending with Twilio SendGrid is Fun',
		text: 'and easy to do anywhere, even with Node.js',
		html: '<strong>and easy to do anywhere, even with Node.js</strong>',
		attachments: [
			{
			  content: pdf,
			  filename: `${name}.pdf`,
			  type: "application/pdf",
			  disposition: "attachment"
			}
		]
	};

	
	await sgMail.send(msg)
}

//   **********************        CODE BY EJIROGHENE     ***********************     //