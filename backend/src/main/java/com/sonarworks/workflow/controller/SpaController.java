package com.sonarworks.workflow.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    // Forward all non-API, non-static routes to index.html for Angular routing
    @GetMapping({
        "/login",
        "/forgot-password",
        "/reset-password",
        "/dashboard",
        "/workflows",
        "/workflows/**",
        "/approvals",
        "/approvals/**",
        "/my-submissions",
        "/my-submissions/**",
        "/admin",
        "/admin/**",
        "/settings",
        "/settings/**",
        "/users",
        "/users/**",
        "/roles",
        "/roles/**",
        "/sbus",
        "/sbus/**",
        "/audit",
        "/audit/**",
        "/profile",
        "/profile/**",
        "/change-password",
        "/email-approval",
        "/email-approval/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
