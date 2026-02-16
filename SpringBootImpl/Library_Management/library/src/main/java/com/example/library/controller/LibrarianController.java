package com.example.library.controller;

import com.example.library.entity.Librarian;
import com.example.library.service.LibrarianService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
