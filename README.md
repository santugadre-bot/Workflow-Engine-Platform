# Workflow Engine Platform

A robust, full-stack enterprise platform for agile project management, workflow automation, and team collaboration.

## Features

- **Agile Project Management**: Complete support for Projects, Sprints, Backlogs, and Boards.
- **Dynamic Workflows**: Custom visual workflow builder using ReactFlow for defining complex states and transitions.
- **Task & Issue Tracking**: Rich task cards, dependencies, attachments, sub-tasks, and deep links.
- **Automation Rules**: Event-driven automation engine to trigger actions based on state changes or time.
- **Role-based Access Control (RBAC)**: Fine-grained permissions for Organization Admins, Project Managers, Developers, and Viewers.
- **Real-time Collaboration**: WebSocket integration for live updates and notifications.
- **Analytics & Reporting**: Interactive charts using Recharts for burndowns, velocity, and SLA tracking.
- **Approval Center**: Multi-stage approval queues with SLA enforcement.
- **Performance Optimized**: Production-ready Vite chunk splitting, pre-compression (Brotli/Gzip), React Query caching strategies, and Hibernate batch optimizations.

---

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Vanilla CSS (Custom Design System, Dark Mode)
- **State Management**: Zustand (Global UI), TanStack React Query (Server State)
- **Routing**: React Router v7
- **UI Components**: Headless UI, Lucide React, react-icons
- **Specialized**: ReactFlow (Workflow Builder), dnd-kit (Kanban drag-and-drop), Recharts (Analytics)

### Backend
- **Framework**: Spring Boot 3 + Java 17+
- **Database**: PostgreSQL
- **ORM**: Hibernate / Spring Data JPA
- **Security**: Spring Security + JWT Auth
- **Migrations**: Flyway
- **Real-time**: Spring WebSocket / STOMP

---

## Getting Started

### Prerequisites
- Node.js 20+
- Java 17+
- Maven 3.8+
- PostgreSQL 14+

### 1. Database Setup
Ensure PostgreSQL is running locally on port 5432. The database will be created automatically, or you can create it manually:
```sql
CREATE DATABASE workflow_engine;
```
Configure your credentials in `backend/src/main/resources/application.yml` if they differ from the defaults (user: `postgres`, password: `santu@8496`). Flyway will apply all schema migrations automatically on startup.

### 2. Backend Server
Navigate to the backend directory and run the Spring Boot application:
```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```
The API server will start on `http://localhost:8080`.

### 3. Frontend Client
Navigate to the frontend directory, install dependencies, and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## Architecture Overview

- **Core Module**: Cross-cutting concerns, security config, base entities, and exceptions.
- **Auth Module**: JWT generation, validation, refresh tokens, and user registration.
- **Organization & Project**: Multi-tenant architecture supporting organizations containing multiple projects.
- **Task Module**: Epics, Stories, Bugs, Tasks with states driven by the Workflow module.
- **Agile Module**: Sprints, backlogs, burndown charts, and velocity tracking.
- **Workflow Module**: Custom state machines, transitions, and conditional guard rules.
- **Automation Module**: Webhooks, triggers (e.g., "On transition to Done"), and actions (e.g., "Reassign to QA").

## Building for Production

To build the frontend for production, which includes chunk splitting and Brotli/Gzip pre-compression:
```bash
cd frontend
npm run build
```
The optimized static assets will be output to the `frontend/dist/` directory.

To build the backend executable JAR:
```bash
cd backend
mvn clean package -DskipTests
java -jar target/workflow-engine-*.jar
```

## License
Private - All Rights Reserved.