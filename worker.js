import { writeFile } from 'fs';
import { promisify } from 'util';
import Queue from 'bull/lib/queue';
import imgThumbnail from 'image-thumbnail'; // Needs Node v14 or above to work.
import mongo from 'mongodb';
import dbClient from './utils/db';
import Mailer from './utils/mailer';

const writeFileAsync = promisify(writeFile);
const fileQueue = new Queue('thumbnail generation');
const userQueue = new Queue('email sending');

async function generateThumbnail(filePath, size) {
  const buffer = await imgThumbnail(filePath, { width: size });
  console.log(`Generating file: ${filePath}, size: ${size}`);
  return writeFileAsync(`${filePath}_${size}`, buffer);
}

fileQueue.process(async (job, done) => {
  const fileId = job.data.fileId;
  const userId = job.data.userId;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }
  const file = await dbClient.getFileByUserId(fileId, userId);

  if (!file) {
    throw new Error('File not found');
  }
  const size_list = [500, 250, 100];

  Promise.all(
    size_list.map((size) => generateThumbnail(file.localPath, size))
  ).then(() => done());
});
