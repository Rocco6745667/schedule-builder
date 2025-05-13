package api.repository;

import com.schedulebuilder.api.model.ScheduleEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleEventRepository extends JpaRepository<ScheduleEvent, Long> {
    List<ScheduleEvent> findByDate(LocalDate date);
    List<ScheduleEvent> findByDay(String day);
    List<ScheduleEvent> findByRecurringTrue();
}
