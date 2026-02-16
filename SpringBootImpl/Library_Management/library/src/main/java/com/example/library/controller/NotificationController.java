package com.example.library.controller;

import com.example.library.entity.Notification;
import com.example.library.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @PostMapping("/{memId}")
    public Notification send(@PathVariable Long memId,
                             @RequestParam String message) {
        return service.sendNotification(memId, message);
    }

    @GetMapping
    public List<Notification> getAll() {
        return service.getAll();
    }
}
