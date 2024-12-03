import { SendMailInterface } from "./interface";
import nodemailer from "nodemailer";
export const sendmail = async (message: SendMailInterface) => {
    message.from = process.env.zoho_username!;
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      tls: {
        rejectUnauthorized: false,
      },
      secure: true,
      auth: {
        user: process.env.zoho_username,
        pass: process.env.zoho_password,
      },
    });
    return await transporter.sendMail(message);
  };