import { getUserByToken } from '../utils/auth';
import dbClient from '../utils/db';

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const userFound = await dbClient.getUserByEmail(email);

    if (userFound) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const { insertedId } = await dbClient.createUser(email, password);

    return res.status(201).json({
      id: insertedId,
      email,
    });
  }

  static async getMe(req, res) {
    const fetchedUser = getUserByToken(req);

    if (!fetchedUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res
      .status(200)
      .json({ email: fetchedUser.email, id: fetchedUser._id });
  }
}
