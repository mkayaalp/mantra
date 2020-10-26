// to run only these test, run:  npm run-script testFunctionalC
var app = require('../../../server/server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  utilTest = require('../../helper/utilForTesting.js'),
  testConfig = require('./testFunctionalConfig.js');

app.use(bodyParser());

describe('Test Mantra with C compilation', function () {

  this.timeout(5000);

  it('Mantra C: successful compilation (one file)', function (done) {
    var folder = testConfig.getTestResource("/c/c_one_file");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          //console.log(reply.body);
          (reply.body.output.indexOf("Compilation successful")).should.not.equal(-1);
          reply.body.compilationError.should.equal(false);
          reply.body.id.should.not.equal(undefined);
          done();
        })
    });
  });


  it('Mantra C: successful compilation (several files)', function (done) {
    var folder = testConfig.getTestResource("c/c_several_files");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          (reply.body.output.indexOf("Compilation successful")).should.not.equal(-1);
          reply.body.compilationError.should.equal(false);
          reply.body.id.should.not.equal(undefined);
          done();
        });
    });
  });


  it('Mantra C: successful compilation (several files in folders)', function (done) {
    var folder = testConfig.getTestResource("c/c_several_files_folders");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          //console.log(reply.body.id);
          (reply.body.output.indexOf("Compilation successful")).should.not.equal(-1);
          reply.body.compilationError.should.equal(false);
          reply.body.id.should.not.equal(undefined);
          done();
        });
    });
  });


  it('Mantra C: error in compilation (one file)', function (done) {
    var folder = testConfig.getTestResource("c/c_error_one_file");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          //console.log(reply.body.output);
          (reply.body.output.indexOf("Compilation successful")).should.equal(-1);
          reply.body.compilationError.should.equal(true);
          reply.body.id.should.not.equal(undefined);
          (reply.body.output.indexOf("undefined reference to `foo'")).should.not.equal(-1);
          (reply.body.output.indexOf("In function `main'")).should.not.equal(-1);
          done();
        });
    });
  });


  it('Mantra C: error in compilation (missing main file)', function (done) {
    var folder = testConfig.getTestResource("/c/c_error_main");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          //console.log(reply.body.output);
          (reply.body.output.indexOf("Compilation successful")).should.equal(-1);
          reply.body.compilationError.should.equal(true);
          reply.body.id.should.not.equal(undefined);
          (reply.body.output.indexOf("undefined reference to `main'")).should.not.equal(-1);
          done();
        });
    });
  });


  it('Mantra C: successful incremental compilation ', function (done) {
    var folder = testConfig.getTestResource("/c/c_incremental1");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          var folder = testConfig.getTestResource("c/c_incremental2");
          utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
            data.id = reply.body.id;
            reply.body.compilationError.should.equal(true);
            reply.body.id.should.not.equal(undefined);
            request(app)
              .post('/' + data.id)
              .send(data)
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function (error, reply) {
                //console.log(reply.body.output);
                (reply.body.output.indexOf("Compilation successful")).should.not.equal(-1);
                reply.body.compilationError.should.equal(false);
                reply.body.id.should.not.equal(undefined);
                data.id.should.equal(reply.body.id);
                done();
              });
          });
        });
    });
  });


  it('Mantra C: error in incremental compilation ', function (done) {
    var folder = testConfig.getTestResource("c/c_error_incremental1");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          var folder = testConfig.getTestResource("c/c_error_incremental2");
          utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
            data.id = reply.body.id;
            request(app)
              .post('/' + data.id)
              .send(data)
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function (error, reply) {
                reply.body.output.should.not.equal('Compilation successful');
                reply.body.compilationError.should.equal(true);
                reply.body.id.should.not.equal(undefined);
                data.id.should.equal(reply.body.id);
                done();
              });
          });
        });
    });
  });


  it('Mantra C: successful incremental compilation with wrong ID', function (done) {
    var folder = testConfig.getTestResource("c/c_wrong_id1");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          reply.body.id.should.not.equal(undefined);
          var folder = testConfig.getTestResource("c/c_wrong_id2");
          utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
            data.id = "WRONG_ID";
            request(app)
              .post('/' + data.id)
              .send(data)
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function (error2, reply2) {
                //console.log(reply2.body.output);
                (reply2.body.output.indexOf("Compilation successful")).should.not.equal(-1);
                reply2.body.compilationError.should.equal(false);
                reply2.body.id.should.not.equal(undefined);
                done();
              });
          });
        });
    });
  });


  it('Mantra C: successful run (one file)', function (done) {
    var folder = testConfig.getTestResource("c/c_run_file");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          //console.log(reply.body.output);
          (reply.body.output.indexOf("Compilation successful")).should.not.equal(-1);
          reply.body.compilationError.should.equal(false);
          reply.body.id.should.not.equal(undefined);
          var data2 = {};
          data2.language = 'C';
          data2.action = 'run';
          data2.id = reply.body.id;
          data2.stream = false;
          request(app)
            .post('/' + data2.id)
            .send(data2)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (error, reply) {
              //console.log(reply.body);
              reply.body.output.should.not.equal(undefined);
              (reply.body.output.indexOf("Hello, C World!")).should.not.equal(-1);
              done();
            });
        });
    });
  });


  it('Mantra C: successful run (several files in folders)', function (done) {
    var folder = testConfig.getTestResource("c/c_run_several_files");

    utilTest.generateTestFromFolder(folder, "C", "compile", function (data) {
      request(app)
        .post('/')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (error, reply) {
          (reply.body.output.indexOf("Compilation successful")).should.not.equal(-1);
          reply.body.compilationError.should.equal(false);
          reply.body.id.should.not.equal(undefined);
          var data2 = {};
          data2.language = 'C';
          data2.action = 'run';
          data2.id = reply.body.id;
          data2.stream = false;
          request(app)
            .post('/' + data2.id)
            .send(data2)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (error, reply) {
              //console.log(result.output);
              reply.body.output.should.not.equal(undefined);
              (reply.body.output.indexOf("Hello, C World! Hello C")).should.not.equal(-1);
              done();
            });
        });
    });
  });
});