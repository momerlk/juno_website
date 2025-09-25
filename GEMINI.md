# Project Overview

This is a React-based web application for Juno, an e-commerce platform in Pakistan. The application serves as the main website and includes separate dashboards for sellers, administrators, ambassadors, and employees.

**Main Technologies:**

*   **Frontend:** React, Vite, TypeScript, Tailwind CSS
*   **Routing:** `react-router-dom`
*   **State Management:** React Context API for authentication
*   **API Communication:** The frontend communicates with a backend API for data fetching and mutations.

**Architecture:**

The application is divided into several parts:

*   **Main Website:** The public-facing website with information about the Juno app, pricing, and company mission.
*   **Blog:** A blog section with articles.
*   **Seller Dashboard:** A dashboard for sellers to manage their products, orders, and profile.
*   **Admin Dashboard:** A dashboard for administrators to manage the platform.
*   **Ambassador Dashboard:** A dashboard for brand ambassadors.
*   **Work Dashboard:** A dashboard for employees.

# Building and Running

**Prerequisites:**

*   Node.js and npm

**Installation:**

```bash
npm install
```

**Development:**

To start the development server, run:

```bash
npm run dev
```

**Building:**

To build the application for production, run:

```bash
npm run build
```

**Linting:**

To lint the codebase, run:

```bash
npm run lint
```

**Previewing the Production Build:**

To preview the production build locally, run:

```bash
npm run preview
```

# Development Conventions

*   **Styling:** The project uses Tailwind CSS for styling.
*   **Components:** Components are organized by feature/domain (e.g., `seller`, `admin`, `blog`).
*   **Authentication:** Authentication is handled using React's Context API, with separate contexts for each user role (seller, admin, ambassador, work).
*   **API:** The frontend communicates with a backend API. The base URL is configured in `src/api.tsx`.
