import { useState, useEffect } from 'react';
import { fetchGlobalLeaderboard } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import WhoOwnsSearch from './WhoOwnsSearch';
import { Trophy, Globe2, MapPin } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionResults, setRegionResults] = useState(null); // stores results from WhoOwnsSearch

  // Load global leaderboard only when no region is searched
  const loadGlobalLeaderboard = async () => {
    try {
      const data = await fetchGlobalLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      console.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!regionResults) {
      loadGlobalLeaderboard();
    }
    
    // Listen for fan updates to refresh global board if needed
    const handleFanUpdate = () => {
      if (!regionResults) loadGlobalLeaderboard();
    };
    window.addEventListener('fanUpdated', handleFanUpdate);
    const interval = setInterval(() => {
      if (!regionResults) loadGlobalLeaderboard();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('fanUpdated', handleFanUpdate);
    };
  }, [regionResults]);

  const handleRegionSearch = (results) => {
    setRegionResults(results);
  };

  const renderRegionChart = () => {
    if (!regionResults || regionResults.teams.length === 0) return null;

    const chartData = regionResults.teams.map(team => ({
      team: team.team,
      count: team.count,
      flagEmoji: team.flagEmoji,
      primaryColor: team.primaryColor
    }));

    return (
      <div className="mt-8 flex-1">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Teams in {regionResults.region.toUpperCase()}
        </h3>
        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="team" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value, name, props) => [`${value} fans`, props.payload.team]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.primaryColor || '#00f3ff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {chartData.map((team, idx) => (
            <div key={idx} className="glass-panel p-3 flex items-center justify-between border-l-4" style={{ borderLeftColor: team.primaryColor }}>
              <div className="flex items-center gap-3">
                <span className="text-xl w-6 font-bold text-gray-500">{idx + 1}</span>
                <span className="text-2xl">{team.flagEmoji}</span>
                <span className="font-semibold">{team.team}</span>
              </div>
              <div className="bg-gray-800 px-3 py-1 rounded-full text-sm font-bold text-[#00f3ff]">
                {team.count} fans
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGlobalChart = () => (
    <div className="mt-8 flex-1">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Globe2 className="w-4 h-4" /> Top Nations
      </h3>
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-800 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboard} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="team" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {leaderboard.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.primaryColor || '#00f3ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {leaderboard.map((team, index) => (
              <div key={team.team} className="glass-panel p-3 flex items-center justify-between border-l-4" style={{ borderLeftColor: team.primaryColor }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-6 font-bold text-gray-500">{index + 1}</span>
                  <span className="text-2xl">{team.flagEmoji}</span>
                  <span className="font-semibold">{team.team}</span>
                </div>
                <div className="bg-gray-800 px-3 py-1 rounded-full text-sm font-bold text-[#00f3ff]">
                  {team.count}
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center text-gray-500 py-8">No fans yet. Be the first!</div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 pb-24 sm:pb-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#00f3ff]/20 p-2 rounded-lg">
          <Trophy className="w-6 h-6 text-[#00f3ff]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Global Ranks</h2>
      </div>

      <WhoOwnsSearch onSearchResults={handleRegionSearch} />

      {regionResults ? renderRegionChart() : renderGlobalChart()}
    </div>
  );
};

export default Leaderboard;