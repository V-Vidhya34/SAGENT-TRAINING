//package com.example.patientmonitoring.repository;
//
//public class AppointmentRepository {
//}


package com.example.patientmonitoring.repository;

import com.example.patientmonitoring.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

}
