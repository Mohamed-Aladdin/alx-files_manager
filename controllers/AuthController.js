import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import {
  getToken,
  decodeToken,
  getCreds,
  hashPassword,
  getUserByToken,
} from '../utils/auth';
import { v4 } from 'uuid';

export default class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = getToken(authHeader);
    const decoded = decodeToken(token);
    const { email, password } = getCreds(decoded);
    const fetchedUser = await dbClient.getUserByEmail(email);

    if (!fetchedUser || fetchedUser.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = v4();
    await redisClient.set(
      `auth_${key}`,
      fetchedUser._id.toString(),
      60 * 60 * 24
    );
    res.status(200).json({ token: key });
  }

  static async getDisconnect(req, res) {
    const fetchedUser = await getUserByToken(req);

    if (!fetchedUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${req.headers['x-token']}`);
    return res.status(204).end();
  }
}
