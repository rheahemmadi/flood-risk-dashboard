# Flood Risk Dashboard

A comprehensive flood risk dashboard that integrates GloFAS (Global Flood Awareness System) and Google Flood Hub data to provide real-time flood risk assessments and visualizations.

## 🎯 Project Overview

This platform provides a user-facing web application that functions as a flood risk dashboard, integrating and visualizing data from:

- **GloFAS (Early Warning System)**: Global, long-range forecast data with RAG (Red/Amber/Green) risk alerts
- **Google Flood Hub**: High-resolution inundation maps for specific high-risk areas

## 🏗️ Architecture

### Project Structure
```
flood-risk-dashboard/
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── app/           # Next.js app routes
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and types
│   └── package.json
├── backend/                # API server (future)
└── README.md
```

### Data Flow
1. **GloFAS Integration**: Analyzes river discharge forecasts against flood thresholds
2. **Risk Assessment**: Generates RAG alerts for specific geographic locations
3. **Google Flood Hub**: Provides detailed inundation polygons for high-risk areas
4. **AI Insights**: OpenAI-powered analysis for high-risk alerts

## 🚀 Features

### Core Functionality
- **Interactive Map**: Leaflet-based map with risk alert visualization
- **Real-time Data**: Live updates from GloFAS and Google Flood Hub
- **Risk Filtering**: Filter alerts by risk level, date, and region
- **Search & Navigation**: Find and zoom to specific locations
- **Date Navigation**: Step through forecast data (next 5 days)

### Advanced Features
- **AI-Powered Insights**: Generate contextual analysis for high-risk alerts
- **Inundation Mapping**: Visualize predicted flood extents
- **Marker Clustering**: Efficient display of multiple alerts
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Leaflet, React-Leaflet
- **Icons**: Lucide React
- **Build System**: Turbo (Monorepo)
- **Package Manager**: npm workspaces

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flood-risk-dashboard
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🏃‍♂️ Development

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting
npm run type-check   # Run TypeScript type checking
```

### Project Structure
- `frontend/src/app/` - Next.js app routes
- `frontend/src/components/` - React components
- `frontend/src/lib/` - Utilities and types
- `backend/` - API server (future implementation)

## 🗺️ Map Features

### GloFAS Data Layer
- RAG risk alerts displayed as colored circles
- Marker clustering for readability
- Click-to-view detailed information
- Real-time forecast data integration

### Google Flood Hub Integration
- Inundation polygon visualization
- Nearest neighbor search for gauge matching
- High-resolution flood extent mapping
- Confidence level indicators

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the `apps/web` directory:

```env
# API Keys (when implementing)
NEXT_PUBLIC_GLOFAS_API_URL=
NEXT_PUBLIC_GOOGLE_FLOOD_HUB_API_KEY=
OPENAI_API_KEY=

# Map Configuration
NEXT_PUBLIC_MAP_CENTER_LAT=20
NEXT_PUBLIC_MAP_CENTER_LNG=0
NEXT_PUBLIC_MAP_ZOOM=2
```

## 📊 Data Models

### GloFAS Alert
```typescript
interface GloFASAlert {
  id: string;
  coordinates: { lat: number; lng: number };
  riskLevel: 'red' | 'amber' | 'green';
  returnPeriod: number;
  forecastDate: string;
  trend: 'rising' | 'falling' | 'stable';
  dischargeValue: number;
  thresholdValue: number;
}
```

### Inundation Data
```typescript
interface InundationData {
  gaugeId: string;
  coordinates: { lat: number; lng: number };
  polygon: GeoJSON.Polygon;
  confidence: number;
  forecastDate: string;
}
```

## 🎨 UI Components

The project includes a comprehensive set of reusable components:

- **Button**: Multiple variants and sizes
- **RiskLevelBadge**: Color-coded risk indicators
- **LoadingSpinner**: Loading states
- **SearchBar**: Location search functionality
- **DateNavigator**: Forecast date navigation
- **FilterPanel**: Alert filtering controls
- **InfoPanel**: Detailed alert information
- **TrendIndicator**: Forecast trend visualization

## 🔮 Future Enhancements

- [ ] Historical flood data integration
- [ ] Weather data overlay
- [ ] User authentication and preferences
- [ ] Export functionality (PDF reports)
- [ ] Mobile app development
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- European Centre for Medium-Range Weather Forecasts (ECMWF) for GloFAS data
- Google for Flood Hub API
- OpenStreetMap contributors for map data
- The open-source community for the amazing tools used in this project 