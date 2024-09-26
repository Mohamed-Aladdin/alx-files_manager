import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.url = `mongodb://${this.host}:${this.port}`;
    this.connectionEstablished = false;
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });
    this.client
      .connect()
      .then(() => (this.connectionEstablished = true))
      .catch((err) =>
        console.log('Mongo client failed to connect:', err.toString())
      );
  }

  isAlive() {
    return this.connectionEstablished;
  }

  async nbUsers() {
    return await this.client.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return await this.client.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
