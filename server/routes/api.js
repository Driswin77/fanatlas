const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Fan = require('../models/Fan');
const Team = require('../models/Team');
const redis = require('../utils/redisClient');
const router = express.Router();

// ------------------- Helper Functions -------------------
const getCachedData = async (key) => {
  if (!redis) return null;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

const setCachedData = async (key, data, ttl = 30) => {
  if (!redis) return;
  await redis.setex(key, ttl, JSON.stringify(data));
};

const clearCacheForRegion = async (region) => {
  if (!redis) return;
  await redis.del('leaderboard:global');
  if (region) {
    await redis.del(`who-owns:${region.toLowerCase()}`);
  }
};

// Reverse geocoding using Nominatim (free, no API key)
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'FanAtlas/1.0' }
    });
    const address = response.data.address || {};
    return {
      country: address.country || '',
      state: address.state || address.region || '',
      district: address.county || address.district || '',
      city: address.city || address.town || address.village || ''
    };
  } catch (err) {
    console.error('Reverse geocoding failed:', err.message);
    return { country: '', state: '', district: '', city: '' };
  }
}

// ------------------- POST /api/fans (with auto location hierarchy) -------------------
router.post('/fans', [
  body('nickname').optional().trim().isLength({ max: 30 }),
  body('team').trim().notEmpty().withMessage('Team is required'),
  body('photoUrl').optional().trim().isURL(),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nickname, team, photoUrl, lat, lng } = req.body;

    // Verify team exists
    const teamExists = await Team.findOne({ name: team });
    if (!teamExists) {
      return res.status(400).json({ error: 'Invalid team selected.' });
    }

    // Get location hierarchy from coordinates
    const geo = await reverseGeocode(lat, lng);

    const newFan = new Fan({
      nickname: nickname || `Fan_${Math.random().toString(36).substr(2, 6)}`,
      team,
      country: geo.country,
      state: geo.state,
      district: geo.district,
      city: geo.city,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      photoUrl: photoUrl || ''
    });

    await newFan.save();

    // Invalidate caches for the affected regions
    await clearCacheForRegion(geo.district);
    await clearCacheForRegion(geo.state);
    await clearCacheForRegion(geo.country);

    res.status(201).json(newFan);
  } catch (err) {
    console.error('Error saving fan:', err);
    res.status(500).json({ error: 'Server error saving fan pin.' });
  }
});

// ------------------- DELETE /api/fans/:id -------------------
router.delete('/fans/:id', async (req, res) => {
  try {
    const deletedFan = await Fan.findByIdAndDelete(req.params.id);
    if (!deletedFan) {
      return res.status(404).json({ error: 'Fan pin not found' });
    }
    await clearCacheForRegion(deletedFan.district);
    await clearCacheForRegion(deletedFan.state);
    await clearCacheForRegion(deletedFan.country);
    res.json({ message: 'Fan pin deleted successfully' });
  } catch (err) {
    console.error('Error deleting fan:', err);
    res.status(500).json({ error: 'Server error deleting fan pin.' });
  }
});

// ------------------- GET /api/fans/map -------------------
router.get('/fans/map', async (req, res) => {
  try {
    const { sw_lat, sw_lng, ne_lat, ne_lng } = req.query;

    let query = {};
    if (sw_lat && sw_lng && ne_lat && ne_lng) {
      query.location = {
        $geoWithin: {
          $box: [
            [parseFloat(sw_lng), parseFloat(sw_lat)],
            [parseFloat(ne_lng), parseFloat(ne_lat)]
          ]
        }
      };
    }

    const fans = await Fan.find(query).select('nickname team location photoUrl').limit(500).lean();

    // Attach team flags & colors
    const teams = await Team.find().lean();
    const teamMap = teams.reduce((acc, t) => ({ ...acc, [t.name]: t }), {});

    const mappedFans = fans.map(f => ({
      _id: f._id,
      nickname: f.nickname,
      team: f.team,
      flagEmoji: teamMap[f.team]?.flagEmoji || '⚽',
      primaryColor: teamMap[f.team]?.primaryColor || '#000000',
      photoUrl: f.photoUrl,
      lat: f.location.coordinates[1],
      lng: f.location.coordinates[0]
    }));

    res.json(mappedFans);
  } catch (err) {
    console.error('Error fetching map fans:', err);
    res.status(500).json({ error: 'Server error fetching map pins.' });
  }
});

// ------------------- GET /api/who-owns (hierarchical exact + substring fallback) -------------------
router.get('/who-owns', async (req, res) => {
  try {
    const { region } = req.query;
    if (!region) return res.status(400).json({ error: 'Region parameter is required' });

    const cacheKey = `who-owns:${region.toLowerCase()}`;
    const cached = await getCachedData(cacheKey);
    if (cached) return res.json(cached);

    const regionLower = region.toLowerCase();
    const exactRegex = new RegExp(`^${regionLower}$`, 'i');
    const subRegex = new RegExp(regionLower, 'i');

    // Try exact matches in priority: country → state → district → city
    let matchCondition = null;

    const exactCountry = await Fan.findOne({ country: exactRegex });
    if (exactCountry) {
      matchCondition = { country: exactRegex };
    } else {
      const exactState = await Fan.findOne({ state: exactRegex });
      if (exactState) {
        matchCondition = { state: exactRegex };
      } else {
        const exactDistrict = await Fan.findOne({ district: exactRegex });
        if (exactDistrict) {
          matchCondition = { district: exactRegex };
        } else {
          const exactCity = await Fan.findOne({ city: exactRegex });
          if (exactCity) {
            matchCondition = { city: exactRegex };
          }
        }
      }
    }

    // Fallback to substring match across all fields if no exact match found
    if (!matchCondition) {
      matchCondition = {
        $or: [
          { country: subRegex },
          { state: subRegex },
          { district: subRegex },
          { city: subRegex }
        ]
      };
    }

    const totalFans = await Fan.countDocuments(matchCondition);
    let result = { region, totalFans, teams: [] };

    if (totalFans > 0) {
      const stats = await Fan.aggregate([
        { $match: matchCondition },
        { $group: { _id: '$team', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      result.teams = stats.map(s => ({
        team: s._id,
        count: s.count,
        percentage: ((s.count / totalFans) * 100).toFixed(1)
      }));

      for (let t of result.teams) {
        const teamDetails = await Team.findOne({ name: t.team }).lean();
        if (teamDetails) {
          t.flagEmoji = teamDetails.flagEmoji;
          t.primaryColor = teamDetails.primaryColor;
        }
      }
    }

    await setCachedData(cacheKey, result, 60);
    res.json(result);
  } catch (err) {
    console.error('Error in who-owns:', err);
    res.status(500).json({ error: 'Server error calculating region ownership.' });
  }
});

// ------------------- GET /api/locations/suggest -------------------
router.get('/locations/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const regex = new RegExp(q, 'i');
    
    const [countries, states, districts, cities] = await Promise.all([
      Fan.distinct('country', { country: { $regex: regex } }),
      Fan.distinct('state', { state: { $regex: regex } }),
      Fan.distinct('district', { district: { $regex: regex } }),
      Fan.distinct('city', { city: { $regex: regex } })
    ]);

    const suggestions = [...new Set([...countries, ...states, ...districts, ...cities])]
      .filter(s => s && s.trim().length > 0)
      .slice(0, 10);

    res.json(suggestions);
  } catch (err) {
    console.error('Error fetching location suggestions:', err);
    res.status(500).json({ error: 'Server error fetching suggestions.' });
  }
});

// ------------------- GET /api/leaderboard/global -------------------
router.get('/leaderboard/global', async (req, res) => {
  try {
    const cacheKey = 'leaderboard:global';
    const cached = await getCachedData(cacheKey);
    if (cached) return res.json(cached);

    const stats = await Fan.aggregate([
      { $group: { _id: '$team', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const result = [];
    for (let s of stats) {
      const teamDetails = await Team.findOne({ name: s._id }).lean();
      result.push({
        team: s._id,
        count: s.count,
        flagEmoji: teamDetails?.flagEmoji || '⚽',
        primaryColor: teamDetails?.primaryColor || '#000'
      });
    }

    await setCachedData(cacheKey, result, 30);
    res.json(result);
  } catch (err) {
    console.error('Error fetching global leaderboard:', err);
    res.status(500).json({ error: 'Server error fetching leaderboard.' });
  }
});

// ------------------- GET /api/teams -------------------
router.get('/teams', async (req, res) => {
  try {
    const cacheKey = 'teams:all';
    const cached = await getCachedData(cacheKey);
    if (cached) return res.json(cached);

    const teams = await Team.find().sort({ name: 1 }).lean();
    await setCachedData(cacheKey, teams, 3600);
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Server error fetching teams.' });
  }
});

module.exports = router;