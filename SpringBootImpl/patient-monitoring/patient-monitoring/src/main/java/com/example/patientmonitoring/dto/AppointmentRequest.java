package com.example.patientmonitoring.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AppointmentRequest {
    private Long patientId;
    private LocalDate appointmentDate;
    private String appointmentTime;
    private String reason;
}
