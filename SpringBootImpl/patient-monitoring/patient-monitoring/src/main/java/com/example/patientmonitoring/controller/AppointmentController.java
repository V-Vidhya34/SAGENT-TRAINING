package com.example.patientmonitoring.controller;

import com.example.patientmonitoring.entity.Appointment;
import com.example.patientmonitoring.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @PostMapping
    public Appointment create(@RequestBody Appointment appointment) {
        return appointmentService.save(appointment);
    }

    @GetMapping
    public List<Appointment> getAll() {
        return appointmentService.getAll();
    }

    @GetMapping("/{id}")
    public Appointment getById(@PathVariable int id) {
        return appointmentService.getById(id);
    }

    @PutMapping("/{id}")
    public Appointment update(@PathVariable int id, @RequestBody Appointment appointment) {
        appointment.setAppointId(id);
        return appointmentService.save(appointment);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable int id) {
        appointmentService.delete(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> getByPatient(@PathVariable int patientId) {
        return appointmentService.getByPatient(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getByDoctor(@PathVariable int doctorId) {
        return appointmentService.getByDoctor(doctorId);
    }

    @GetMapping("/my/{patientId}")
    public List<Appointment> getMyAppointments(@PathVariable int patientId) {
        return appointmentService.getByPatientId(patientId);
    }
}

