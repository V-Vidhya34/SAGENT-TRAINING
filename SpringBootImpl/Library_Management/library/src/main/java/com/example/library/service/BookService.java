package com.example.library.service;

import com.example.library.entity.Book;
import com.example.library.enums.BookStatus;
import com.example.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepo;

    public Book save(Book book) {
        if (book.getQuantity() == null || book.getQuantity() <= 0) {
            book.setQuantity(0);
            book.setStatus(BookStatus.NOT_AVAILABLE);
        } else {
            book.setStatus(BookStatus.AVAILABLE);
        }
        return bookRepo.save(book);
    }

    public List<Book> getAll() {
        return bookRepo.findAll();
    }

    public Book getById(Long id) {
        return bookRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found"));
    }

    public void delete(Long id) {
        bookRepo.deleteById(id);
    }
}