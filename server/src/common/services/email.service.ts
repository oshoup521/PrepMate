import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private testAccountCredentials: { user: string; pass: string } | null = null;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    // For development, use ethereal email or configure with real SMTP
    const emailConfig = {
      host: this.configService.get('EMAIL_HOST', 'smtp.ethereal.email'),
      port: parseInt(this.configService.get('EMAIL_PORT', '587')),
      secure: this.configService.get('EMAIL_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    };

    // If no email credentials provided, create test account
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      this.createTestAccount();
      return;
    }    this.transporter = nodemailer.createTransport(emailConfig);
    this.verifyConnection();
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.testAccountCredentials = {
        user: testAccount.user,
        pass: testAccount.pass,
      };
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(`Test email account created: ${testAccount.user}`);
      this.logger.log(`Test email password: ${testAccount.pass}`);
      this.logger.log(`Preview emails at: https://ethereal.email`);
      this.logger.log(`Login with: ${testAccount.user} / ${testAccount.pass}`);
    } catch (error) {
      this.logger.error('Failed to create test email account', error);
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connected successfully');
    } catch (error) {
      this.logger.error('Email service connection failed', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      let html = options.html;
      
      // If template is provided, compile it with context
      if (options.template && options.context) {
        html = await this.compileTemplate(options.template, options.context);
      }

      const mailOptions = {
        from: this.configService.get('EMAIL_FROM', 'PrepMate <noreply@prepmate.com>'),
        to: options.to,
        subject: options.subject,
        html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${options.to}`);
      
      // Log preview URL for development
      if (result.messageId && this.configService.get('NODE_ENV') !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        if (previewUrl) {
          this.logger.log(`Preview email: ${previewUrl}`);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  private async compileTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    try {
      const templatePath = join(process.cwd(), 'src', 'templates', `${templateName}.hbs`);
      const templateContent = readFileSync(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(templateContent);
      return compiledTemplate(context);
    } catch (error) {
      this.logger.error(`Failed to compile template ${templateName}`, error);
      throw new Error('Template compilation failed');
    }
  }

  async sendVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
    const verificationUrl = `${this.configService.get('CLIENT_URL', 'http://localhost:5173')}/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - PrepMate',
      template: 'email-verification',
      context: {
        name,
        verificationUrl,
        supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@prepmate.com'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('CLIENT_URL', 'http://localhost:5173')}/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - PrepMate',
      template: 'password-reset',
      context: {
        name,
        resetUrl,
        supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@prepmate.com'),
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to PrepMate!',
      template: 'welcome',
      context: {
        name,
        loginUrl: `${this.configService.get('CLIENT_URL', 'http://localhost:5173')}/login`,
        supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@prepmate.com'),
      },
    });
  }

  getTestAccountCredentials(): { user: string; pass: string } | null {
    return this.testAccountCredentials;
  }

  isUsingTestAccount(): boolean {
    return this.testAccountCredentials !== null;
  }
}
