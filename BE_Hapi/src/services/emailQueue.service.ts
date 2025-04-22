import * as nodemailer from "nodemailer";
import dotenv from "dotenv";
import type { EmailJob } from "../interfaces/EmailInterfaces";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const queueEmail = async (job: EmailJob) => {
  const { to, subject, text } = job;
  try {
    await transporter.sendMail({
      from: `"School Management System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (err: any) {
    console.error(`Failed to send email to ${to}: ${err.message}`);
    throw err;
  }
};
