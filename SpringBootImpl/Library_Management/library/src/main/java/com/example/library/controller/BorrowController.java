package com.example.library.controller;

import com.example.library.entity.Borrow;
import com.example.library.service.BorrowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/borrow")
@RequiredArgsConstructor
public class BorrowController {

    private final BorrowService service;

    // Borrow book
    @PostMapping("/{memId}/{bookId}")
    public Borrow borrowBook(@PathVariable Long memId,
                             @PathVariable Long bookId) {
        return service.borrowBook(memId, bookId);
    }

    // Return book
    @PutMapping("/{borrowId}/return")
    public Borrow returnBook(@PathVariable Long borrowId) {
        return service.returnBook(borrowId);
    }

    @GetMapping
    public List<Borrow> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteBorrow(id);
    }

}
