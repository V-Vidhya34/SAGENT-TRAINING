package com.example.patientmonitoring.dto;

public class LoginResponse {

    private Long id;
    private String name;
    private String role;

    // ✅ CONSTRUCTOR IS HERE
    public LoginResponse(Long id, String name, String role) {
        this.id = id;
        this.name = name;
        this.role = role;
    }

    // getters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }
}
