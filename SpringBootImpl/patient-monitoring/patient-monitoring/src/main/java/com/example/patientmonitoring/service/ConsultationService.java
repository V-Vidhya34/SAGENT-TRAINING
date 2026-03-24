package com.example.patientmonitoring.service;

import com.example.patientmonitoring.entity.Consultation;
import com.example.patientmonitoring.repository.ConsultationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConsultationService {

    @Autowired
    private ConsultationRepository consultationRepository;

    public Consultation save(Consultation consultation) {
        return consultationRepository.save(consultation);
    }

    public List<Consultation> getAll() {
        return consultationRepository.findAll();
    }

    public Consultation getById(int id) {
        return consultationRepository.findById(id).orElseThrow();
    }

    public void delete(int id) {
        consultationRepository.deleteById(id);
    }

    public List<Consultation> getByPatient(int patientId) {
        return consultationRepository.findByPatient_PatientId(patientId);
    }

    public List<Consultation> getByDoctor(int doctorId) {
        return consultationRepository.findByDoctor_DoctorId(doctorId);
    }

    public List<Consultation> getByPatientId(int patientId) {
        return consultationRepository.findByPatient_PatientId(patientId);
    }
}

