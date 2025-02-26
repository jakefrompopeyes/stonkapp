# StonkApp

A full-stack application with a Node.js Express backend and Next.js TypeScript frontend for searching and viewing stock information.

## Project Structure

- `backend/` - Node.js Express server with Polygon.io API integration
- `frontend/` - Next.js application with TypeScript and Tailwind CSS

## Technologies Used

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- Polygon.io API for stock data
- Node-cache for API response caching

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Axios for API requests

## Features

- Search for stocks by ticker symbol or company name
- View detailed company information
- See stock price history
- Read latest news about stocks
- Dark mode support
- Responsive design for all devices

## Getting Started

### Quick Start (Recommended)

1. Install all dependencies from the root directory:
   ```
   npm run install:all
   ```

2. Start both backend and frontend servers with a single command:
   ```
   npm run dev
   ```

The backend server will run on http://localhost:5000 and the frontend will run on http://localhost:3000.

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Make sure your Polygon.io API key is set in the `.env` file:
   ```
   POLYGON_API_KEY=your_api_key_here
   ```

5. Start the development server:
   ```
   npm run dev
   ```

The backend server will run on http://localhost:5000.

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with the backend API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

The frontend application will run on http://localhost:3000.

## API Endpoints

- `GET /api/stocks/search?query=<search_term>` - Search for stocks
- `GET /api/stocks/details/:ticker` - Get detailed information for a stock
- `GET /api/stocks/prices/:ticker` - Get price history for a stock
- `GET /api/stocks/news/:ticker` - Get latest news for a stock

## Deployment

The frontend is configured for deployment on Vercel. 