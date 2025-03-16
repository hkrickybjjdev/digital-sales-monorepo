import { Env } from '../../../types';
import { IEmailService } from './interfaces';

export class EmailService implements IEmailService {
  private env: Env;
  private fromEmail: string;
  private appName: string;
  
  constructor(env: Env) {
    this.env = env;
    this.fromEmail = env.EMAIL_FROM;
    this.appName = env.APP_NAME;
  }
  
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: to,
          subject: subject,
          html: htmlContent
        })
      });
      
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to send email (${subject}):`, error);
      return false;
    }
  }
  
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = `Welcome to ${this.appName}!`;
    const htmlContent = this.getWelcomeEmailTemplate(name);
    return await this.sendEmail(to, subject, htmlContent);
  }
  
  async sendActivationEmail(to: string, name: string, activationUrl: string): Promise<boolean> {
    const subject = `Activate your ${this.appName} account`;
    const htmlContent = this.getActivationEmailTemplate(name, activationUrl);
    return await this.sendEmail(to, subject, htmlContent);
  }
  
  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<boolean> {
    const subject = `Reset your ${this.appName} password`;
    const htmlContent = this.getPasswordResetEmailTemplate(name, resetUrl);
    return await this.sendEmail(to, subject, htmlContent);
  }
  
  private getWelcomeEmailTemplate(name: string): string {
    return `
      <div>
        <h1>Welcome to ${this.appName}!</h1>
        <p>Hello ${name},</p>
        <p>Thank you for joining ${this.appName}. Your account has been successfully activated.</p>
        <p>You can now log in and start using all the features our platform has to offer.</p>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>${this.appName} Team</p>
      </div>
    `;
  }
  
  private getActivationEmailTemplate(name: string, activationUrl: string): string {
    return `
      <div>
        <h1>Activate Your Account</h1>
        <p>Hello ${name},</p>
        <p>Thank you for registering with ${this.appName}. Please click the link below to activate your account:</p>
        <p><a href="${activationUrl}">Activate Your Account</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not register for an account, please ignore this email.</p>
        <p>Best regards,<br>${this.appName} Team</p>
      </div>
    `;
  }
  
  private getPasswordResetEmailTemplate(name: string, resetUrl: string): string {
    return `
      <div>
        <h1>Reset Your Password</h1>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p><a href="${resetUrl}">Reset Your Password</a></p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>${this.appName} Team</p>
      </div>
    `;
  }
}