const mongoose = require('mongoose');
const axios = require('axios');
const Fan = require('../models/Fan');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Neither MONGODB_URI nor MONGO_URI found in .env');
  process.exit(1);
}

console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//<hidden>@'));

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
    console.error('Geocoding error:', err.message);
    return null;
  }
}

async function backfill() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find fans missing any of the location fields (empty, null, or undefined)
    const fans = await Fan.find({
      $or: [
        { country: { $in: ['', null, undefined] } },
        { state: { $in: ['', null, undefined] } },
        { district: { $in: ['', null, undefined] } },
        { city: { $in: ['', null, undefined] } }
      ]
    });

    console.log(`📌 Found ${fans.length} fans missing location data`);

    let updated = 0;
    for (let fan of fans) {
      const [lng, lat] = fan.location.coordinates;
      const geo = await reverseGeocode(lat, lng);
      if (geo) {
        fan.country = geo.country;
        fan.state = geo.state;
        fan.district = geo.district;
        fan.city = geo.city;
        await fan.save();
        updated++;
        console.log(`✅ Updated fan ${fan._id}: ${geo.state} > ${geo.district}`);
      } else {
        console.log(`⚠️  Failed for fan ${fan._id}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`🎉 Backfill complete. Updated ${updated} fans.`);
  } catch (err) {
    console.error('❌ Backfill error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

backfill();