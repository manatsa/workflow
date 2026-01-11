package com.sonarworks.workflow.entity;

public enum EmailProtocol {
    SMTP,              // Standard SMTP - works with any email provider
    SMTP_OFFICE365,    // SMTP via Office 365 (smtp.office365.com)
    SMTP_GMAIL,        // SMTP via Gmail (smtp.gmail.com) - requires App Password
    SMTP_OUTLOOK,      // SMTP via Outlook.com (smtp-mail.outlook.com)
    SMTP_YAHOO,        // SMTP via Yahoo (smtp.mail.yahoo.com)
    SMTP_EXCHANGE,     // SMTP via on-premise Exchange Server
    MICROSOFT_GRAPH,   // Microsoft Graph API (OAuth2) - recommended for M365
    GMAIL_API,         // Gmail API (OAuth2) - recommended for Google Workspace
    EXCHANGE_EWS,      // Exchange Web Services (on-premise Exchange)
    SENDGRID,          // SendGrid API
    MAILGUN,           // Mailgun API
    AWS_SES            // Amazon Simple Email Service
}
