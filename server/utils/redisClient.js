const Redis = require('ioredis');
require('dotenv').config();

// Connect to Upstash Redis if a valid URL is provided
const isPlaceholder = process.env.REDIS_URL && process.env.REDIS_URL.includes('<password>');
const redis = (process.env.REDIS_URL && !isPlaceholder) ? new Redis(process.env.REDIS_URL) : null;

if (redis) {
  redis.on('error', (err) => {
    console.error('Redis error:', err);
  });
}

module.exports = redis;
