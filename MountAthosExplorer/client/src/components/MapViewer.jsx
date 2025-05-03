import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, Button, Chip, Tooltip } from '@mui/material';
import { LocationOn, Info, Timeline, Church } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom marker icons
const defaultIcon = new L.Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const monasteryIcon = new L.Icon({
  iconUrl: '/images/icons/monastery-marker.png', // Create this icon
  shadowUrl: iconShadow,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Mount Athos center coordinates
const CENTER_POSITION = [40.2631, 24.2178];
const ZOOM_LEVEL = 12;

// Map bounds to restrict panning
const BOUNDS = [
  [40.1, 24.0], // Southwest
  [40.4, 24.4], // Northeast
];

// Component to animate to a specific location
function FlyToMarker({ position }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, {
        duration: 1.5,
      });
    }
  }, [map, position]);
  
  return null;
}

// Main component
const MapViewer = ({ points = [], onMarkerClick, selectedPoint = null }) => {
  const [loading, setLoading] = useState(true);
  const [mapPoints, setMapPoints] = useState([]);
  const mapRef = useRef(null);
  
  useEffect(() => {
    // If no points provided, fetch from API
    if (points.length === 0) {
      // Simulated API call
      setTimeout(() => {
        const dummyPoints = [
          {
            id: 1,
            name: 'Great Lavra Monastery',
            position: [40.1697, 24.3775],
            type: 'monastery',
            founded: 963,
            description: 'The first monastery built on Mount Athos, founded by Saint Athanasius the Athonite.',
            image: '/images/monasteries/great-lavra.jpg',
          },
          {
            id: 2,
            name: 'Vatopedi Monastery',
            position: [40.3119, 24.2083],
            type: 'monastery',
            founded: 972,
            description: 'One of the oldest and largest monasteries on Mount Athos.',
            image: '/images/monasteries/vatopedi.jpg',
          },
          {
            id: 3,
            name: 'Athos Peak',
            position: [40.1572, 24.3297],
            type: 'landmark',
            elevation: 2033,
            description: 'The highest point of the peninsula, offering spectacular views.',
            image: '/images/landmarks/athos-peak.jpg',
          },
        ];
        
        setMapPoints(dummyPoints);
        setLoading(false);
      }, 1000);
    } else {
      setMapPoints(points);
      setLoading(false);
    }
  }, [points]);
  
  // Get icon based on point type
  const getIconForType = (type) => {
    switch (type) {
      case 'monastery':
        return monasteryIcon;
      default:
        return defaultIcon;
    }
  };
  
  // Handle marker click
  const handleMarkerClick = (point) => {
    if (onMarkerClick) {
      onMarkerClick(point);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        height: 500, 
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <MapContainer
        center={CENTER_POSITION}
        zoom={ZOOM_LEVEL}
        style={{ height: '100%', width: '100%' }}
        maxBounds={BOUNDS}
        maxBoundsViscosity={1.0}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mapPoints.map((point) => (
          <Marker
            key={point.id}
            position={point.position}
            icon={getIconForType(point.type)}
            eventHandlers={{
              click: () => handleMarkerClick(point),
            }}
          >
            <Popup>
              <Box sx={{ textAlign: 'center', maxWidth: 200 }}>
                {point.image && (
                  <img 
                    src={point.image} 
                    alt={point.name} 
                    style={{ 
                      width: '100%', 
                      height: 120, 
                      objectFit: 'cover',
                      borderRadius: 4,
                      marginBottom: 8,
                    }} 
                  />
                )}
                <Typography variant="subtitle1" fontWeight="bold">
                  {point.name}
                </Typography>
                {point.founded && (
                  <Chip 
                    size="small" 
                    icon={<Timeline />} 
                    label={`Founded ${point.founded}`} 
                    sx={{ mb: 1 }} 
                  />
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {point.description}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => handleMarkerClick(point)}
                >
                  Learn More
                </Button>
              </Box>
            </Popup>
          </Marker>
        ))}
        
        {selectedPoint && <FlyToMarker position={selectedPoint.position} />}
      </MapContainer>
    </Paper>
  );
};

export default MapViewer;