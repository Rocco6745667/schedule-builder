package main.java.com.schedulebuilder.api.service;

import com.schedulebuilder.api.model.ScheduleEvent;
import com.schedulebuilder.api.service.ScheduleEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:3000") // Allow React frontend to access
public class ScheduleEventController {

    @Autowired
    private ScheduleEventService service;
    
    @GetMapping
    public List<ScheduleEvent> getAllEvents() {
        return service.getAllEvents();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ScheduleEvent> getEventById(@PathVariable Long id) {
        return service.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<ScheduleEvent> createEvent(@RequestBody ScheduleEvent event) {
        return new ResponseEntity<>(service.saveEvent(event), HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ScheduleEvent> updateEvent(@PathVariable Long id, @RequestBody ScheduleEvent event) {
        return service.getEventById(id)
                .map(existingEvent -> {
                    event.setId(id);
                    return ResponseEntity.ok(service.saveEvent(event));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        return service.getEventById(id)
                .map(event -> {
                    service.deleteEvent(id);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/date/{date}")
    public List<ScheduleEvent> getEventsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.getEventsByDate(date);
    }
    
    @GetMapping("/day/{day}")
    public List<ScheduleEvent> getEventsByDay(@PathVariable String day) {
        return service.getEventsByDay(day);
    }
    
    @GetMapping("/recurring")
    public List<ScheduleEvent> getRecurringEvents() {
        return service.getRecurringEvents();
    }
}
