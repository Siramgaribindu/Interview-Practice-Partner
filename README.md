
# AI Interview Practice Partner

## Overview

AI Interview Practice Partner is an AI-powered web application designed to help users prepare for technical and HR interviews through realistic interview simulations. The platform generates dynamic interview questions, evaluates responses, and provides constructive feedback to improve interview performance and confidence.

## Features

- AI-powered interview simulations
- Technical and HR interview modes
- Real-time conversational interface
- Personalized feedback generation
- User-friendly and responsive design
- Secure data management using Firebase
- Fast and scalable deployment on Vercel

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Node.js

### Database
- Firebase Firestore

### Artificial Intelligence
- Google Gemini API

### Deployment
- Vercel

---

## Project Structure

```
src/
├── components/      # Reusable UI components
├── firebase/        # Firebase configuration
├── lib/             # Utility functions
├── App.tsx          # Main application component
├── main.tsx         # Entry point
├── types.ts         # Type definitions
├── index.css        # Global styling

server.ts            # Backend server
package.json         # Dependencies and scripts
vite.config.ts       # Vite configuration
```

---

## Setup Instructions

### Prerequisites

Before running the project, ensure you have:

- Node.js (v18 or above)
- npm
- Firebase Project
- Google Gemini API Key

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/interview-practice-partner.git
cd interview-practice-partner
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the project root and add the required credentials:

```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_api_key
```

#### 4. Start Development Server

```bash
npm run dev
```

#### 5. Open in Browser

```text
http://localhost:5173
```

---

## Architecture Notes

The application follows a modern client-server architecture.

### Workflow

1. User interacts with the React frontend.
2. User submits responses or requests interview practice.
3. The frontend sends requests to the backend service.
4. The backend communicates with the Google Gemini API.
5. Gemini generates interview questions and feedback.
6. Firebase Firestore stores required application data.
7. Results are returned to the frontend and displayed to the user.

### Architecture Flow

```
User
  │
  ▼
React Frontend
  │
  ▼
Node.js Backend
  │
  ├────────► Google Gemini API
  │
  └────────► Firebase Firestore
  │
  ▼
Response to User
```

---

## Design Decisions

### React + TypeScript

React was selected to build a modular and reusable user interface. TypeScript improves code reliability through static type checking and better developer experience.

### Vite

Vite was chosen because it provides fast development startup, hot module replacement, and optimized production builds.

### Firebase Firestore

Firebase Firestore was selected for its ease of integration, scalability, and real-time data capabilities.

### Google Gemini API

Gemini provides advanced natural language understanding and generation, making it suitable for conducting realistic interview conversations and generating meaningful feedback.

