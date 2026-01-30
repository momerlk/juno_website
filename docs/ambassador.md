# Ambassador Portal API Specification

This document details the endpoints for the Ambassador Portal and related Admin functionality.

## 1. Institute Ranking

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

## 2. Get Ambassador Data

*   **Endpoint:** `GET /api/v1/ambassador/data`
*   **Description:** Retrieves the chapter form data and information for a specific person based on their phone number.
*   **Query Parameters:**
    *   `phone_number`: The phone number to search for (e.g., `+923001234567`).
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: The detailed chapter form data.
        ```json
        {
            "id": "uuid-string",
            "name": "Jane Doe",
            "phone_number": "+923001234567",
            "institute": "LUMS",
            "role": "Ambassador",
            "submission_date": "2023-10-27T10:00:00Z",
            "details": {
                // ... dynamic form fields
            }
        }
        ```
*   **Error Responses:**
    *   `404 Not Found`: If no data is found for the given phone number.
    *   `400 Bad Request`: If the phone number is missing or invalid.

## 3. My Team

*   **Endpoint:** `GET /api/v1/ambassador/team`
*   **Description:** Retrieves a list of team members (other ambassadors) belonging to the same institute as the authenticated ambassador.
*   **Security:** Requires Bearer Auth with an Ambassador Token.
*   **Success Response:**
    *   Code: `200 OK`
    *   Content: A list of ambassador summaries.
        ```json
        [
            {
                "id": "uuid-1",
                "name": "Team Member 1",
                "role": "Vice Head",
                "phone_number": "+923..."
            },
            {
                "id": "uuid-2",
                "name": "Team Member 2",
                "role": "Member",
                "phone_number": "+923..."
            }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.

## 4. Get Tasks

*   **Endpoint:** `GET /api/v1/ambassador/tasks`
*   **Description:** Retrieves the list of tasks assigned to the authenticated ambassador.
*   **Security:** Requires Bearer Auth with an Ambassador Token.
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
                "reward_points": 50
            }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.

## 5. Admin: Create Ambassador Task

*   **Endpoint:** `POST /api/v1/admin/ambassador/tasks`
*   **Description:** Allows an admin to create and assign tasks to ambassadors.
*   **Security:** Requires Admin Authentication.
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
