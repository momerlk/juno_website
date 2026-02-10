# Chapters V2 - Cohort Based Internship System

## Overview
This document outlines the changes made to the Chapter/Ambassador system to support the cohort-based internship structure.

## Data Model Changes

### ChapterForm (Ambassador Profile)
Updated to include cohort-specific fields:
- `SecondaryRole`: The specific role chosen by the intern (Content Creator, Content Editor, Outreach).
- `Cohort`: Identifier for the cohort (e.g., "Winter 2025").
- `IsChapterHead`: Boolean flag to identify chapter heads.
- `ApplyChapterHead`: Boolean flag if the applicant wants to be considered for Chapter Head.
- `ChapterHeadMotivation`: Paragraph explaining why they are suited for Chapter Head.
- `InstagramHandle`: To track social media activity.
- `CreatedAt`: Timestamp for record keeping.
*Removed `TechInterest` and `FashionInterest`.*

### AmbassadorTask
Updated to categorize tasks:
- `TaskType`: Distinguishes between "Team" and "Individual" tasks.
- `WeekNumber`: Associates the task with a specific week of the cohort (1-6).

### AmbassadorWeeklyReport (New Model)
Introduced to track weekly progress:
- `ID`: Unique identifier.
- `AmbassadorID`: ID of the ambassador submitting the report.
- `WeekNumber`: The week this report corresponds to.
- `TasksSummary`: Text description of work done.
- `ProofFiles`: List of URLs (Drive links, images) as proof of work.
- `CreatedAt`: Submission timestamp.

## API Changes

### Endpoints

#### GET /chapter-forms
- Returns updated `ChapterForm` structure.

#### POST /chapter-forms
- Accepts new fields: `secondary_role`, `cohort`, `instagram_handle`.

#### POST /ambassador/reports
- **Description**: Submit a weekly report.
- **Payload**: `AmbassadorWeeklyReport` object.
- **Auth**: Requires Ambassador JWT.

#### GET /ambassador/reports
- **Description**: Get reports for the authenticated ambassador.
- **Auth**: Requires Ambassador JWT.

#### GET /admin/ambassador/reports/{institute}
- **Description**: Get all reports for a specific institute (for Chapter Heads/Admin).
- **Auth**: Requires Admin/Chapter Head privileges (Logic to be implemented).

#### POST /admin/ambassador/tasks
- **Description**: Create a task with `task_type` and `week_number`.

## Work Structure
- **Duration**: 6 Weeks.
- **Reporting**: Weekly reports due by Friday 8 PM.
- **Roles**: 
    - Content Creator: Shoot reels.
    - Content Editor: Edit reels.
    - Outreach: Contact brands.
