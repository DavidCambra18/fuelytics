package com.fuelytics.backend.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import com.fuelytics.backend.entity.MaintenanceReminder;

public interface MaintenanceReminderRepository extends JpaRepository<MaintenanceReminder, Integer> {
    @EntityGraph(attributePaths = "completedExpense")
    List<MaintenanceReminder> findByVehicleIdOrderByIdDesc(Integer vehicleId);
    Optional<MaintenanceReminder> findByCompletedExpenseId(Integer expenseId);
}
