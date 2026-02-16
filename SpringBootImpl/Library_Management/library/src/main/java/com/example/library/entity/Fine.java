package com.example.library.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fineId;

    private Double amount;
    private String paidStatus;

    @OneToOne
    @JoinColumn(name = "bo_id")
    private Borrow borrow;
}
