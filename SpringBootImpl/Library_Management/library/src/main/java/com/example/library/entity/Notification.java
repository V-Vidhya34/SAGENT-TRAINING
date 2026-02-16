package com.example.library.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long nId;

    private String message;
    private LocalDate sentDate;

    @ManyToOne
    @JoinColumn(name = "mem_id")
    private Member member;
}
