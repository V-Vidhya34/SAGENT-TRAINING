package com.example.patientmonitoring.repository;
import com.example.patientmonitoring.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Integer> {
    Optional<Patient> findByMailAndPassword(String mail, String password);
}