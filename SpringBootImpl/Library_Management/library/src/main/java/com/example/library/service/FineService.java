package com.example.library.service;

import com.example.library.entity.Fine;
import com.example.library.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository repository;

    public List<Fine> getAll() {
        return repository.findAll();
    }

    public Fine payFine(Long fineId) {

        Fine fine = repository.findById(fineId)
                .orElseThrow(() -> new RuntimeException("Fine not found"));

        fine.setPaidStatus("PAID");

        return repository.save(fine);
    }
}
