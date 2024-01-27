const pgp = require('pg-promise')(/* options */);

class PgClient {
  constructor() {
    this.db = null;
  }

  async connect(connectionConfig) {
    if (!this.db) {
      try {
        const pgpOptions = {
          ...connectionConfig,
          ssl: { rejectUnauthorized: false }
        };
        this.db = pgp(pgpOptions);
        await this.db.connect();
        console.log('Connected successfully to PostgreSQL');
      } catch (error) {
        console.error('Error connecting to PostgreSQL:', error.message);
        throw error;
      }
    }
    return this.db;
  }

  async disconnect() {
    if (this.db) {
      try {
        await this.db.$pool.end();
        console.log('Disconnected from PostgreSQL');
      } catch (error) {
        console.error('Error disconnecting from PostgreSQL:', error.message);
        throw error;
      } finally {
        this.db = null;
      }
    }
  }
  static getInstance() {
    if (!PgClient.instance) {
      PgClient.instance = new PgClient();
    }
    return PgClient.instance;
  }

}

module.exports = PgClient;
