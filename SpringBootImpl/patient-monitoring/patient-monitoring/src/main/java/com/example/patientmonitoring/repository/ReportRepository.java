package com.example.patientmonitoring.repository;
import com.example.patientmonitoring.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Integer> {
    List<Report> findByPatient_PatientId(int patientId);
}