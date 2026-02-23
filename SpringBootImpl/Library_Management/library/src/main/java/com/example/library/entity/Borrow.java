package com.example.library.entity;

import com.example.library.enums.BorrowStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Borrow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "mem_id")
    @JsonIgnoreProperties({"borrows", "password"})
    private Member member;

    @ManyToOne
    @JoinColumn(name = "book_id")
    @JsonIgnoreProperties({"borrows"})
    private Book book;

    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate returnDate;

    @Enumerated(EnumType.STRING)
    private BorrowStatus boStatus;

    @OneToOne(mappedBy = "borrow", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"borrow"})
    private Fine fine;
}