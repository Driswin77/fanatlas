import { useState, useEffect } from 'react';
import MapComponent from './components/Map';
import AddPinBottomSheet from './components/AddPinBottomSheet';
import Leaderboard from './components/Leaderboard';
import { MapPin, Trophy, Navigation } from 'lucide-react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'leaderboard'
  const [isAddPinOpen, setIsAddPinOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // { lat, lng }
  const [userLocation, setUserLocation] = useState(null);
  const [wakeUpLoading, setWakeUpLoading] = useState(true);

  // Ping backend for cold start
  useEffect(() => {
    const pingBackend = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/../health`);
      } catch (err) {
        console.warn('Backend waking up...');
      } finally {
        setWakeUpLoading(false);
      }
    };
    pingBackend();
  }, []);

  const handleMapClick = (latlng) => {
    setSelectedLocation(latlng);
    setIsAddPinOpen(true);
  };

  const locateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen w-full overflow-hidden bg-gray-900 text-white">
      
      {wakeUpLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f3ff] mb-4"></div>
            <p className="text-sm text-gray-300">Waking up the server (Render free tier)...</p>
          </div>
        </div>
      )}

      {/* Main Map Area */}
      <div className={`flex-1 relative ${activeTab === 'map' ? 'block' : 'hidden sm:block'}`}>
        <MapComponent 
          onMapClick={handleMapClick} 
          userLocation={userLocation}
        />
        
        {/* Locate Me Button */}
        <button 
          onClick={locateUser}
          className="absolute bottom-24 sm:bottom-8 right-4 z-[400] glass-panel p-3 rounded-full shadow-lg hover:bg-gray-800/80 transition-colors"
        >
          <Navigation className="w-6 h-6 text-[#00f3ff]" />
        </button>

        {/* Top Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-[400] pointer-events-none">
  <h1 className="text-2xl font-black italic tracking-tighter drop-shadow-md">
    <span className="text-yellow-400">FAN</span>
    <span className="text-white">ATLAS</span>
  </h1>
  <p className="text-xs font-medium text-gray-300 drop-shadow">World Cup 2026 Fan Map</p>
</div>
      </div>

      {/* Sidebar / Leaderboard */}
      <div className={`w-full sm:w-[400px] h-full bg-[#0b0f19] border-l border-gray-800 ${activeTab === 'leaderboard' ? 'block' : 'hidden sm:block'}`}>
        <Leaderboard />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 glass-panel border-t-0 rounded-none rounded-t-2xl z-[500] flex items-center justify-around pb-safe">
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'map' ? 'text-[#00f3ff]' : 'text-gray-400'}`}
        >
          <MapPin className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Map</span>
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'leaderboard' ? 'text-[#00f3ff]' : 'text-gray-400'}`}
        >
          <Trophy className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Stats</span>
        </button>
      </div>

      {/* Add Pin Bottom Sheet */}
      <AddPinBottomSheet 
        isOpen={isAddPinOpen} 
        onClose={() => {
          setIsAddPinOpen(false);
          setSelectedLocation(null);
        }}
        location={selectedLocation}
      />
    </div>
  );
}

export default App;
