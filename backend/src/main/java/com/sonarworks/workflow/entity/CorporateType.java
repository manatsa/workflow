package com.sonarworks.workflow.entity;

public enum CorporateType {
    PRIVATE_LIMITED("Private Limited"),
    SOLE_TRADER("Sole Trader"),
    PUBLIC("Public"),
    PARTNERSHIP("Partnership"),
    NGO("NGO"),
    GOVERNMENT("Government");

    private final String displayName;

    CorporateType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
