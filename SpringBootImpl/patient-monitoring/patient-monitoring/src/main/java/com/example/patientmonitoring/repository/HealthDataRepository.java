package com.example.patientmonitoring.repository;
import com.example.patientmonitoring.entity.HealthData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HealthDataRepository extends JpaRepository<HealthData, Integer> {
    List<HealthData> findByPatient_PatientId(int patientId);
}