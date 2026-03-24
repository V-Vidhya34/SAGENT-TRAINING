package com.example.library.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "librarians")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Librarian {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String password;
}