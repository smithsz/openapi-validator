const intercept = require('intercept-stdout');
const expect = require('expect');
const stripAnsiFrom = require('strip-ansi');
const commandLineValidator = require('../../../dist/cli-validator/runValidator');

const Sync = require('sync');

describe('cli tool - test expected output', function() {

  it ('should not produce any errors or warnings from mockFiles/clean.yml', function(done) {

    // set a variable to store text intercepted from stdout
    let captured_text = [];
    
    // this variable intercepts incoming text and pushes it into captured_text
    let unhook_intercept = intercept(function(txt) {
      captured_text.push(txt);
      // by default, text is intercepted AND printed. returning an
      //   empty string prevents any printing
      return '';
    });

    // set up mock user input
    let program = {};
    program.args = ['./test/cli-validator/mockFiles/clean.yml'];

    // wrapping within the Sync package allows any function to be run in synchronous mode
    Sync (function() {
      
      // run the validator in sync so that all output logging happens before
      //   the interceptor is unhooked
      commandLineValidator.sync(null, program)

      // this stops the interception of output text
      unhook_intercept();

      // there is a bug in mocha that causes a timeout if an asynchronous test fails.
      //   in their documentation, they recommend a try/catch block
      try {
        expect(captured_text.length).toEqual(0);
        done();
      }
      catch (err) {
        done(err);
      }
    });
  });

  it ('should produce errors, then warnings from mockFiles/errAndWarn.yaml', function(done) {

    let captured_text = [];
     
    let unhook_intercept = intercept(function(txt) {
        captured_text.push(txt);
        return '';
    });

    let program = {};
    program.args = ['./test/cli-validator/mockFiles/errAndWarn.yaml'];

    Sync (function() {
      
      commandLineValidator.sync(null, program)
      unhook_intercept();

      let whichProblems = [];

      captured_text.forEach(function(line) {
        if (line.includes('errors')) {
          whichProblems.push('errors');
        }
        if (line.includes('warnings')) {
          whichProblems.push('warnings');
        }
      });

      try {
        expect(whichProblems[0]).toEqual('errors');
        expect(whichProblems[1]).toEqual('warnings');
        done();
      }
      catch (err) {
        done(err);
      }
    });
  });
});