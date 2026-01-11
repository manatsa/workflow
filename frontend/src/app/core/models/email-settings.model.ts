export interface EmailSettings {
  id?: number;

  // General
  emailProtocol: EmailProtocol;
  senderEmail: string;
  senderName: string;
  emailEnabled: boolean;
  replyToEmail?: string;

  // SMTP Settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecurity?: SmtpSecurity;
  smtpAuthRequired?: boolean;

  // Microsoft 365 / Graph API Settings
  msTenantId?: string;
  msClientId?: string;
  msClientSecret?: string;
  msUserEmail?: string;

  // Gmail API Settings
  gmailClientId?: string;
  gmailClientSecret?: string;
  gmailRefreshToken?: string;
  gmailUserEmail?: string;

  // Exchange EWS Settings
  exchangeServerUrl?: string;
  exchangeUsername?: string;
  exchangePassword?: string;
  exchangeDomain?: string;
  exchangeEmail?: string;

  // API-based services (SendGrid, Mailgun, AWS SES)
  apiKey?: string;
  apiEndpoint?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretKey?: string;

  // Email Defaults
  emailSignature?: string;
  includeCompanyLogo?: boolean;
  emailFooter?: string;

  // Connection Settings
  connectionTimeout?: number;
  readTimeout?: number;
  writeTimeout?: number;

  // Advanced Settings
  useSslTrustAll?: boolean;
  debugMode?: boolean;
  maxRetries?: number;
  retryDelaySeconds?: number;

  // Test Settings
  testEmailRecipient?: string;
  lastTestDate?: string;
  lastTestSuccess?: boolean;
  lastTestError?: string;

  // Audit
  createdDate?: string;
  updatedDate?: string;
  createdBy?: string;
  updatedBy?: string;
}

export enum EmailProtocol {
  SMTP = 'SMTP',
  SMTP_GMAIL = 'SMTP_GMAIL',
  SMTP_OUTLOOK = 'SMTP_OUTLOOK',
  SMTP_OFFICE365 = 'SMTP_OFFICE365',
  SMTP_YAHOO = 'SMTP_YAHOO',
  SMTP_EXCHANGE = 'SMTP_EXCHANGE',
  MICROSOFT_GRAPH = 'MICROSOFT_GRAPH',
  GMAIL_API = 'GMAIL_API',
  EXCHANGE_EWS = 'EXCHANGE_EWS',
  SENDGRID = 'SENDGRID',
  MAILGUN = 'MAILGUN',
  AWS_SES = 'AWS_SES'
}

export enum SmtpSecurity {
  NONE = 'NONE',
  SSL = 'SSL',
  TLS = 'TLS'
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  errorDetails?: string;
  testDate?: string;
  durationMs?: number;
}

export interface EmailConfigurationStatus {
  configured: boolean;
  enabled: boolean;
  emailProtocol?: string;
  tested: boolean;
  lastTestSuccess?: boolean;
  lastTestDate?: string;
  lastTestError?: string;
  smtpHost?: string;
  smtpPort?: number;
  senderEmail?: string;
}
