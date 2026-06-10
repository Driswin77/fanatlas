import { useState, useEffect, useRef } from 'react';
import { fetchWhoOwns, fetchLocationSuggestions } from '../utils/api';
import { Search, Map, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WhoOwnsSearch = ({ onSearchResults }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debounceTimeout = useRef(null);

  // Fetch suggestions as user types
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const data = await fetchLocationSuggestions(query);
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (err) {
        console.error('Failed to fetch suggestions');
      }
    }, 300);

    return () => clearTimeout(debounceTimeout.current);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    
    try {
      const data = await fetchWhoOwns(searchQuery);
      setResults(data);
      if (onSearchResults) onSearchResults(data);
    } catch (err) {
      setError('Could not fetch data for this region.');
      if (onSearchResults) onSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const renderBattleBar = () => {
    if (!results || results.teams.length === 0) {
      return (
        <div className="text-center text-sm text-gray-400 mt-4 py-4 bg-gray-800/30 rounded-xl">
          No data for this region yet. Be the first to claim it!
        </div>
      );
    }

    const teams = results.teams; // all teams
    const totalFans = results.totalFans;

    // Sort teams by count descending (already sorted from API)
    // Calculate percentages
    const teamsWithPercent = teams.map(team => ({
      ...team,
      percent: (team.count / totalFans) * 100
    }));

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 glass-panel"
      >
        <div className="space-y-3 mb-3">
          {teamsWithPercent.map((team, idx) => (
            <div key={team.team} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">{team.flagEmoji}</span>
                <span className="font-medium text-sm">{team.team}</span>
              </div>
              <div className="text-xs text-gray-300">
                {team.count} fans • {team.percent.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        <div className="h-6 bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
          {teamsWithPercent.map((team) => (
            <motion.div 
              key={team.team}
              initial={{ width: 0 }}
              animate={{ width: `${team.percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full"
              style={{ backgroundColor: team.primaryColor || '#00f3ff' }}
              title={`${team.team}: ${team.percent.toFixed(1)}%`}
            />
          ))}
        </div>
        
        <div className="text-center mt-3 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff00ff]">
          Fan distribution in {results.region.toUpperCase()}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Map className="w-4 h-4" /> Who Owns...
      </h3>
      
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative" ref={searchRef}>
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="City, State, or Country"
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#00f3ff] transition-colors"
            autoComplete="off"
          />
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-3 bg-[#00f3ff]/20 text-[#00f3ff] rounded-lg text-xs font-bold hover:bg-[#00f3ff]/30 transition-colors disabled:opacity-50"
            disabled={loading || !query.trim()}
          >
            {loading ? '...' : 'FIND'}
          </button>
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, idx) => (
              <li
                key={idx}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-white text-sm transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Display total fans for the region when results exist */}
      {results && results.totalFans > 0 && (
        <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-[#00f3ff]/10 to-transparent p-3 rounded-xl border border-[#00f3ff]/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00f3ff]" />
            <span className="text-sm text-gray-300">Total fans in {results.region}</span>
          </div>
          <div className="text-xl font-bold text-[#00f3ff]">{results.totalFans}</div>
        </div>
      )}

      {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
      
      <AnimatePresence>
        {results && renderBattleBar()}
      </AnimatePresence>
    </div>
  );
};

export default WhoOwnsSearch;