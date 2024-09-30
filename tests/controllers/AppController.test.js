import { expect } from 'chai';
import request from 'request';
import dbClient from '../../utils/db';

describe('App Controller', () => {
  const URL = 'http://localhost:5000';

  before(function (done) {
    this.timeout(10000);
    Promise.all([
      dbClient.client.db().collection('users'),
      dbClient.client.db().collection('files'),
    ])
      .then(([usersCollection, filesCollection]) => {
        Promise.all([
          usersCollection.deleteMany({}),
          filesCollection.deleteMany({}),
        ])
          .then(() => done())
          .catch((deleteErr) => done(deleteErr));
      })
      .catch((connectErr) => done(connectErr));
  });

  it('GET /status', (done) => {
    request.get(`${URL}/status`, (err, res, body) => {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body)).to.deep.equal({ redis: true, db: true });
      done();
    });
  });

  it('GET /stats', (done) => {
    request.get(`${URL}/stats`, (err, res, body) => {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body)).to.deep.equal({ users: 0, files: 0 });
      done();
    });
  });

  it('GET /stats after a change in the DB', function (done) {
    this.timeout(10000);
    Promise.all([
      dbClient.client.db().collection('users'),
      dbClient.client.db().collection('files'),
    ])
      .then(([usersCollection, filesCollection]) => {
        Promise.all([
          usersCollection.insertMany([{ email: 'me@mail.com' }]),
          filesCollection.insertMany([
            { name: 'foo.txt', type: 'file' },
            { name: 'bar.png', type: 'image' },
          ]),
        ])
          .then(() => {
            request.get(`${URL}/stats`, (err, res, body) => {
              expect(err).to.be.null;
              expect(res.statusCode).to.equal(200);
              expect(JSON.parse(body)).to.deep.eql({ users: 1, files: 2 });
              done();
            });
          })
          .catch((deleteErr) => done(deleteErr));
      })
      .catch((connectErr) => done(connectErr));
  });

  it('GET /status after a change in the DB', (done) => {
    request.get(`${URL}/status`, (err, res, body) => {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body)).to.deep.equal({ redis: true, db: true });
      done();
    });
  });
});
