# Repeating Events Feature

## Overview
The Schedule Builder now supports creating repeating events with the option to limit repetitions to a specific number of weeks.

## Features Added

### 1. Limited Weekly Repetitions
- When creating a recurring weekly event, users can now choose to limit the repetitions
- Events can repeat for a specified number of weeks (1-52 weeks)
- The system calculates the exact dates based on the original event date

### 2. User Interface Enhancements
- **Recurring Event Checkbox**: Enable/disable recurring functionality
- **Recurrence Type**: Choose between Weekly, Monthly, or Yearly
- **Limit Repetitions Checkbox**: Available for weekly events only
- **Number of Weeks Input**: Specify how many weeks the event should repeat (including the original)
- **Helper Text**: Shows confirmation of repeat duration

### 3. Backend Support
- Updated MongoDB Event model to include:
  - `repeatWeeks`: Number of weeks to repeat (default: 1)
  - `repeatLimited`: Boolean flag for limited repetitions (default: false)
- Enhanced date matching logic to handle limited repetitions

### 4. Display Improvements
- List view shows repeat information: "Repeats weekly for X weeks"
- Calendar views properly display limited recurring events
- Conflict detection works with limited repetitions

## How to Use

1. **Create a New Event**
   - Fill in the basic event information (name, date, time, etc.)
   - Check "Recurring Event"

2. **For Weekly Repetitions**
   - Select "Weekly" from the Recurrence dropdown
   - Check "Limit repetitions to specific number of weeks"
   - Enter the desired number of weeks (1-52)

3. **Example**
   - Original event: Monday, January 1st, 2024
   - Repeat for: 4 weeks
   - Result: Event appears on Jan 1, Jan 8, Jan 15, and Jan 22 (total of 4 occurrences)

## Technical Details

### Date Matching Algorithm
- For limited weekly repetitions, the system checks:
  - Same day of week as original event
  - Target date is not before original date
  - Target date falls within the specified number of weeks
  
### Conflict Detection
- Enhanced to consider limited repetitions when checking for schedule conflicts
- Prevents double-booking during the repetition period

### Data Storage
- New fields are automatically saved to MongoDB
- Backward compatible with existing events (default values applied)

## Testing
- Build completed successfully with no errors
- All existing functionality preserved
- New UI controls properly integrated with existing form styling
