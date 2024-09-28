import mongo, { MongoClient } from 'mongodb';
import { hashPassword } from './auth';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.url = `mongodb://${this.host}:${this.port}/${this.database}`;
    this.connectionEstablished = false;
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });
    this.client
      .connect()
      .then(() => {
        this.connectionEstablished = true;
      })
      .catch((err) => {
        console.log('Mongo client failed to connect:', err.toString());
      });
  }

  isAlive() {
    return this.connectionEstablished;
  }

  async nbUsers() {
    return await this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return await this.client.db().collection('files').countDocuments();
  }

  async getUserByEmail(email) {
    return await this.client.db().collection('users').findOne({ email });
  }

  async getUserById(id) {
    const _id = new mongo.ObjectID(id);
    return await this.client.db().collection('users').findOne({ _id });
  }

  async createUser(email, password) {
    return await this.client
      .db()
      .collection('users')
      .insertOne({ email, password: hashPassword(password) });
  }

  async getFileById(parentId) {
    const _id = new mongo.ObjectID(parentId);
    return await this.client.db().collection('files').findOne({ _id });
  }

  async getFileByUserId(fileId, userId) {
    return await this.client
      .db()
      .collection('files')
      .findOne({
        _id: new mongo.ObjectID(fileId),
        userId: new mongo.ObjectID(userId),
      });
  }

  async getAllFilesPaginated(filter, page) {
    return await this.client
      .db()
      .collection('files')
      .aggregate([
        { $match: filter },
        { $sort: { _id: -1 } },
        { $skip: page * 20 },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            id: '$_id',
            userId: '$userId',
            name: '$name',
            type: '$type',
            isPublic: '$isPublic',
            parentId: {
              $cond: {
                if: { $eq: ['$parentId', '0'] },
                then: 0,
                else: '$parentId',
              },
            },
          },
        },
      ])
      .toArray();
  }

  async createFile(file) {
    return await this.client.db().collection('files').insertOne(file);
  }

  async updateFile(fileFilter, status) {
    return await this.client
      .db()
      .collection('files')
      .updateOne(fileFilter, { $set: { isPublic: status } });
  }
}

const dbClient = new DBClient();
export default dbClient;
