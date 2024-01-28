const { createClient } = require("redis");

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect(options) {
    if (!this.client) {
      this.client = createClient(options);
      this.client.on("error", (err) => console.log("Redis Client Error", err));

      await this.client.connect();
      console.log("Connected successfully to Redis");
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
  }

  static getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }
}

const redisClient = RedisClient.getInstance();
module.exports = redisClient;
