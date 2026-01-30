# Ambassador Portal API Specification

This document details the endpoints for the Ambassador Portal, including authentication, dashboard access, team management, and administrative functionality.

## 1. Public Utilities

### 1.1. Get Institutes

*   **Endpoint:** `GET /api/v1/institutes`
*   **Description:** Retrieves a list of all unique institutes that have registered ambassadors or chapter forms. Useful for dropdowns or filtering.
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: A JSON array of institute names.
        ```json
        [
            "LUMS",
            "NUST",
            "FAST",
            "IBA"
        ]
        ```
*   **Error Responses:**
    *   `500 Internal Server Error`: If an unexpected error occurs.

### 1.2. Institute Ranking

*   **Endpoint:** `GET /api/v1/ambassador/ranking`
*   **Description:** Retrieves a ranking of institutes based on the number of registered users or chapter form submissions. Aggregates data to show which institutes are performing best.
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: A JSON array of ranking objects.
        ```json
        [
            {
                "institute": "LUMS",
                "count": 150,
                "rank": 1
            },
            {
                "institute": "NUST",
                "count": 120,
                "rank": 2
            }
        ]
        ```
*   **Error Responses:**
    *   `500 Internal Server Error`: If an unexpected error occurs during aggregation.

### 1.3. Get Ambassador Data (Public Lookup)

*   **Endpoint:** `GET /api/v1/ambassador/data`
*   **Description:** Retrieves the chapter form data and information for a specific person based on their phone number. This is a public lookup, often used to check application status or details.
*   **Query Parameters:**
    *   `phone_number`: The phone number to search for (e.g., `+923001234567`).
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: The detailed chapter form data.
        ```json
        {
            "id": "uuid-string",
            "name": "Jane Doe",
            "phone": "+923001234567",
            "institute": "LUMS",
            "year": "Junior",
            "gender": "Female",
            "role": "Ambassador",
            "tech_interest": 8,
            "fashion_interest": 9,
            "commitment_hours": "10-15",
            "motivation": 10,
            "experience_link": "https://linkedin.com/in/janedoe",
            "final_answer": "I want to lead the change."
        }
        ```
*   **Error Responses:**
    *   `404 Not Found`: If no data is found for the given phone number.
    *   `400 Bad Request`: If the phone number is missing.

## 2. Authentication

### 2.1. Ambassador Login

*   **Endpoint:** `POST /api/v1/ambassador/login`
*   **Description:** Authenticates an ambassador using their phone number. If the phone number matches an approved chapter form/ambassador record, a JWT token is returned.
*   **Request Body:**
    ```json
    {
        "phone_number": "+923001234567"
    }
    ```
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: The JWT token and ambassador details.
        ```json
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR...",
            "ambassador": {
                "id": "uuid-string",
                "name": "Jane Doe",
                "phone": "+923001234567",
                "institute": "LUMS",
                "role": "Ambassador"
                // ... other fields
            }
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If the request body is invalid.
    *   `401 Unauthorized`: If the phone number is not found or not authorized.

## 3. Ambassador Portal (Protected)

All endpoints in this section require the `Authorization` header with a valid Bearer token obtained from the login endpoint.

**Header:** `Authorization: Bearer <token>`

### 3.1. Dashboard

*   **Endpoint:** `GET /api/v1/ambassador/dashboard`
*   **Description:** Retrieves the main dashboard data for the authenticated ambassador, including their own profile details and a list of their teammates.
*   **Success Response:**
    *   Code: `200 OK`
    *   Content:
        ```json
        {
            "ambassador": {
                "id": "uuid-string",
                "name": "Jane Doe",
                "institute": "LUMS",
                "role": "Head"
                // ...
            },
            "team_mates": [
                {
                    "id": "uuid-2",
                    "name": "John Smith",
                    "role": "Member",
                    "phone": "+923..."
                    // ...
                }
            ]
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the token is missing or invalid.

### 3.2. My Team

*   **Endpoint:** `GET /api/v1/ambassador/team`
*   **Description:** Retrieves a list of team members (other ambassadors) belonging to the same institute as the authenticated ambassador.
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: A list of ambassador objects.
        ```json
        [
            {
                "id": "uuid-1",
                "name": "Team Member 1",
                "role": "Vice Head",
                "phone": "+923..."
            },
            {
                "id": "uuid-2",
                "name": "Team Member 2",
                "role": "Member",
                "phone": "+923..."
            }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.

### 3.3. Get Tasks

*   **Endpoint:** `GET /api/v1/ambassador/tasks`
*   **Description:** Retrieves the list of tasks assigned to the authenticated ambassador's institute (or all institutes).
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: A list of task objects.
        ```json
        [
            {
                "id": "task-uuid-1",
                "title": "Onboard 5 Students",
                "description": "Get 5 students from your batch to sign up.",
                "deadline": "2023-11-01T23:59:59Z",
                "status": "pending",
                "reward_points": 50,
                "target_institute": "LUMS",
                "created_at": "2023-10-20T10:00:00Z"
            }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.

### 3.4. Institute Users

*   **Endpoint:** `GET /api/v1/ambassador/users`
*   **Description:** Retrieves public profiles of all users registered from the same institute as the authenticated ambassador. Includes engagement metrics like swipe counts.
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: A JSON array of user profiles.
        ```json
        [
            {
                "id": "user-uuid-1",
                "name": "Student Name",
                "avatar": "https://...",
                "phone_number": "+92300...",
                "verification_status": "verified",
                "age": 21,
                "swipe_count": 45,
                "registered_at": "2023-10-25T14:30:00Z"
            }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.

## 4. Admin Functionality

### 4.1. Create Ambassador Task

*   **Endpoint:** `POST /api/v1/admin/ambassador/tasks`
*   **Description:** Allows an admin to create and assign tasks to ambassadors.
*   **Security:** Requires Admin Authentication (Bearer Token with admin privileges).
*   **Request Body:**
    ```json
    {
        "title": "Social Media Share",
        "description": "Share the latest post on your story.",
        "deadline": "2023-11-05T00:00:00Z",
        "target_institute": "LUMS", // Optional: "All" or specific institute
        "reward_points": 10
    }
    ```
*   **Success Response:**
    *   Code: `201 Created`
    *   Content: The created task object.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input data.
    *   `401 Unauthorized`: If the user is not an admin.