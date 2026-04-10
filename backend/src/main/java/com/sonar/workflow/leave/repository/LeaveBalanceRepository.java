package com.sonar.workflow.leave.repository;

import com.sonar.workflow.leave.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {

    List<LeaveBalance> findByEmployeeIdAndYear(UUID employeeId, int year);

    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndYear(UUID employeeId, UUID leaveTypeId, int year);

    List<LeaveBalance> findByYear(int year);

    @Query("SELECT lb FROM LeaveBalance lb JOIN FETCH lb.employee JOIN FETCH lb.leaveType " +
           "WHERE lb.year = :year ORDER BY lb.employee.lastName, lb.employee.firstName, lb.leaveType.displayOrder")
    List<LeaveBalance> findAllWithDetailsForYear(@Param("year") int year);

    @Query("SELECT lb FROM LeaveBalance lb JOIN FETCH lb.leaveType " +
           "WHERE lb.employee.id = :employeeId AND lb.year = :year ORDER BY lb.leaveType.displayOrder")
    List<LeaveBalance> findByEmployeeWithDetailsForYear(@Param("employeeId") UUID employeeId, @Param("year") int year);
}
