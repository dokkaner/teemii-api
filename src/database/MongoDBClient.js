const { MongoClient, ObjectId } = require("mongodb");

// MongoDBClient is a singleton class for managing MongoDB connections.
class MongoDBClient {
  constructor() {
    this.client = null;
    this.db = null;
  }

  // Connects to the MongoDB database. Reuses the existing connection if already established.
  async connect(uri, dbName) {
    if (!this.client) {
      this.client = new MongoClient(uri);
      await this.client.connect();
      console.log("Connected successfully to MongoDB");
      this.db = this.client.db(dbName);
    }
    return this.db;
  }

  // Closes the MongoDB connection.
  disconnect() {
    if (this.client) {
      this.client.close();
    }
  }

  // Returns the singleton instance of MongoDBClient.
  static getInstance() {
    if (!MongoDBClient.instance) {
      MongoDBClient.instance = new MongoDBClient();
    }
    return MongoDBClient.instance;
  }

  toObjectId(id) {
    return new ObjectId(id);
  }
}

const mongoDBClient = MongoDBClient.getInstance();
module.exports = mongoDBClient;
