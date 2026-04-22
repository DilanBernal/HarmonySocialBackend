import Email from "../../../application/dto/utils/Email";
import EmailPort from "../../../domain/ports/utils/EmailPort";
import nodemailer, { Transporter } from "nodemailer";
import envs from "../../config/environment-vars";
import LoggerPort from "../../../domain/ports/utils/LoggerPort";

export default class EmailNodemailerAdapter implements EmailPort {
  private transporter: Transporter;

  constructor(private logger: LoggerPort) {
    let authOptions: Object | undefined = {
      user: envs.SMTP_USER,
      pass: envs.SMTP_PASSWORD,
    };
    if (!envs.SMTP_USER && !envs.SMTP_PASSWORD) {
      authOptions = undefined;
    }
    this.transporter = nodemailer.createTransport({
      host: envs.SMTP_HOST,
      port: Number(envs.SMTP_PORT) || 587,
      secure: false,
      auth: authOptions,
    });
  }

  async sendEmails(emails: Email[]): Promise<boolean> {
    let response: boolean = true;
    emails.forEach(async (x) => {
      const emailResponse: boolean = await this.sendEmail(x)
        .catch((x: boolean) => {
          return x;
        })
        .catch((err) => {
          this.logger.error(`No se pudo enviar el email a el correo ${x.to}`, [x, err]);
          return false;
        });
      if (!emailResponse) {
        response = false;
      }
    });
    return response;
  }
  async sendEmail(email: Email): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: email.from || envs.EMAIL_FROM,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        replyTo: email.replyTo,
      });
      return true;
    } catch (error) {
      this.logger.error(`No se pudo enviar el email a el correo ${email.to}`, [
        email,
        error,
        __dirname,
      ]);
      return false;
    }
  }
}
