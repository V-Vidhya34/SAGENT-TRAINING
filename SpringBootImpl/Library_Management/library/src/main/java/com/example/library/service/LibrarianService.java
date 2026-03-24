package com.example.library.service;

import com.example.library.entity.Librarian;
import com.example.library.repository.LibrarianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LibrarianService {

    private final LibrarianRepository repository;

    public Librarian save(Librarian librarian) {
        return repository.save(librarian);
    }

    public List<Librarian> getAll() {
        return repository.findAll();
    }

    public Librarian getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Librarian not found"));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
