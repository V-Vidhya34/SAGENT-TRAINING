package com.example.library.service;

import com.example.library.entity.*;
import com.example.library.enums.BookStatus;
import com.example.library.enums.BorrowStatus;
import com.example.library.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BorrowService {

    private final BorrowRepository borrowRepo;
    private final MemberRepository memberRepo;
    private final BookRepository bookRepo;
    private final FineRepository fineRepo;

    // BORROW BOOK
    public Borrow borrowBook(Long memId, Long bookId) {

        Member member = memberRepo.findById(memId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        Book book = bookRepo.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (book.getBStatus() != BookStatus.AVAILABLE) {
            throw new RuntimeException("Book not available");
        }

        book.setBStatus(BookStatus.NOT_AVAILABLE);

        Borrow borrow = Borrow.builder()
                .member(member)
                .book(book)
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(7))
                .boStatus(BorrowStatus.BORROWED)
                .build();

        return borrowRepo.save(borrow);
    }

    // RETURN BOOK
    public Borrow returnBook(Long borrowId) {

        Borrow borrow = borrowRepo.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("Borrow not found"));

        borrow.setReturnDate(LocalDate.now());
        borrow.setBoStatus(BorrowStatus.RETURNED);

        borrow.getBook().setBStatus(BookStatus.AVAILABLE);

        if (borrow.getReturnDate().isAfter(borrow.getDueDate())) {

            long daysLate = ChronoUnit.DAYS.between(
                    borrow.getDueDate(),
                    borrow.getReturnDate());

            Fine fine = Fine.builder()
                    .amount(daysLate * 10.0) // ₹10 per day
                    .paidStatus("NOT_PAID")
                    .borrow(borrow)
                    .build();

            fineRepo.save(fine);
        }

        return borrowRepo.save(borrow);
    }


    public void deleteBorrow(Long id) {
        Borrow borrow = borrowRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Borrow not found"));

        // If book is still borrowed, make it available
        if (borrow.getBoStatus().name().equals("BORROWED")) {
            borrow.getBook().setBStatus(BookStatus.AVAILABLE);
        }

        borrowRepo.deleteById(id);
    }


    public List<Borrow> getAll() {
        return borrowRepo.findAll();
    }
}
