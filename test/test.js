// During the test the env variable is set to test
process.env.APP_ENV = 'test';
process.env.PORT = 4001;

const {User} = require('../models');

// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const route_prefix = '/test';
let token = '';


chai.use(chaiHttp);
// Our parent block
describe('Users', () => {
  before((done) => { // Before each test we empty the database
    User.remove({}, (err) => {
      done();
    });
  });
  /*
  * Test the /GET route
  */
  describe('/post sign up', () => {
    it('it should register user to the app', (done) => {
      const newUser = {
        first_name: 'Test',
        last_name: 'Test',
        email: 'test@gmail.com',
        password: 'Password@123',
        role: 'employer',
      };
      chai.request(server)
          .post(`${route_prefix}/sign-up`)
          .send(newUser)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(true);
            res.body.should.have.property('message').eql('User Successfully Created!');
            done();
          });
    });
  });

  describe('/post sign in', () => {
    it('it should sign in user to the app', (done) => {
      const user = {
        email: 'test@gmail.com',
        password: 'Password@123',
      };
      chai.request(server)
          .post(`${route_prefix}/sign-in`)
          .send(user)
          .end((err, res) => {
            token = res.body.data.access_token;
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(true);
            res.body.should.have.property('message').eql('Hello, You are now successfully logged in. Welcome back!');
            done();
          });
    });
  });

  describe('/get logout', () => {
    it('it should logout user from the app', (done) => {
      chai.request(server)
          .get(`${route_prefix}/logout`)
          .set('authorization', `Bearer ${token}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(true);
            res.body.should.have.property('message').eql('You have successfully logged out. Bye,See you again!');
            done();
          });
    });
  });
});
