package com.example.patientmonitoring.repository;
import com.example.patientmonitoring.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultationRepository extends JpaRepository<Consultation, Integer> {
    List<Consultation> findByPatient_PatientId(int patientId);
    List<Consultation> findByDoctor_DoctorId(int doctorId);
}