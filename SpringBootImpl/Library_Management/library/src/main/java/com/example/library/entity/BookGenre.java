package com.example.library.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookGenre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bgId;

    private String genreName;

    @ManyToOne
    @JoinColumn(name = "b_id")
    private Book book;
}
