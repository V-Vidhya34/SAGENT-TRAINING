package com.example.patientmonitoring.repository;
import com.example.patientmonitoring.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findByPatient_PatientId(int patientId);
    List<Appointment> findByDoctor_DoctorId(int doctorId);
}

