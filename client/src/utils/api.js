import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// ImgBB Upload function
export const uploadImageToImgBB = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('ImgBB API key is missing');
  }

  const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData);
  return response.data.data.url;
};

export const fetchFansMap = async (bounds) => {
  const { _southWest, _northEast } = bounds;
  const res = await api.get('/fans/map', {
    params: {
      sw_lat: _southWest.lat,
      sw_lng: _southWest.lng,
      ne_lat: _northEast.lat,
      ne_lng: _northEast.lng
    }
  });
  return res.data;
};

export const fetchTeams = async () => {
  const res = await api.get('/teams');
  return res.data;
};

export const fetchGlobalLeaderboard = async () => {
  const res = await api.get('/leaderboard/global');
  return res.data;
};

export const fetchWhoOwns = async (region) => {
  const res = await api.get('/who-owns', { params: { region } });
  return res.data;
};

export const fetchLocationSuggestions = async (query) => {
  const res = await api.get('/locations/suggest', { params: { q: query } });
  return res.data;
};

export const submitFan = async (fanData) => {
  const res = await api.post('/fans', fanData);
  return res.data;
};

export const deleteFan = async (id) => {
  const res = await api.delete(`/fans/${id}`);
  return res.data;
};

export default api;