import { expect } from 'chai';
import request from 'request';
import dbClient from '../../utils/db';

describe('Auth Controller', () => {
  const URL = 'http://localhost:5000';
  let token = '';
  const mockUser = {
    email: 'hello@world.com',
    password: 'HuhYeah101',
  };

  before(function (done) {
    this.timeout(10000);
    Promise.all([dbClient.client.db().collection('users')])
      .then(([usersCollection]) => {
        usersCollection
          .deleteMany({ email: mockUser.email })
          .then(() => {
            request
              .post(`${URL}/users`)
              .send({
                email: mockUser.email,
                password: mockUser.password,
              })
              .expect(201)
              .end((requestErr, res) => {
                if (requestErr) {
                  return done(requestErr);
                }
                expect(res.body.email).to.eql(mockUser.email);
                expect(res.body.id.length).to.be.greaterThan(0);
                done();
              });
          })
          .catch((deleteErr) => done(deleteErr));
      })
      .catch((connectErr) => done(connectErr));
  });

  it('GET /connect', (done) => {
    request.get(`${URL}/connect`, (err, res, body) => {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(200);
      expect(body.token).to.exist;
      expect(body.token).to.be.greaterThan(0);
      token = body.token;
      done();
    });
  });

  it('GET /users/me', (done) => {
    request.get(`${URL}/users/me`, (err, res, body) => {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(200);
      expect(body.email).to.equal(mockUser.email);
      expect(body.id.length).to.be.greaterThan(0);
      done();
    });
  });

  it('GET /disconnect', (done) => {
    request.get(`${URL}/disconnect`, (err, res, body) => {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(204);
    });
  });
});
