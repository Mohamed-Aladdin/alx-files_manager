import { getUserByToken } from '../utils/auth';
import dbClient from '../utils/db';
import mongo from 'mongodb';
import { tmpdir } from 'os';
import { promisify } from 'util';
// import Queue from 'bull/lib/queue';
import { v4 } from 'uuid';
import { mkdir, writeFile, stat, existsSync, realpath } from 'fs';
import { join as joinPath } from 'path';
import { contentType } from 'mime-types';

const mkDirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
const statAsync = promisify(stat);
const realpathAsync = promisify(realpath);
const FILE_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};

export default class FilesController {
  static async postUpload(req, res) {
    const fetchedUser = await getUserByToken(req);

    if (!fetchedUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const name = req.body.name;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    const type = req.body.type;

    if (!type || !Object.values(FILE_TYPES).includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    const data = req.body.data;

    if (!req.body.data && type !== FILE_TYPES.folder) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const file = await dbClient.getFileById(parentId);

      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== FILE_TYPES.folder) {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    const userId = fetchedUser._id.toString();
    const baseDir =
      `${process.env.FOLDER_PATH || ''}`.trim().length > 0
        ? process.env.FOLDER_PATH.trim()
        : joinPath(tmpdir(), 'files_manager');
    const newFile = {
      userId: new mongo.ObjectID(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? '0' : new mongo.ObjectID(parentId),
    };
    await mkDirAsync(baseDir, { recursive: true });

    if (type !== FILE_TYPES.folder) {
      const localPath = joinPath(baseDir, v4());
      await writeFileAsync(localPath, Buffer.from(data, 'base64'));
      newFile.localPath = localPath;
    }
    const insertedFile = await dbClient.createFile(newFile);
    const fileId = insertedFile.insertedId.toString();

    return res.status(201).json({
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? '0' : new mongo.ObjectID(parentId),
    });
  }
}
