const { createClient } = require('redis');
require('dotenv/config');

const RedisClient = createClient({
    username: 'default',
    password: process.env.REDIS_KEY,
    socket: {
        host: 'redis-10091.c8.us-east-1-4.ec2.cloud.redislabs.com',
        port: 10091
    }
});

RedisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

module.exports = RedisClient;