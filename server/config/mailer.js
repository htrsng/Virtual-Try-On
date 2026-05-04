const nodemailer = require("nodemailer");
const { EMAIL_USER, EMAIL_PASS } = require("./env");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

transporter.verify((error) => {
    if (error) {
        console.error("❌ Email transporter lỗi:", error.message);
    } else {
        console.log("✅ Email transporter sẵn sàng gửi mail!");
    }
});

module.exports = transporter;