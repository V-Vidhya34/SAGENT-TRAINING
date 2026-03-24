package com.example.library.controller;

import com.example.library.entity.Librarian;
import com.example.library.service.LibrarianService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/librarians")
@RequiredArgsConstructor
public class LibrarianController {

    private final LibrarianService service;

    @PostMapping
    public Librarian create(@RequestBody Librarian librarian) {
        return service.save(librarian);
    }

    @GetMapping
    public List<Librarian> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Librarian getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        return service.getAll().stream()
                .filter(l -> l.getEmail().equals(email) && l.getPassword().equals(password))
                .findFirst()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).body(Map.of("message", "Invalid credentials")));
    }
}