package com.example.patientmonitoring.dto;

import lombok.Data;

@Data
public class AppointmentUpdateRequest {
    private String status;
    private String notes;
}
