const nodemailer = require("nodemailer");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Nodemailer config error: EMAIL_USER or EMAIL_PASS not set");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || "default@example.com",
        pass: process.env.EMAIL_PASS || "default",
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Nodemailer verification failed:", {
            message: error.message,
            stack: error.stack
        });
    } else {
        console.log("Nodemailer ready to send emails");
    }
});

module.exports = transporter;