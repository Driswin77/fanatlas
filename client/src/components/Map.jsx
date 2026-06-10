import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchFansMap } from '../utils/api';
import { X, Layers } from 'lucide-react';

// Create a custom icon for markers
const createCustomIcon = (fan) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${fan.primaryColor || '#1a202c'};
        border: 2px solid white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
        position: relative;
        background-image: url('${fan.photoUrl || ''}');
        background-size: cover;
        background-position: center;
      ">
        <span style="
          position: absolute;
          bottom: -5px;
          right: -5px;
          font-size: 16px;
          background: rgba(255,255,255,0.8);
          border-radius: 50%;
          padding: 1px;
        ">${fan.flagEmoji || '⚽'}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

function LocationMarker({ userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 13, {
        animate: true,
        duration: 1.5
      });
    }
  }, [userLocation, map]);

  return userLocation === null ? null : (
    <Marker 
      position={[userLocation.lat, userLocation.lng]}
      icon={L.divIcon({
        className: 'user-location-marker',
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })}
    >
    </Marker>
  );
}

function MapEvents({ onMapClick, setBounds }) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
    moveend() {
      setBounds(map.getBounds());
    }
  });
  
  // Set initial bounds
  useEffect(() => {
    setBounds(map.getBounds());
  }, [map, setBounds]);

  return null;
}

const MapComponent = ({ onMapClick, userLocation }) => {
  const [fans, setFans] = useState([]);
  const [bounds, setBounds] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mapStyle, setMapStyle] = useState('dark');

  useEffect(() => {
    if (!bounds) return;
    
    const loadFans = async () => {
      try {
        const data = await fetchFansMap(bounds);
        setFans(data);
      } catch (err) {
        console.error('Failed to load map pins');
      }
    };
    
    loadFans();

    window.addEventListener('fanUpdated', loadFans);
    return () => window.removeEventListener('fanUpdated', loadFans);
  }, [bounds]);

  return (
    <>
    <div className="absolute top-4 right-4 z-[400]">
      <button 
        onClick={() => setMapStyle(prev => prev === 'dark' ? 'satellite' : 'dark')}
        className="glass-panel p-3 rounded-full shadow-lg hover:bg-gray-800/80 transition-colors flex items-center justify-center bg-gray-900/80"
        title="Toggle Map Style"
      >
        <Layers className="w-6 h-6 text-[#00f3ff]" />
      </button>
    </div>

    <MapContainer 
      center={[20, 0]} 
      zoom={3} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={false}
      minZoom={2}
      maxBounds={[[-90, -180], [90, 180]]}
    >
      <TileLayer
        attribution={mapStyle === 'dark' ? '&copy; OpenStreetMap contributors' : '&copy; Google Maps'}
        url={
          mapStyle === 'dark' 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        }
      />
      <MapEvents onMapClick={onMapClick} setBounds={setBounds} />
      <LocationMarker userLocation={userLocation} />
      
      {fans.map((fan) => (
        <Marker 
          key={fan._id} 
          position={[fan.lat, fan.lng]} 
          icon={createCustomIcon(fan)}
        >
          <Popup className="custom-popup">
            <div className="text-center p-1">
              {fan.photoUrl && (
                <img 
                  src={fan.photoUrl} 
                  alt="Fan" 
                  className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer border border-gray-200 hover:opacity-90" 
                  onClick={() => setSelectedImage(fan.photoUrl)}
                />
              )}
              <h3 className="font-bold text-lg m-0 text-gray-800">{fan.nickname}</h3>
              <p className="text-sm text-gray-600 m-0">{fan.flagEmoji} {fan.team}</p>
              <button 
                className="mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded-full w-full"
                onClick={() => {
                  if(navigator.share) {
                    navigator.share({
                      title: 'FanAtlas',
                      text: `Check out ${fan.nickname} cheering for ${fan.team}!`,
                      url: window.location.href
                    });
                  }
                }}
              >
                Share
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    
    {/* Full Screen Image Viewer */}
    {selectedImage && (
      <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
        <button 
          className="absolute top-6 right-6 text-white p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
          onClick={() => setSelectedImage(null)}
        >
          <X className="w-6 h-6" />
        </button>
        <img 
          src={selectedImage} 
          alt="Full Size Fan" 
          className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
          onClick={(e) => e.stopPropagation()} 
        />
      </div>
    )}
    </>
  );
};

export default MapComponent;