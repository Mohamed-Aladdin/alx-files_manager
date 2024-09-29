import { expect } from 'chai';
import { tmpdir } from 'os';
import { join as joinPath } from 'path';
import { existsSync, readdirSync, unlinkSync, statSync } from 'fs';
import request from 'request';
import dbClient from '../../utils/db';

describe('Files Controller', () => {
  const URL = 'http://localhost:5000';
  const mockUser = {
    email: 'hello@world.com',
    password: 'HuhYeah101',
  };
  const baseDir =
    `${process.env.FOLDER_PATH || ''}`.trim().length > 0
      ? process.env.FOLDER_PATH.trim()
      : joinPath(tmpdir(), 'files_manager');
  const mockFiles = [
    {
      name: 'manga_titles.txt',
      type: 'file',
      data: ["+ Darwin's Game", '+ One Piece', '+ My Hero Academia', ''].join(
        '\n'
      ),
      b64Data() {
        return Buffer.from(this.data, 'utf-8').toString('base64');
      },
    },
    {
      name: 'One_Piece',
      type: 'folder',
      data: '',
      b64Data() {
        return '';
      },
    },
    {
      name: 'chapter_titles.md',
      type: 'file',
      data: [
        '+ Chapter 47: The skies above the capital',
        '+ Chapter 48: 20 years',
        '+ Chapter 49: The world you wish for',
        '+ Chapter 50: Honor',
        '+ Chapter 51: The shogun of Wano - Kozuki Momonosuke',
        '+ Chapter 52: New morning',
        '',
      ].join('\n'),
      b64Data() {
        return Buffer.from(this.data, 'utf-8').toString('base64');
      },
    },
  ];
  let token = '';

  const emptyFolder = (name) => {
    if (!existsSync(name)) {
      return;
    }
    for (const fileName of readdirSync(name)) {
      const filePath = joinPath(name, fileName);
      if (statSync(filePath).isFile) {
        unlinkSync(filePath);
      } else {
        emptyFolder(filePath);
      }
    }
  };

  const emptyDatabase = (callback) => {
    Promise.all([
      dbClient.client.db().collection('users'),
      dbClient.client.db().collection('files'),
    ])
      .then(([usersCollection, filesCollection]) => {
        Promise.all([
          usersCollection.deleteMany({}),
          filesCollection.deleteMany({}),
        ])
          .then(() => {
            if (callback) {
              callback();
            }
          })
          .catch((deleteErr) => done(deleteErr));
      })
      .catch((connectErr) => done(connectErr));
  };

  const signUp = (user, done) => {
    request.post(
      `${URL}/users`,
      { json: { email: user.email, password: user.password } },
      (err, res, body) => {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(201);
        expect(body.email).to.equal(user.email);
        expect(body.id.length).to.be.greaterThan(0);
        done();
      }
    );
  };

  const logIn = (done) => {
    request.get(
      `${URL}/connect`,
      {
        headers: {
          Authorization: 'Basic aGVsbG9Ad29ybGQuY29tOkh1aFllYWgxMDE=',
        },
      },
      (err, res, body) => {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(200);
        expect(JSON.parse(body).token).to.exist;
        expect(JSON.parse(body).token.length).to.be.greaterThan(0);
        token = JSON.parse(body).token;
        done();
      }
    );
  };

  before(function (done) {
    this.timeout(10000);
    emptyDatabase(() => signUp(mockUser, () => logIn(mockUser, done)));
    emptyFolder(baseDir);
  });

  after(function (done) {
    this.timeout(10000);
    setTimeout(() => {
      emptyDatabase(done);
      emptyFolder(baseDir);
    });
  });

  it('POST /files', (done) => {
    request.post(
      `${URL}/files`,
      {
        json: mockFiles[0],
        headers: { 'x-token': token },
      },
      (err, res, body) => {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(201);
        expect(JSON.parse(body).id).to.exist;
        expect(JSON.parse(body).userId).to.exist;
        expect(JSON.parse(body).name).to.equal(mockFiles[0].name);
        expect(JSON.parse(body).type).to.equal(mockFiles[0].type);
        expect(JSON.parse(body).id.isPublic).to.be.false;
        expect(JSON.parse(body).parentId).to.equal(0);
      }
    );
  });
});
