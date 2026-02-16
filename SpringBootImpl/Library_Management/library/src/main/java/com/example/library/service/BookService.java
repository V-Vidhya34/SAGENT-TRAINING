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

    private final BookRepository repository;

    public Book save(Book book) {
        book.setBStatus(BookStatus.AVAILABLE);
        return repository.save(book);
    }

    public List<Book> getAll() {
        return repository.findAll();
    }

    public Book getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found"));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
