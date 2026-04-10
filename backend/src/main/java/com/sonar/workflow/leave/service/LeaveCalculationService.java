package com.sonar.workflow.leave.service;

import com.sonar.workflow.leave.repository.PublicHolidayRepository;
import com.sonar.workflow.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveCalculationService {

    private final PublicHolidayRepository publicHolidayRepository;
    private final SettingService settingService;

    /**
     * Calculate working days between two dates, excluding weekends and public holidays.
     */
    public BigDecimal calculateWorkingDays(LocalDate startDate, LocalDate endDate,
                                            boolean startHalfDay, boolean endHalfDay) {
        if (startDate.isAfter(endDate)) {
            return BigDecimal.ZERO;
        }

        Set<DayOfWeek> weekendDays = getWeekendDays();
        List<LocalDate> holidays = getPublicHolidayDates(startDate, endDate);

        BigDecimal totalDays = BigDecimal.ZERO;
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            if (!weekendDays.contains(current.getDayOfWeek()) && !holidays.contains(current)) {
                if (current.equals(startDate) && startHalfDay) {
                    totalDays = totalDays.add(new BigDecimal("0.5"));
                } else if (current.equals(endDate) && endHalfDay) {
                    totalDays = totalDays.add(new BigDecimal("0.5"));
                } else {
                    totalDays = totalDays.add(BigDecimal.ONE);
                }
            }
            current = current.plusDays(1);
        }

        return totalDays;
    }

    /**
     * Calculate pro-rata entitlement for mid-year joiners.
     */
    public BigDecimal calculateProRata(int totalDaysAllowed, LocalDate joinDate, int leaveYear) {
        int startMonth = getLeaveYearStartMonth();
        LocalDate leaveYearStart = LocalDate.of(leaveYear, startMonth, 1);
        LocalDate leaveYearEnd = leaveYearStart.plusYears(1).minusDays(1);

        if (joinDate.isBefore(leaveYearStart) || joinDate.isAfter(leaveYearEnd)) {
            return BigDecimal.valueOf(totalDaysAllowed);
        }

        // Calculate remaining months from join date to leave year end
        long totalMonths = 12;
        long monthsFromJoin = leaveYearEnd.getMonthValue() - joinDate.getMonthValue() + 1;
        if (leaveYearEnd.getYear() > joinDate.getYear()) {
            monthsFromJoin += 12;
        }
        monthsFromJoin = Math.min(monthsFromJoin, totalMonths);

        return BigDecimal.valueOf(totalDaysAllowed)
                .multiply(BigDecimal.valueOf(monthsFromJoin))
                .divide(BigDecimal.valueOf(totalMonths), 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate carry-over days (capped at max).
     */
    public BigDecimal calculateCarryOver(BigDecimal remainingBalance, int maxCarryOverDays) {
        if (maxCarryOverDays <= 0 || remainingBalance.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return remainingBalance.min(BigDecimal.valueOf(maxCarryOverDays));
    }

    public boolean isWeekend(LocalDate date) {
        return getWeekendDays().contains(date.getDayOfWeek());
    }

    public Set<DayOfWeek> getWeekendDays() {
        String weekendSetting = settingService.getValue("leave.weekend.days", "SATURDAY,SUNDAY");
        return Arrays.stream(weekendSetting.split(","))
                .map(String::trim)
                .map(DayOfWeek::valueOf)
                .collect(Collectors.toSet());
    }

    public List<LocalDate> getPublicHolidayDates(LocalDate start, LocalDate end) {
        return publicHolidayRepository.findByDateBetween(start, end).stream()
                .filter(h -> Boolean.TRUE.equals(h.getIsActive()))
                .map(h -> h.getDate())
                .collect(Collectors.toList());
    }

    public int getLeaveYearStartMonth() {
        return settingService.getIntValue("leave.year.start.month", 1);
    }

    public int getCurrentLeaveYear() {
        int startMonth = getLeaveYearStartMonth();
        LocalDate now = LocalDate.now();
        if (now.getMonthValue() < startMonth) {
            return now.getYear() - 1;
        }
        return now.getYear();
    }
}
