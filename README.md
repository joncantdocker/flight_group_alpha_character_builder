# Flight Group Alpha - X-Wing Character Builder

A comprehensive React web application for creating and managing X-Wing miniatures game pilot characters. Features character progression, ship selection with upgrades, pilot specialization paths, and persistent XP tracking.

## 🌟 Live Demo

**[https://joncantdocker.github.io/flight_group_alpha_character_builder/](https://joncantdocker.github.io/flight_group_alpha_character_builder/)**

## ✨ Features

### Character Management
- **Create Characters**: Build pilots with unique callsigns
- **Experience System**: Manage Banked XP, Loadout XP, and Path XP
- **Rank Progression**: Level up characters using XP with automatic cost calculation
- **XP Logging**: Track all XP transactions with timestamps (saved/discarded changes)
- **Import/Export**: Save and share character builds

### Pilot Specialization Paths
- **Path Selection**: Choose from various pilot specialization paths
- **Rank-Based Upgrades**: Automatically gain upgrades based on character rank
- **Path Benefits**: Each path provides unique bonuses and abilities
- **Progression Tracking**: Visual indicators for path advancement

### Ship Configuration
- **Ship Selection**: Choose from comprehensive X-Wing ship roster
- **Upgrade Management**: Configure ship upgrades by slot type
- **Persistent Selection**: Ship choices saved per character
- **Upgrade Filtering**: Smart filtering based on ship compatibility and restrictions

### Data Persistence
- **Character-Specific Storage**: Each character's data stored independently
- **Ship Selection Memory**: Remembers ship choices per character
- **XP Log History**: Persistent transaction history per character
- **Browser Storage**: All data saved locally with no account required

## 🚀 Technology Stack

- **Frontend**: React 18 with functional components and hooks
- **UI**: Custom CSS with X-Wing symbol font integration
- **State Management**: React hooks with localStorage persistence
- **Data Storage**: Browser localStorage (no backend required)
- **Deployment**: GitHub Pages with GitHub Actions CI/CD
- **Development**: Docker containerization for local testing

## 📁 Project Structure

```
flight_group_alpha/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── CharacterBuilder.js    # Main character management
│   │   │   ├── ShipSelector.js        # Ship configuration
│   │   │   ├── XWingSymbols.js        # Symbol rendering
│   │   │   └── ...
│   │   ├── services/           # Data and business logic
│   │   │   ├── apiService.js          # Character CRUD operations
│   │   │   ├── localDataService.js    # localStorage interface
│   │   │   ├── pathUpgradesService.js # Path progression logic
│   │   │   ├── shipService.js         # Ship data management
│   │   │   └── upgradeService.js      # Upgrade logic and filtering
│   │   └── fonts/             # X-Wing symbol fonts
│   ├── public/                # Static game data
│   │   ├── path_upgrades.json # Pilot path definitions
│   │   ├── ship_list.json     # Ship configurations
│   │   ├── upgrades.json      # Upgrade cards database
│   │   └── ...
│   ├── package.json          # Dependencies and scripts
│   └── Dockerfile           # Container configuration
├── .github/workflows/       # GitHub Actions deployment
│   └── deploy.yml          # Automated deployment to GitHub Pages
└── docker-compose.yml      # Local development environment
```

## 🛠️ Prerequisites

- **Docker**: For containerized local development
- **Node.js 18+**: For direct development (optional)
- **Modern Browser**: With localStorage support

## 🚀 Quick Start

### Option 1: Use Live Version (Recommended)
Simply visit: **[https://joncantdocker.github.io/flight_group_alpha_character_builder/](https://joncantdocker.github.io/flight_group_alpha_character_builder/)**

### Option 2: Local Development with Docker

```bash
# Clone the repository
git clone https://github.com/joncantdocker/flight_group_alpha_character_builder.git
cd flight_group_alpha_character_builder

# Start the development environment
docker-compose up --build

# Access the application
open http://localhost:3000
```

### Option 3: Local Development with Node.js

```bash
cd frontend
npm install
npm start

# Application available at http://localhost:3000
```

## 🎮 Usage Guide

### Getting Started
1. **Create a Character**: Click "Create New Character" and enter a callsign
2. **Select a Path**: Choose a pilot specialization path for unique benefits
3. **Add Experience**: Use "Add Banked XP" to give your character experience points
4. **Level Up**: Use "Level Up" to increase rank (costs XP based on target rank)
5. **Transfer XP**: Move XP between Banked, Loadout, and Path categories

### Ship Configuration
1. **Select Ship**: Choose your character's ship from the dropdown
2. **Configure Upgrades**: Select upgrades for each available slot
3. **Save Configuration**: Ship selection is automatically saved per character
4. **Rank-Based Upgrades**: Some upgrades are automatically granted based on character rank

### XP Management
- **Banked XP**: General experience pool for leveling up
- **Loadout XP**: Points available for ship and upgrade purchases
- **Path XP**: Points specific to your chosen specialization path
- **Transfer System**: Move XP between categories as needed

## 🔧 Development

### Adding New Ships
1. Edit `frontend/public/ship_list.json`
2. Add ship definition with slots and statistics
3. Upgrades will automatically filter based on ship compatibility

### Adding New Upgrades
1. Edit `frontend/public/upgrades.json`
2. Include slot type, restrictions, and effects
3. System will handle filtering and availability

### Adding Pilot Paths
1. Edit `frontend/public/path_upgrades.json`
2. Define rank-based benefits and upgrades
3. Include path-specific bonuses and restrictions

### Local Testing
```bash
# Development with hot reload
docker-compose up --build

# Production build test
cd frontend
npm run build
npm install -g serve
serve -s build -l 3000
```

## 🚦 Common Commands

```bash
# Development
docker-compose up --build              # Start development server
docker-compose down                    # Stop containers

# Frontend only
cd frontend
npm start                             # Development server
npm run build                         # Production build
npm test                              # Run tests

# Deployment
git push origin main                  # Auto-deploy to GitHub Pages
```

## 💾 Data Storage

### Browser localStorage Features:
- **Character-Specific Keys**: Each character's data stored separately
- **Ship Selection Memory**: `current_ship_selection_${characterId}`
- **XP Transaction History**: `xp_log_${characterId}`
- **Cross-Session Persistence**: Data survives browser restarts
- **No Account Required**: Everything stored locally

### Data Export/Import:
- **Export Characters**: Copy character data as JSON string
- **Import Characters**: Load characters from exported JSON
- **Backup Strategy**: Regular exports recommended for important characters

## 🎨 Customization

### Styling
- Custom CSS with X-Wing themed design
- Integrated X-Wing symbol font for authentic look
- Responsive layout for desktop and mobile

### Game Data Updates
- JSON files in `public/` directory can be updated
- No code changes required for new ships/upgrades
- Hot reload in development for rapid iteration

## 🔍 Technical Features

### Smart Upgrade Filtering
- **Slot Compatibility**: Only show upgrades that fit ship slots
- **Restriction Checking**: Honor upgrade restrictions and requirements
- **Compound Upgrades**: Handle upgrades that modify ship slots
- **Path Integration**: Include path-granted upgrades automatically

### Character Progression
- **Dynamic XP Costs**: Level-up costs scale with target rank
- **Path Benefits**: Each specialization provides unique advantages
- **Rank Tracking**: Visual progression indicators
- **XP Transaction Log**: Detailed history with rollback on unsaved changes

### State Management
- **Optimistic Updates**: Immediate UI feedback with validation
- **Unsaved Change Tracking**: Prevent data loss with confirmation dialogs
- **Character Switching**: Safe navigation with change detection
- **Error Recovery**: Graceful handling of data corruption

## 🐛 Troubleshooting

### Common Issues

**Characters Not Saving**
- Check browser localStorage permissions
- Ensure sufficient storage space (5-10MB limit)
- Try clearing browser cache

**Ship Data Not Loading**
- Verify internet connection for initial JSON loading
- Check browser console for network errors
- Try hard refresh (Ctrl+F5)

**Upgrades Not Showing**
- Confirm ship selection is saved
- Check upgrade slot compatibility
- Verify upgrade restrictions are met

**XP Log Issues**
- XP changes appear but disappear after refresh: Save character to persist changes
- Old transactions missing: Check if character was saved after changes

## 🌍 Browser Compatibility

- **Chrome 80+**: Full support
- **Firefox 75+**: Full support  
- **Safari 13+**: Full support
- **Edge 80+**: Full support
- **Mobile Browsers**: Responsive design with touch support

## 🔒 Privacy & Security

- **No Data Collection**: All data stays in your browser
- **No Accounts**: No registration or login required
- **Offline Capable**: Works without internet after initial load
- **Export Control**: You control all data backup and sharing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Test locally with Docker: `docker-compose up --build`
4. Submit a pull request with detailed description

### Contributing Game Data
- Ship definitions: Edit `ship_list.json`
- Upgrade cards: Edit `upgrades.json`
- Pilot paths: Edit `path_upgrades.json`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support:
1. Check the browser console for error messages
2. Try clearing localStorage: `localStorage.clear()`
3. Open an issue on GitHub with reproduction steps
4. Join the community for game rules questions

---

**May the Force be with you, pilot!** ✈️⭐