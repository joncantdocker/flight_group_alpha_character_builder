# Flight Group Alpha - Lightweight Edition

A modern lightweight React web application for flight route management. All data is stored locally in the browser - no backend or database required!

## 🚀 Technology Stack

- **Frontend**: React 18 with React Router
- **Data Storage**: Browser localStorage
- **Containerization**: Docker (Frontend Only)
- **State Management**: React Hooks + localStorage

## 📁 Project Structure

```
flight_group_alpha/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # Local data service layer
│   │   ├── App.js          # Main React component
│   │   └── index.js        # React entry point
│   ├── public/             # Static assets
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container config
├── docker-compose.frontend-only.yml  # Lightweight container setup
├── backend/                 # (Optional - not used in lightweight mode)
├── database/               # (Optional - not used in lightweight mode)
└── README.md              # This file
```

## 🛠️ Prerequisites

- Docker (for containerized deployment)
- OR Node.js 16+ (for local development)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

#### Simple Frontend-Only Deployment
```bash
cd frontend
docker build -t flight-group-alpha .
docker run -p 3000:3000 flight-group-alpha
```

#### Using Docker Compose
```bash
docker-compose -f docker-compose.frontend-only.yml up --build
```

### Option 2: Local Development

```bash
cd frontend
npm install
npm start
```

### 3. Access the Application

- **Application**: http://localhost:3000

## 🧪 Testing the Setup

1. Open http://localhost:3000 in your browser
2. You should see the Flight Group Alpha homepage with a green status indicator
3. Try adding, editing, and deleting flight routes
4. Data will persist across browser sessions (stored in localStorage)

## 📚 Features

### Flight Route Management
- **Create**: Add new flight routes with title, description, and status
- **Read**: View all stored flight routes in a clean interface
- **Update**: Edit existing flight routes inline
- **Delete**: Remove flight routes with confirmation
- **Persist**: All data automatically saved to localStorage

### User Experience
- Real-time updates without page refresh
- Clean, responsive interface
- Status indicators for system health
- Form validation and error handling

## 🔧 Development

### Adding New Features
```bash
cd frontend

# Install new packages
npm install package-name

# Start development server
npm start

# Build for production
npm run build
```

### Local Data Storage
The application uses a custom `localDataService` that:
- Stores data in browser localStorage
- Provides async API-like interface
- Includes sample data initialization
- Simulates network delays for realistic feel

## 🚦 Common Commands

```bash
# Development mode
cd frontend && npm start

# Production build
cd frontend && npm run build

# Docker build
docker build -t flight-app frontend/

# Docker run
docker run -p 3000:3000 flight-app

# Docker Compose (frontend only)
docker-compose -f docker-compose.frontend-only.yml up
```

## 🔐 Data Storage Notes

### Browser localStorage:
- Data persists across browser sessions
- Limited to ~5-10MB per origin
- Cleared when user clears browser data
- Domain-specific (not shared across domains)

### For Production:
1. Consider implementing data export/import features
2. Add backup/restore functionality
3. Implement data validation
4. Consider progressive web app (PWA) features for offline support

## 🛠️ Customization

### Adding New Components
1. Create component in `frontend/src/components/`
2. Import and use in your routes or other components
3. Update routing in `App.js` if needed

### Extending Data Models
1. Modify the data structure in `localDataService.js`
2. Update component forms and displays
3. Consider adding migration logic for existing users

### Adding Authentication
The `localDataService` includes basic user management:
- User registration and login
- Session management
- Simple password validation

## � Sample Data

The application includes sample flight routes:
- Flight Route Alpha-1 (LAX to JFK)
- Flight Route Beta-2 (ORD to DFW) 
- Flight Route Gamma-3 (LAX to LHR)

## 🐛 Troubleshooting

### Common Issues:

1. **Data not persisting**
   - Check if localStorage is enabled in browser
   - Ensure you're on the same domain/port
   - Check browser storage limits

2. **App not loading**
   - Check console for JavaScript errors
   - Verify all dependencies are installed: `npm install`
   - Clear browser cache and try again

3. **Docker build issues**
   - Ensure Docker is running
   - Check Dockerfile syntax
   - Try rebuilding without cache: `docker build --no-cache`

## 🌟 Benefits of Lightweight Architecture

- **Zero Infrastructure**: No database servers or backend APIs to maintain
- **Fast Deployment**: Single container or static file deployment
- **Offline Capable**: Works without internet connection once loaded
- **Privacy Friendly**: All data stays in user's browser
- **Cost Effective**: No server-side resources needed
- **Simple Backup**: Users can export/import their data

## 🔄 Migration from Full-Stack

If you want to upgrade to the full backend later:
1. The backend and database code is still available in the project
2. Modify `apiService.js` to use HTTP endpoints instead of localStorage
3. Deploy backend services using the existing Docker configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes to the frontend
4. Test locally with `npm start`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
1. Check browser console for error messages
2. Verify localStorage is working in your browser
3. Try clearing browser data and reloading
4. Open an issue on GitHub

---

Enjoy your lightweight flight management app! ✈️