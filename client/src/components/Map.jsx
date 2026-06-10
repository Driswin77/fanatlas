import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchFansMap, deleteFan } from '../utils/api';
import { Trash2, X, Layers } from 'lucide-react';

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
  const [pinToDelete, setPinToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' or 'satellite'

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

  const handleDeleteClick = (fanId) => {
    setPinToDelete(fanId);
  };

  const confirmDelete = async () => {
    if (!pinToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFan(pinToDelete);
      // Use functional state update to guarantee we're modifying the latest state
      setFans(prevFans => prevFans.filter(f => f._id !== pinToDelete));
      setPinToDelete(null);
      
      // Notify other components (like Leaderboard) to instantly refresh
      window.dispatchEvent(new Event('fanUpdated'));
      
      // Re-fetch to ensure the map is perfectly in sync with the database
      if (bounds) {
        const data = await fetchFansMap(bounds);
        setFans(data);
      }
    } catch(err) {
      console.error("Failed to delete pin", err);
      alert("Failed to delete pin. Please try again.");
      setPinToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

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
            <div className="text-center p-1 relative">
              <button 
                onClick={() => handleDeleteClick(fan._id)}
                className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 shadow-md"
                title="Delete Pin"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              {fan.photoUrl && (
                <img 
                  src={fan.photoUrl} 
                  alt="Fan" 
                  className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer border border-gray-200 mt-2 hover:opacity-90" 
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

    {/* Custom Delete Confirmation Modal */}
    {pinToDelete && (
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-[#141928] border border-gray-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Delete this pin?</h3>
          <p className="text-gray-400 text-sm mb-6">This action cannot be undone. The pin and its photo will be permanently removed.</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setPinToDelete(null)}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default MapComponent;
