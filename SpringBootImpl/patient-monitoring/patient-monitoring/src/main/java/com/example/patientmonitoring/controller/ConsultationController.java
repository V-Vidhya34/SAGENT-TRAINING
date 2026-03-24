package com.example.patientmonitoring.controller;

import com.example.patientmonitoring.entity.Consultation;
import com.example.patientmonitoring.service.ConsultationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@CrossOrigin(origins = "http://localhost:3000")
public class ConsultationController {

    @Autowired
    private ConsultationService consultationService;

    @PostMapping
    public Consultation create(@RequestBody Consultation consultation) {
        return consultationService.save(consultation);
    }

    @GetMapping
    public List<Consultation> getAll() {
        return consultationService.getAll();
    }

    @GetMapping("/{id}")
    public Consultation getById(@PathVariable int id) {
        return consultationService.getById(id);
    }

    @PutMapping("/{id}")
    public Consultation update(@PathVariable int id, @RequestBody Consultation consultation) {
        consultation.setConsultId(id);
        return consultationService.save(consultation);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable int id) {
        consultationService.delete(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<Consultation> getByPatient(@PathVariable int patientId) {
        return consultationService.getByPatient(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Consultation> getByDoctor(@PathVariable int doctorId) {
        return consultationService.getByDoctor(doctorId);
    }

    @GetMapping("/my/{patientId}")
    public List<Consultation> getMyConsultations(@PathVariable int patientId) {
        return consultationService.getByPatientId(patientId);
    }
}