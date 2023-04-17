const dotenv = require("dotenv")
dotenv.config()
const nodemailer = require("nodemailer")

/* nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error(`Failed to create a testing account. ${err.message}`)
    }

    console.log(`Credentials obtained, sending message...`)

    let transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
            user: account.user,
            pass: account.pass
        }
    })

    let message = {
        from: `Sender Name <sender@example.com`,
        to: `Recipient <recipient@example.com>`,
        subject: `Nodemailer is unicode friendly ✔`,
        text: `Hello to myself`,
        html: `<p><b>Hello</b> to myself!!!</p>`
    }

    transporter.sendMail(message, (err, info) => {
        if (err) {
            console.log(`Error occurred. ${err.message}`)
            return process.exit(1)
        }

        console.log(`Message sent ${info.messageId}`)
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    })
}) */

const dummyMessage = {
    from: `Sender Name <sender@example.com`,
    to: `Recipient <recipient@example.com>`,
    subject: `Email from Node Server`,
    text: `Hello to myself, again, from Node Server`,
    html: `
        <div>
            <h1>Hello</h1>
            <p>Hope you're having a good morning! :)<p>
        </div>`,
    amp: `<!doctype html>
        <html ⚡4email>
        <head>
            <meta charset="utf-8">
            <style amp4email-boilerplate>body{visibility:hidden}</style>
            <script async src="https://cdn.ampproject.org/v0.js"></script>
            <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
        </head>
        <body>
            <p>Image: <amp-img src="https://cldup.com/P0b1bUmEet.png" width="16" height="16"/></p>
            <p>GIF (requires "amp-anim" script in header):<br/>
            <amp-anim src="https://cldup.com/D72zpdwI-i.gif" width="500" height="350"/></p>
        </body>
        </html>`
}

const testMessage = {
    from: process.env.PRODUCTION_EMAIL_ADDRESS,
    to: process.env.PRODUCTION_EMAIL_RECIPIENT,
    subject: `Test message from Nodemailer`,
    text: `Hello to myself, from NodeMailer!`,
    html: `
        <div>
            <h1>Hello</h1>
            <p>Trying to type HTML in a string is frustrating<p>
        </div>`,
    amp: `<!doctype html>
        <html ⚡4email>
        <head>
            <meta charset="utf-8">
            <style amp4email-boilerplate>body{visibility:hidden}</style>
        </head>
        <body>
            <h1>Hello World!</h1>
        </body>
        </html>`
}

let mailConfig
let message

if (process.env.NODE_ENV === 'test' ) {
    mailConfig = {
        host: process.env.TESTING_EMAIL_HOST,
        port: process.env.TESTING_EMAIL_PORT,
        auth: {
            user: process.env.TESTING_EMAIL_ADDRESS,
            pass: process.env.TESTING_EMAIL_PASSWORD
        }
    }
    message = dummyMessage
} else if (process.env.NODE_ENV === 'production') {
    mailConfig = {
        service: process.env.PRODUCTION_EMAIL_SERVICE,
        auth: {
            user: process.env.PRODUCTION_EMAIL_ADDRESS,
            pass: process.env.PRODUCTION_EMAIL_PASSWORD
        }
    }
    message = testMessage
} else {
    process.exit(1)
}

async function sendPresetMessage() {
    const transporter = nodemailer.createTransport(mailConfig);

    try {
        let responseMessage = await transporter.sendMail(message)
        if(responseMessage.error) { 
            throw responseMessage.error
        }

        return responseMessage.response
    } catch (err) {
        console.error(err)
        return
    }
}

module.exports = { sendPresetMessage }