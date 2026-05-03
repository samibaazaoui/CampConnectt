# CAMP — Camp Management Platform

A full-stack campsite management application that connects campers with campsite owners and equipment providers. Users can discover campsites, book reservations, shop for gear, join community events, and interact through forums and real-time chat.

The platform now includes an **AI/ML service** that powers smart event recommendations, participation forecasting, and advanced event analytics for admins.

---

## Tech Stack

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| **Backend**  | Java 17, Spring Boot 3.3.4, Spring Security, JPA |
| **Database** | MySQL 8 (`camp_db`, auto-created)                |
| **Auth**     | JWT (jjwt 0.12.6)                                |
| **API Docs** | SpringDoc OpenAPI / Swagger UI                   |
| **Frontend** | Angular 21, TypeScript 5.9, RxJS                 |
| **ML Service** | Python 3.12, FastAPI, scikit-learn, pandas, SQLAlchemy |
| **ML Models** | Collaborative Filtering, SVD, VotingRegressor (GBM + RF) |
| **Testing**  | Vitest (frontend), Spring Boot Test (backend)    |

---

## Project Structure

```
CAMP/
├── Backend/                          # Spring Boot REST API
│   ├── src/main/java/com/camp/backend/
│   │   ├── config/                   # Security, JWT, CORS, OpenAPI, DataSeeder
│   │   ├── controller/               # REST controllers (17 endpoints)
│   │   ├── dto/                      # Request / Response DTOs
│   │   ├── entity/                   # JPA entities & enums
│   │   ├── repository/               # Spring Data repositories
│   │   └── service/                  # Business logic services
│   ├── src/main/resources/
│   │   └── application.yml           # DB, JWT & CORS config
│   └── pom.xml
│
├── Frontend/
│   ├── Backoffice/                   # Angular SPA (admin dashboard + front-office)
│   │   ├── src/app/
│   │   │   ├── components/           # Shared UI (modal, navbar, sidebar)
│   │   │   ├── guards/               # Route guards (admin)
│   │   │   ├── interceptors/         # HTTP interceptors (JWT attach)
│   │   │   ├── layouts/              # Admin & Front layout shells
│   │   │   ├── pages/                # Feature pages (see below)
│   │   │   └── services/             # Angular services matching backend APIs
│   │   └── package.json
│   └── FrontOffice/                  # (Empty — placeholder for future public site)
│
└── ML/                               # Python AI/ML microservice
    ├── main.py                       # FastAPI app — recommendations + prediction endpoints
    ├── evaluate.py                   # Model evaluation script (K-Fold CV, metrics, feature importance)
    ├── seed_data.py                  # Seeds synthetic user interaction data for recommendations
    ├── seed_prediction_data.py       # Seeds synthetic event participation data (200+ events)
    └── requirements.txt              # Python dependencies
```

---

## Domain Model

### Entities
- **User** — `email`, `fullName`, `password`, `role`, `createdAt`
- **Campsite** — `name`, `location`, `capacity`, `nightlyPrice`, `imageUrl`, `owner` (User), `approvalStatus`
- **Reservation** — `user`, `campsite`, `startDate`, `endDate`, `status`
- **Equipment** — `name`, `description`, `quantityInStock`, `unitPrice`, `imageUrl`, `owner` (User), `approvalStatus`
- **EquipmentOrder / EquipmentOrderItem** — order management with status tracking
- **Delivery** — delivery tracking (`DeliveryStatus`)
- **Event** — `title`, `description`, `location`, `startAt`, `endAt`, `createdBy`
- **EventParticipation** — join/leave events (`EventParticipationStatus`)
- **Activity** — activities linked to an event
- **Feedback** — user feedback / reviews
- **ForumPost / ForumComment** — community forum
- **ChatRoom / ChatParticipant / ChatMessage** — real-time messaging
- **Notification** — in-app notifications (`NotificationType`, `NotificationStatus`)

### User Roles
| Role               | Description                          |
| ------------------ | ------------------------------------ |
| `USER`             | Standard camper / explorer           |
| `ADMIN`            | Full platform administration         |
| `CAMPSITE_OWNER`   | Manages owned campsites              |
| `EQUIPMENT_OWNER`  | Manages equipment inventory          |

### Key Enums
`ApprovalStatus` (PENDING / APPROVED / CANCELLED), `ReservationStatus` (PENDING / CONFIRMED / CANCELLED), `DeliveryStatus`, `EquipmentOrderStatus`, `EventParticipationStatus`, `NotificationType`, `NotificationStatus`

---

## Frontend Pages

### Front-Office (public / authenticated users)
| Route              | Page                 |
| ------------------ | -------------------- |
| `/`                | Home                 |
| `/explore-events`  | Browse events        |
| `/forum`           | Community forum      |
| `/shop`            | Equipment shop       |
| `/chat`            | Messaging            |
| `/profile`         | User profile         |

### Back-Office (admin-guarded)
| Route                  | Page                          |
| ---------------------- | ----------------------------- |
| `/admin/dashboard`     | Dashboard                     |
| `/admin/campsites`     | Manage campsites              |
| `/admin/reservations`  | Manage bookings               |
| `/admin/equipment`     | Manage gear                   |
| `/admin/orders`        | Manage orders                 |
| `/admin/users`         | Manage users                  |
| `/admin/events`        | Manage events + AI prediction |
| `/admin/activities`    | Manage activities             |
| `/admin/analytics`     | Event Analytics dashboard     |

---

## AI / ML Service

### Overview
The ML microservice (`ML/`) is a standalone **FastAPI** app running on port **8000**. It connects directly to the same MySQL database and exposes REST endpoints consumed by the Spring Boot backend.

### Features
| Feature | Description |
| ------- | ----------- |
| **Event Recommendations** | Collaborative filtering (SVD + cosine similarity + popularity fallback) per user |
| **Participation Prediction** | Forecasts expected participants & attendance rate for any event |
| **AI Forecast Widget** | Inline prediction in the admin event creation form |
| **Model Evaluation** | K-Fold cross-validation with MAE, RMSE, R², feature importance |

### ML Endpoints
| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/health` | Service health check |
| `GET`  | `/recommendations/{userId}` | Top-N event recommendations for a user |
| `POST` | `/predict-participation` | Predict participants & attendance rate |
| `GET`  | `/model-metrics` | Full model evaluation metrics (CV + feature importance) |

### Model Architecture
The participation prediction model uses a **VotingRegressor** ensemble:
- **GradientBoostingRegressor** — 300 estimators, learning rate 0.04, max depth 4
- **RandomForestRegressor** — 200 estimators, max depth 8

**12 input features:** `month`, `day_of_week`, `hour_of_start`, `duration_hours`, `n_activities`, `is_weekend`, `season`, `time_category`, `log_duration`, `act_x_season`, `act_x_weekend`, `act_x_morning`

**Current CV performance (206 training events):**
- Participants → R² = **0.799** (Bon), MAE = 2.32
- Attendance rate → R² = **0.752** (Bon), MAE = 8.76%

### Starting the ML Service
```bash
cd ML
pip install -r requirements.txt

# Seed training data (run once)
python seed_data.py
python seed_prediction_data.py

# Start the service
python -m uvicorn main:app --reload --port 8000
```

### Evaluate the Model
```bash
cd ML
python evaluate.py
```
Outputs K-Fold CV metrics, feature importance chart, and predicted vs actual comparison.

---

## Getting Started

### Prerequisites
- **Java 17+** (tested with OpenJDK 26)
- **Maven 3.8+** (or use the included `mvnw` wrapper)
- **MySQL 8** running on `localhost:3306` (root, no password by default)
- **Node.js 18+** & **npm 11+**
- **Python 3.12+** with pip (for ML service)

### 1 — Backend
```bash
cd Backend
./mvnw spring-boot:run          # Linux/Mac
mvnw.cmd spring-boot:run        # Windows
```
The API starts on **http://localhost:8080**. Swagger UI at `/swagger-ui.html`.

The `DataSeeder` automatically creates seed accounts on first run:

| Account                | Password   | Role             |
| ---------------------- | ---------- | ---------------- |
| `admin@camp.com`       | `admin123` | ADMIN            |
| `user@camp.com`        | `user123`  | USER             |
| `campsite@owner.com`   | `owner123` | CAMPSITE_OWNER   |
| `equipment@owner.com`  | `owner123` | EQUIPMENT_OWNER  |

### 2 — ML Service
```bash
cd ML
pip install -r requirements.txt
python seed_data.py
python seed_prediction_data.py
python -m uvicorn main:app --reload --port 8000
```
The ML service runs on **http://localhost:8000**.

### 3 — Frontend (Backoffice)
```bash
cd Frontend/Backoffice
npm install
npm start
```
The app runs on **http://localhost:4200**.

---

## API Overview

### Spring Boot — REST Controllers

| Controller                    | Base Path                   |
| ----------------------------- | --------------------------- |
| AuthController                | `/api/auth`                 |
| UserController                | `/api/users`                |
| CampsiteController            | `/api/campsites`            |
| ReservationController         | `/api/reservations`         |
| EquipmentController           | `/api/equipment`            |
| EquipmentOrderController      | `/api/equipment-orders`     |
| DeliveryController            | `/api/deliveries`           |
| EventController               | `/api/events`               |
| EventParticipationController  | `/api/event-participations` |
| ActivityController            | `/api/activities`           |
| FeedbackController            | `/api/feedback`             |
| ForumController               | `/api/forum`                |
| ChatController                | `/api/chat`                 |
| NotificationController        | `/api/notifications`        |
| FileUploadController          | `/api/files`                |
| RecommendationController      | `/api/recommendations`      |
| EventAnalyticsController      | `/api/event-analytics`      |

### Key ML-Proxy Endpoints (via RecommendationController)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/recommendations/{userId}` | Event recommendations for user |
| `POST` | `/api/recommendations/predict-participation` | Predict for new event (manual features) |
| `GET`  | `/api/recommendations/predict-participation/{eventId}` | Predict for existing event |
| `GET`  | `/api/recommendations/model-metrics` | ML model evaluation metrics |

---

## Configuration

Key settings in `Backend/src/main/resources/application.yml`:

| Property                | Default                               |
| ----------------------- | ------------------------------------- |
| `server.port`           | `8080`                                |
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/camp_db` |
| `jwt.expiration`        | `86400000` (24 hours)                 |
| `cors.allowed-origins`  | `http://localhost:4200, http://localhost:3000` |
| `ml.service.url`        | `http://localhost:8000`               |
