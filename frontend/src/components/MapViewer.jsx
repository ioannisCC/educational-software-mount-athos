// frontend/src/components/MapViewer.jsx
import React, { useEffect, useRef, useState } from 'react';

const MapViewer = ({ locations, activeLocation, onSelectLocation }) => {
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    // Initialize the map (this is a simple implementation)
    // For a real-world app, you might want to use a library like Leaflet or Google Maps
    
    if (!mapContainerRef.current) return;
    
    // Set background image of Mount Athos map
    mapContainerRef.current.style.backgroundImage = "url('/images/mount-athos-map.jpg')";
    mapContainerRef.current.style.backgroundSize = "contain";
    mapContainerRef.current.style.backgroundRepeat = "no-repeat";
    mapContainerRef.current.style.backgroundPosition = "center";
    
    setMapLoaded(true);
  }, []);
  
  // Handle location selection
  const handleLocationClick = (location) => {
    if (onSelectLocation) {
      onSelectLocation(location);
    }
  };
  
  return (
    <div className="map-viewer-container">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Map of Mount Athos</h5>
        </div>
        <div className="card-body">
          <div 
            ref={mapContainerRef}
            className="map-container"
            style={{ 
              height: '400px', 
              position: 'relative',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            {mapLoaded && locations && locations.map(location => (
              <div
                key={location.id}
                className={`map-marker ${activeLocation?.id === location.id ? 'active' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${location.x}%`,
                  top: `${location.y}%`,
                  width: '20px',
                  height: '20px',
                  backgroundColor: activeLocation?.id === location.id ? 'red' : 'blue',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleLocationClick(location)}
                title={location.name}
              />
            ))}
          </div>
          
          {/* Display information about selected location */}
          {activeLocation && (
            <div className="location-info mt-3">
              <h5>{activeLocation.name}</h5>
              <p>{activeLocation.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapViewer;