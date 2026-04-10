package com.sonar.workflow.leave.repository;

import com.sonar.workflow.leave.entity.LeaveRequest;
import com.sonar.workflow.leave.entity.LeaveRequest.LeaveRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

    @Query("SELECT lr FROM LeaveRequest lr JOIN FETCH lr.leaveType JOIN FETCH lr.employee " +
           "WHERE lr.employee.id = :employeeId ORDER BY lr.createdAt DESC")
    Page<LeaveRequest> findByEmployeeId(@Param("employeeId") UUID employeeId, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr JOIN FETCH lr.leaveType JOIN FETCH lr.employee " +
           "WHERE lr.status = :status ORDER BY lr.createdAt ASC")
    Page<LeaveRequest> findByStatus(@Param("status") LeaveRequestStatus status, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr JOIN FETCH lr.leaveType JOIN FETCH lr.employee " +
           "WHERE (LOWER(lr.employee.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(lr.employee.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(lr.referenceNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY lr.createdAt DESC")
    Page<LeaveRequest> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId " +
           "AND lr.status NOT IN ('CANCELLED', 'REJECTED') " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findOverlapping(@Param("employeeId") UUID employeeId,
                                       @Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate);

    @Query("SELECT lr FROM LeaveRequest lr JOIN FETCH lr.leaveType JOIN FETCH lr.employee " +
           "WHERE lr.status = 'APPROVED' AND lr.startDate <= :endDate AND lr.endDate >= :startDate " +
           "ORDER BY lr.startDate")
    List<LeaveRequest> findApprovedInRange(@Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    @Query("SELECT DISTINCT lr FROM LeaveRequest lr JOIN FETCH lr.leaveType JOIN FETCH lr.employee e " +
           "WHERE lr.status = 'APPROVED' AND lr.startDate <= :endDate AND lr.endDate >= :startDate " +
           "AND e.id IN (SELECT u.id FROM User u JOIN u.departments d WHERE d.id IN :departmentIds) " +
           "ORDER BY lr.startDate")
    List<LeaveRequest> findApprovedInRangeForDepartments(@Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate,
                                                         @Param("departmentIds") List<UUID> departmentIds);

    @Query("SELECT lr FROM LeaveRequest lr JOIN FETCH lr.leaveType JOIN FETCH lr.employee e " +
           "WHERE lr.status = :status " +
           "AND e.id IN (SELECT u.id FROM User u JOIN u.departments d WHERE d.id IN :departmentIds) " +
           "ORDER BY lr.createdAt ASC")
    Page<LeaveRequest> findByStatusForDepartments(@Param("status") LeaveRequestStatus status,
                                                   @Param("departmentIds") List<UUID> departmentIds,
                                                   Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr JOIN FETCH lr.leaveType JOIN FETCH lr.employee " +
           "WHERE lr.employee.id = :employeeId AND lr.status IN :statuses ORDER BY lr.startDate DESC")
    List<LeaveRequest> findByEmployeeIdAndStatusIn(@Param("employeeId") UUID employeeId,
                                                    @Param("statuses") List<LeaveRequestStatus> statuses);

    long countByStatus(LeaveRequestStatus status);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.status = :status " +
           "AND lr.employee.id IN (SELECT u.id FROM User u JOIN u.departments d WHERE d.id IN :departmentIds)")
    long countByStatusForDepartments(@Param("status") LeaveRequestStatus status,
                                     @Param("departmentIds") List<UUID> departmentIds);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND lr.status = :status")
    long countByEmployeeIdAndStatus(@Param("employeeId") UUID employeeId, @Param("status") LeaveRequestStatus status);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.status = 'APPROVED' " +
           "AND lr.startDate > :today AND lr.employee.id = :employeeId")
    long countApprovedUpcoming(@Param("employeeId") UUID employeeId, @Param("today") LocalDate today);

    @Query("SELECT lr FROM LeaveRequest lr JOIN FETCH lr.employee JOIN FETCH lr.leaveType " +
           "WHERE lr.status = 'PENDING' AND lr.currentApprover IS NOT NULL AND lr.currentApprover.user.id = :userId " +
           "ORDER BY lr.submittedAt ASC")
    Page<LeaveRequest> findPendingForApprover(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.status = 'PENDING' AND lr.currentApprover IS NOT NULL " +
           "AND lr.currentApprover.user.id = :userId")
    long countPendingForApprover(@Param("userId") UUID userId);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = 'PENDING' AND lr.submittedAt IS NOT NULL")
    List<LeaveRequest> findPendingWithSubmittedAt();

    Optional<LeaveRequest> findByReferenceNumber(String referenceNumber);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(lr.referenceNumber, 9) AS int)), 0) " +
           "FROM LeaveRequest lr WHERE lr.referenceNumber LIKE :prefix")
    int findMaxReferenceNumberForPrefix(@Param("prefix") String prefix);
}
