package com.example.library.service;

import com.example.library.entity.Member;
import com.example.library.entity.Notification;
import com.example.library.repository.MemberRepository;
import com.example.library.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;
    private final MemberRepository memberRepo;

    public Notification sendNotification(Long memId, String message) {

        Member member = memberRepo.findById(memId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        Notification notification = Notification.builder()
                .member(member)
                .message(message)
                .sentDate(LocalDate.now())
                .build();

        return repository.save(notification);
    }

    public List<Notification> getAll() {
        return repository.findAll();
    }
}
