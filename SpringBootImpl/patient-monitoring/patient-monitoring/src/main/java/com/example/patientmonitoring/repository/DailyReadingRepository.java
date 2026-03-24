package com.example.patientmonitoring.repository;
import com.example.patientmonitoring.entity.DailyReading;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DailyReadingRepository extends JpaRepository<DailyReading, Integer> {
    List<DailyReading> findByPatient_PatientId(int patientId);
}