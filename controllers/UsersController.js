import dbClient from '../utils/db';

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
    }
    const userFound = await dbClient.getUserByEmail(email);

    if (userFound) {
      res.status(400).json({ error: 'Already exist' });
    }
    const id = await dbClient.createUser(email, password).insertedId;

    res.status(201).json({
      id,
      email,
    });
  }
}
