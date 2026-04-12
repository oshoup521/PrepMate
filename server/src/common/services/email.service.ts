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

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const user = this.configService.get('EMAIL_USER');
    const pass = this.configService.get('EMAIL_PASS');

    if (!user || !pass) {
      this.logger.warn('EMAIL_USER or EMAIL_PASS not set — email sending is disabled. Configure SMTP credentials to enable emails.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get('EMAIL_PORT', '587')),
      secure: this.configService.get('EMAIL_SECURE', 'false') === 'true',
      auth: { user, pass },
    });

    this.verifyConnection();
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
    if (!this.transporter) {
      this.logger.warn(`Email not sent to ${options.to} — transporter not configured`);
      return false;
    }

    try {
      let html = options.html;

      if (options.template && options.context) {
        html = await this.compileTemplate(options.template, options.context);
      }

      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'PrepMate <noreply@prepmate.com>'),
        to: options.to,
        subject: options.subject,
        html,
        text: options.text,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
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
}
