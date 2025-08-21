# Multiday Recurring Events Feature

## Overview
The Schedule Builder now supports creating multiday events that repeat weekly, combining the power of multiday events with recurring functionality. This enables complex scheduling scenarios like weekly conferences, training sessions, or vacation periods.

## Feature Capabilities

### 1. Multiday Weekly Recurring Events
- **Full Integration**: Multiday events can now be set to repeat weekly
- **Intelligent Repetition**: Each weekly occurrence maintains the original multiday duration
- **Flexible Duration**: Events can span any number of days (2-7+ days) and repeat weekly
- **Limited Repetitions**: Option to limit repetitions to a specific number of weeks

### 2. Event Types Supported

#### A. Single-Day Recurring
- **Example**: "Team Meeting" every Monday, 2:00 PM - 3:00 PM
- **Use Case**: Regular weekly meetings

#### B. Multiday Non-Recurring  
- **Example**: "Conference" Monday-Wednesday (one-time event)
- **Use Case**: Special events, vacations, projects

#### C. Multiday Recurring (NEW!)
- **Example**: "Training Week" Monday-Friday, repeats every week for 4 weeks
- **Use Case**: Weekly training programs, recurring conferences, regular multi-day workshops

#### D. All-Day Recurring
- **Example**: "Vacation Days" Monday-Friday, all-day, repeats weekly
- **Use Case**: Recurring time off, weekly celebrations

## How It Works

### Date Logic
The enhanced `datesMatch` function handles multiday recurring events by:
1. **Calculating Event Duration**: Determines how many days the original event spans
2. **Weekly Occurrence Generation**: Creates each weekly occurrence starting from the original date
3. **Range Checking**: For each occurrence, checks if the target date falls within that week's multiday range
4. **Limited Repetition**: Respects the repeat limit when specified

### Example Scenario
**Original Event**: 
- Name: "Design Sprint"
- Start Date: January 15, 2024 (Monday)
- End Date: January 17, 2024 (Wednesday)
- Time: 9:00 AM - 5:00 PM
- Recurring: Weekly for 3 weeks

**Generated Occurrences**:
1. **Week 1**: January 15-17 (Mon-Wed)
2. **Week 2**: January 22-24 (Mon-Wed) 
3. **Week 3**: January 29-31 (Mon-Wed)

Each occurrence maintains the 3-day duration and same time range.

## User Interface Enhancements

### 1. Smart Form Interaction
- **Contextual Help Text**: Shows different messages for multiday vs single-day recurring events
- **Dynamic Labels**: "Recurrence Pattern" instead of just "Recurrence"
- **Duration Calculator**: Automatically calculates and displays event duration in help text

### 2. Visual Indicators
- **Calendar Events**: Multiday recurring events have special gradient styling
- **Recurring Symbol**: Shows "↻" symbol on recurring events
- **Color Coding**: Special gradient backgrounds for multiday recurring events

### 3. List View Information
- **Clear Descriptions**: 
  - Single-day: "Repeats weekly for 4 weeks"
  - Multiday: "Multiday event repeats weekly for 4 weeks"
- **Date Ranges**: Shows original date range for multiday events
- **Smart Labels**: Distinguishes between multiday and single-day recurring events

## Technical Implementation

### Enhanced Date Matching Algorithm
```javascript
// Simplified logic for multiday recurring events
if (endDate1 && recurrenceType === "weekly") {
  const eventDuration = Math.floor((new Date(endDate1) - d1) / (1000 * 60 * 60 * 24));
  
  // Check each weekly occurrence
  for (let week = 0; !repeatLimited || week < repeatWeeks; week++) {
    const occurrenceStart = new Date(d1);
    occurrenceStart.setDate(d1.getDate() + (week * 7));
    
    const occurrenceEnd = new Date(occurrenceStart);
    occurrenceEnd.setDate(occurrenceStart.getDate() + eventDuration);
    
    if (isDateInMultidayRange(occurrenceStart, occurrenceEnd, d2)) {
      return true;
    }
  }
}
```

### CSS Enhancements
- **Gradient Backgrounds**: Special styling for multiday recurring events
- **Visual Indicators**: Recurring symbol and border styling
- **Professional Appearance**: Maintains design system consistency

### Conflict Detection
- **Enhanced Algorithm**: Checks for conflicts across all weekly occurrences
- **Multiday Awareness**: Considers entire date ranges when detecting conflicts
- **All-Day Support**: Handles all-day multiday recurring events properly

## Usage Examples

### 1. Weekly Training Program
- **Setup**: Monday-Wednesday, 9 AM-5 PM, repeat for 8 weeks
- **Result**: Training occurs every Monday-Wednesday for 8 consecutive weeks
- **Use Case**: Employee onboarding, certification programs

### 2. Recurring Conference Series
- **Setup**: Tuesday-Thursday, all-day, repeat for 6 weeks
- **Result**: Conference runs every Tuesday-Thursday for 6 weeks
- **Use Case**: Monthly conference series, seasonal events

### 3. Weekly Project Sprints
- **Setup**: Monday-Friday, 8 AM-6 PM, repeat for 12 weeks
- **Result**: Full work week sprints every week for 3 months
- **Use Case**: Development cycles, intensive programs

### 4. Bi-weekly Team Retreats
- **Setup**: Friday-Sunday, all-day, repeat every 2 weeks (can be achieved with manual scheduling)
- **Result**: Weekend retreats every other week
- **Use Case**: Team building, strategic planning

## Calendar Display

### Week View
- **Spanning Events**: Multiday recurring events appear across multiple days
- **Special Styling**: Gradient backgrounds and recurring indicators
- **Time Awareness**: Shows proper time blocks for timed events

### Month View
- **Multi-Cell Events**: Events span across multiple date cells
- **Recurring Indicators**: Visual symbols show recurring nature
- **Tooltip Information**: Hover shows full event details including recurrence pattern

### List View
- **Comprehensive Info**: Shows date ranges, recurrence pattern, and duration
- **Smart Descriptions**: Context-aware descriptions based on event type
- **Easy Management**: Clear remove buttons for each occurrence type

## Benefits

### 1. Scheduling Efficiency
- **One-Time Setup**: Create complex recurring patterns with a single form submission
- **Time Savings**: Avoid manually creating multiple multiday events
- **Consistency**: Ensures all occurrences have identical settings

### 2. Professional Use Cases
- **Training Programs**: Weekly multi-day training sessions
- **Conference Series**: Recurring conferences or seminars
- **Project Management**: Sprint cycles and milestone periods
- **Educational**: Weekly intensive courses or workshops

### 3. Flexibility
- **Duration Options**: Any multiday duration (2-7+ days)
- **Time Control**: All-day or specific time ranges
- **Repetition Limits**: Unlimited or limited to specific number of weeks
- **Easy Modification**: Edit or delete entire recurring series

## Future Enhancements
- **Monthly Multiday Recurring**: Support for monthly multiday patterns
- **Yearly Multiday Recurring**: Support for annual multiday events
- **Custom Intervals**: Every 2 weeks, every 3 weeks, etc.
- **Exception Handling**: Skip specific weeks or modify individual occurrences
- **Bulk Operations**: Edit all occurrences at once

## Testing Scenarios
- ✅ Single-day recurring events (existing functionality preserved)
- ✅ Multiday non-recurring events (existing functionality preserved)  
- ✅ Multiday recurring events with unlimited repetition
- ✅ Multiday recurring events with limited repetition
- ✅ All-day multiday recurring events
- ✅ Timed multiday recurring events
- ✅ Conflict detection with multiday recurring events
- ✅ Calendar display in all views (week, month, year, list)
- ✅ Proper CSS styling and visual indicators

The multiday recurring events feature provides powerful scheduling capabilities while maintaining the intuitive user interface and professional design of the Schedule Builder.
