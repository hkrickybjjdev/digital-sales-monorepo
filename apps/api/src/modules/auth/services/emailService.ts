import { Env } from '../../../types';
import { IEmailService } from './interfaces';

export class EmailService implements IEmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor(env: Env) {
    this.apiKey = env.RESEND_API_KEY;
    this.fromEmail = env.EMAIL_FROM || 'no-reply@042388.xyz';
  }

  /**
   * Send an activation email to the user
   */
  async sendActivationEmail(to: string, name: string, activationLink: string): Promise<boolean> {
    const subject = 'Activate Your Account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to TempPages!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for creating an account with us. To activate your account and get started, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Activate Account</a>
        </div>
        <p>If the button above doesn't work, please copy and paste the following link into your browser:</p>
        <p><a href="${activationLink}">${activationLink}</a></p>
        <p>This activation link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>Thanks,<br>The TempPages Team</p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send a welcome email to the user after successful activation
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to TempPages!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Activated!</h2>
        <p>Hi ${name},</p>
        <p>Your account has been successfully activated. Welcome to TempPages!</p>
        <p>You can now log in and start using our platform to create temporary pages for your needs.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://app.tempages.app/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Log into your account</a>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Thanks,<br>The TempPages Team</p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Private method to send emails via Resend API
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          html
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to send email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}