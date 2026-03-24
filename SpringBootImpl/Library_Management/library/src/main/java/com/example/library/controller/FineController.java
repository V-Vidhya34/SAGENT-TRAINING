package com.example.library.controller;

import com.example.library.entity.Fine;
import com.example.library.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fine")
@RequiredArgsConstructor
public class FineController {

    private final FineService service;

    @GetMapping
    public List<Fine> getAll() {
        return service.getAll();
    }

    @PutMapping("/{fineId}/pay")
    public Fine payFine(@PathVariable Long fineId) {
        return service.payFine(fineId);
    }
}
