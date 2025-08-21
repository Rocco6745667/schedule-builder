# Multiday Events Feature

## Overview
The Schedule Builder now supports creating multiday events that can span multiple days, with options for timed or all-day events.

## Features Added

### 1. Multiday Event Creation
- **Multi-day Checkbox**: Enable/disable multiday functionality
- **End Date Field**: Appears when multiday is enabled, with validation to ensure end date is after start date
- **Date Range Display**: Shows "Start Date - End Date" format in various views

### 2. All-Day Event Support
- **All-Day Checkbox**: Creates events without specific times
- **Smart Display**: All-day events appear in the first hour slot (0:00) in week view
- **Visual Distinction**: All-day events have italic styling and border highlight

### 3. Enhanced User Interface
- **Dynamic Labels**: Date field changes to "Start Date" when multiday is enabled
- **Conditional Fields**: Time fields are hidden for all-day events
- **Smart Validation**: 
  - End date must be after or equal to start date
  - Time validation skipped for all-day events
  - Multiday events require end date when enabled

### 4. Calendar Display Enhancements
- **Week View**: Multiday events appear on all relevant days
- **Month View**: Events span across multiple date cells
- **List View**: Shows date ranges and multiday indicators
- **Tooltips**: Enhanced with multiday and all-day information

### 5. Conflict Detection
- **Multiday Conflicts**: Checks for overlaps across the entire date range
- **All-Day Conflicts**: All-day events conflict with any timed event on the same day
- **Smart Logic**: Considers both single-day and multiday event overlaps

### 6. Data Model Updates
- **endDate**: String field for the end date of multiday events
- **isMultiDay**: Boolean flag indicating if event spans multiple days
- **allDay**: Boolean flag for all-day events
- **Backward Compatibility**: Existing events work unchanged

## How to Use

### Creating a Regular Single-Day Event
1. Fill in event name, date, start time, end time
2. Leave "Multi-day event" and "All-day event" unchecked
3. Click "Add Event"

### Creating a Multiday Timed Event
1. Fill in event name and start date
2. Check "Multi-day event"
3. Select the end date
4. Set start and end times (applied to each day)
5. Click "Add Event"

### Creating an All-Day Event
1. Fill in event name and date
2. Check "All-day event"
3. Optionally check "Multi-day event" for multi-day all-day events
4. If multiday, select end date
5. Click "Add Event"

### Creating a Multi-Day All-Day Event
1. Fill in event name and start date
2. Check both "Multi-day event" and "All-day event"
3. Select the end date
4. Click "Add Event"

## Examples

### Single-Day Timed Event
- Name: "Team Meeting"
- Date: January 15, 2024
- Time: 2:00 PM - 4:00 PM
- Result: Appears on Jan 15 from 2-4 PM

### Multi-Day Timed Event
- Name: "Conference"
- Start Date: January 15, 2024
- End Date: January 17, 2024
- Time: 9:00 AM - 5:00 PM
- Result: Appears Jan 15-17, each day from 9 AM-5 PM

### All-Day Event
- Name: "Holiday"
- Date: January 15, 2024
- All-day: Yes
- Result: Appears all day on Jan 15

### Multi-Day All-Day Event
- Name: "Vacation"
- Start Date: January 15, 2024
- End Date: January 20, 2024
- All-day: Yes
- Result: Appears all day Jan 15-20

## Technical Details

### Date Range Logic
- Uses enhanced `datesMatch()` function that checks if target date falls within event's date range
- Handles both recurring and non-recurring multiday events
- Optimized for performance with date comparisons

### Visual Indicators
- **All-day events**: Italic font, white border
- **Multiday events**: Left border accent
- **Tooltips**: Show full date range and event type information

### Conflict Detection Algorithm
1. Check if dates overlap (considering multiday ranges)
2. For all-day events, any time overlap = conflict
3. For timed events, check actual time overlap
4. Consider recurring patterns and limited repetitions

### Database Schema
```javascript
{
  // Existing fields...
  endDate: String,        // End date for multiday events
  isMultiDay: Boolean,    // Flag for multiday events
  allDay: Boolean,        // Flag for all-day events
}
```

## Compatibility
- ✅ Backward compatible with existing single-day events
- ✅ Works with existing recurring event feature
- ✅ Maintains all existing calendar views and functionality
- ✅ API endpoints unchanged - new fields automatically handled

## Testing
- Build completed successfully with no errors
- All existing functionality preserved
- Enhanced form validation working correctly
- Calendar displays properly handle new event types
