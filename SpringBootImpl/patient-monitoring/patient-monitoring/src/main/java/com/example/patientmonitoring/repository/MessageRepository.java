package com.example.patientmonitoring.repository;
import com.example.patientmonitoring.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Integer> {
    List<Message> findByConsultation_Patient_PatientId(int patientId);
    List<Message> findByConsultation_Doctor_DoctorId(int doctorId);
}