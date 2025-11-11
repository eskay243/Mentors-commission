# Advanced User Filtering Features

## Overview
The Users Management page now includes comprehensive filtering capabilities to help administrators efficiently manage and find users based on various criteria.

## Filter Options

### 🔍 Basic Search
- **Search by Name or Email**: Type any part of a user's name or email address
- **Real-time search**: Results update as you type

### 🎯 Role Filter
- **All Roles**: Show all users
- **Admin**: Show only admin users
- **Mentor**: Show only mentor users  
- **Student**: Show only student users

### 📅 Date Range Filters
- **Joined From**: Filter users who joined on or after this date
- **Joined To**: Filter users who joined on or before this date
- **Combined**: Use both dates to create a specific time range

### 📚 Enrollment Filters
- **Min Enrollments**: Show users with at least this many enrollments
- **Max Enrollments**: Show users with at most this many enrollments
- **Note**: For students, this shows course enrollments. For mentors, this shows assignment count.

### 📞 Phone Status Filter
- **All**: Show all users regardless of phone status
- **Has Phone**: Show only users who have provided a phone number
- **No Phone**: Show only users without a phone number

### 🔄 Sorting Options
- **Sort By**:
  - Join Date (default)
  - Name (alphabetical)
  - Email (alphabetical)
  - Role
- **Order**:
  - Newest First (default)
  - Oldest First

## Quick Filter Presets

### 📚 Course Assignment Filters (Most Important!)

#### 🔍 All Users (No Courses)
Shows ALL users (students, mentors, admins) who have 0 course enrollments or assignments. This is the most comprehensive filter for finding users who need course assignments.

#### 🎓 Students (No Enrollments)
Shows student users who haven't been enrolled in any courses yet - these students need to be assigned to courses.

#### 👨‍🏫 Mentors (No Assignments)
Shows mentor users who haven't been assigned to any students - these mentors are available for new assignments.

### Other Quick Filters

#### 🆕 New Users (7 days)
Shows users who joined in the last 7 days

#### 👨‍🏫 Mentors Only
Shows only mentor users (regardless of assignment status)

#### 📱 Missing Phone
Shows users who haven't provided a phone number

#### ⚡ Recently Active (30 days)
Shows users who joined in the last 30 days

## How to Use

### 1. Basic Filtering
1. Use the search box to find users by name or email
2. Select a role from the dropdown
3. Click "Apply" to see filtered results

### 2. Advanced Filtering
1. Click the "Filters" button to open the advanced options
2. Set your desired filter criteria
3. Click "Apply" to filter results
4. Use "Clear" to reset all filters

### 3. Quick Presets
1. Click any of the colored preset buttons for instant filtering
2. Presets automatically apply the filter and show results

### 4. Filter Management
- **Active Filter Count**: The filter button shows how many filters are currently applied
- **Clear All**: Use the "Clear" button to remove all active filters
- **URL Persistence**: Filters are saved in the URL, so you can bookmark or share filtered views

## Course Assignment Filtering (Primary Use Case)

### Finding Users Without Course Assignments

The most common use case is finding users who need course assignments:

#### 🔍 **All Users (No Courses)** - RECOMMENDED
- **What it shows**: ALL users (students, mentors, admins) with 0 enrollments/assignments
- **When to use**: When you want to see everyone who needs course assignments
- **Perfect for**: Bulk assignment operations and overview

#### 🎓 **Students (No Enrollments)**
- **What it shows**: Only students who haven't been enrolled in any courses
- **When to use**: When you specifically need to assign students to courses
- **Perfect for**: Student onboarding and course enrollment

#### 👨‍🏫 **Mentors (No Assignments)**
- **What it shows**: Only mentors who haven't been assigned to any students
- **When to use**: When you need to assign mentors to students
- **Perfect for**: Mentor-student pairing and workload distribution

### Visual Indicators
- **Red numbers**: Users with 0 enrollments/assignments (highlighted in red)
- **"No courses" / "No assignments"**: Additional text indicators
- **Orange warning message**: Appears when filtering for users without course assignments

## Filter Combinations

You can combine multiple filters for precise results:
- **Example**: Find "Students with no enrollments who joined in the last 30 days"
- **Example**: Find "Mentors with phone numbers, sorted by name"
- **Example**: Find "All users without courses who have phone numbers"

## Performance Notes

- **Enrollment filtering** may be slower for large datasets as it requires counting relationships
- **Date filtering** is optimized and fast
- **Text search** supports partial matching for names and emails
- **Pagination** works with all filters applied

## Tips

1. **Start with quick presets** for common filtering needs
2. **Use date ranges** to focus on specific time periods
3. **Combine role + enrollment filters** to find users needing attention
4. **Use phone filters** to identify incomplete profiles
5. **Sort by join date** to see newest users first

## Technical Details

- All filters are applied server-side for optimal performance
- Filter state is preserved in URL parameters
- Pagination automatically resets when filters change
- Results show total count and current page range
