package com.fuelytics.backend.entity;

import java.time.LocalDate;
import jakarta.persistence.*;

@Entity
@Table(name = "reminders")
public class MaintenanceReminder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;
    @Column(nullable = false, length = 120)
    private String title;
    @Column(length = 500)
    private String notes;
    private Integer targetOdometer;
    private LocalDate targetDate;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "completed_expense_id", unique = true)
    private Expense completedExpense;
    @Column(unique = true)
    private Integer legacyExpenseId;

    public Integer getId() { return id; }
    public void setId(Integer value) { id = value; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle value) { vehicle = value; }
    public String getTitle() { return title; }
    public void setTitle(String value) { title = value; }
    public String getNotes() { return notes; }
    public void setNotes(String value) { notes = value; }
    public Integer getTargetOdometer() { return targetOdometer; }
    public void setTargetOdometer(Integer value) { targetOdometer = value; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate value) { targetDate = value; }
    public Expense getCompletedExpense() { return completedExpense; }
    public void setCompletedExpense(Expense value) { completedExpense = value; }
    public Integer getLegacyExpenseId() { return legacyExpenseId; }
    public void setLegacyExpenseId(Integer value) { legacyExpenseId = value; }
}
