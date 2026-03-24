package com.example.patientmonitoring.controller;

import com.example.patientmonitoring.entity.Doctor;
import com.example.patientmonitoring.entity.Patient;
import com.example.patientmonitoring.repository.DoctorRepository;
import com.example.patientmonitoring.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private PatientRepository patientRepo;

    @Autowired
    private DoctorRepository doctorRepo;

    @PostMapping("/patient-login")
    public ResponseEntity<?> patientLogin(@RequestBody Map<String, String> body) {
        Optional<Patient> p = patientRepo.findByMailAndPassword(
                body.get("email"), body.get("password")
        );
        if (p.isEmpty()) return ResponseEntity.status(401).body("Invalid credentials");
        Map<String, Object> res = new HashMap<>();
        res.put("role", "patient");
        res.put("id", p.get().getPatientId());
        res.put("name", p.get().getName());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/doctor-login")
    public ResponseEntity<?> doctorLogin(@RequestBody Map<String, String> body) {
        Optional<Doctor> d = doctorRepo.findByEmailAndPassword(
                body.get("email"), body.get("password")
        );
        if (d.isEmpty()) return ResponseEntity.status(401).body("Invalid credentials");
        Map<String, Object> res = new HashMap<>();
        res.put("role", "doctor");
        res.put("id", d.get().getDoctorId());
        res.put("name", d.get().getName());
        return ResponseEntity.ok(res);
    }
}