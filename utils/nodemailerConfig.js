const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
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