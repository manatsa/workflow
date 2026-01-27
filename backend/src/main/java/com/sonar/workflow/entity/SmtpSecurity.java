package com.sonar.workflow.entity;

public enum SmtpSecurity {
    NONE,   // No encryption (port 25) - not recommended
    SSL,    // SSL/TLS encryption (port 465)
    TLS     // STARTTLS encryption (port 587) - recommended
}
