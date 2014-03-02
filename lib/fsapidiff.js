#!/usr/bin/env node

var diff = require('diff'),
request = require('request'),
prompt = require('prompt'),
async = require('async'),
argv = require('minimist')(process.argv.slice(2)),
fs = require('fs');
require('colors');

var configFile = process.env['HOME'] + '/.fsdiffconfig',
tests = require('./tests.json');
var writeErr = function(err) {
  if (err) throw err;
};
var badUsage = function(err) {
  process.stdout.write('ERROR: ' + err);
  process.stdout.write('Usage: fsdiff config\n');
  process.stdout.write('       fsdiff --v1=YYYYMMDD --v2=YYYYMMDD [ENDPOINT [ENDPOINT ...]] [-o OUTPUT_DIR]\n');
};

if (argv._[0] === 'config') {
  // setup config
  var schema = {
    properties: {
      'client_id': {
        pattern: /[A-Z0-9]{48}/,
        message: 'Please enter a valid 48-character client_id',
        required: true
      },
      'client_secret': {
        pattern: /[A-Z0-9]{48}/,
        message: 'Please enter a valid 48-character client_secret',
        required: true
      },
      'oauth_token': {
        description: 'oauth_token (optional)',
        pattern: /[A-Z0-9]{48}/,
        message: 'Please enter a valid 48-character oauth_token'
      }
    }
  };

  prompt.message = 'config';
  prompt.start();
  prompt.get(schema, function(err, result) {
    writeErr(err);

    fs.writeFile(configFile, JSON.stringify(result), {flag: 'w'}, function(err) {
      writeErr(err);

      process.stdout.write('Configuration successfully saved in ' + configFile + '\n');
      process.stdout.write('Normal usage: fsdiff --v1=YYYYMMDD --v2=YYYYMMDD [ENDPOINT [ENDPOINT ...]] [-o OUTPUT_DIR]\n');
      process.exit(0);
    });
  });
} else {
  fs.readFile(configFile, {encoding: 'utf-8'}, function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        badUsage('Credentials don\t exit. Please run fsdiff config first.\n');
        process.exit(1);
      } else {
        process.stderr.write('Oops, something went wrong reading from config file.\n');
        throw err;
      }
    }

    var tokens = JSON.parse(data);
    var userlessAccess, authedAccess, v1, v2, outDir, print;
    userlessAccess = 'client_id=' + tokens.client_id + '&client_secret=' + tokens.client_secret;
    authedAccess = tokens.oauth_token ? 'oauth_token=' + tokens.oauth_token : undefined;

    var test = function(e, callback) {
      var endpoint = tests[e]; // coming from global require
      if (!endpoint) {
        process.stdout.write(e + ':\t\tSkipping, endpoint not recognized\n');
        callback();
        return;
      }

      var auth = endpoint.auth ? authedAccess : userlessAccess;

      if (!auth) {
        process.stdout.write(e + ':\t\t Skipping, no auth credentials found\n');
        callback();
      } else {
        if (!print)
          process.stdout.write(e + ':\t\t Running... ');

        async.parallel([
          function(cb) {
            request('https://api.foursquare.com/v2/' + endpoint.url + '&' + auth + '&v=' + v1, function(err, resp, body) {
              cb(null, JSON.stringify(JSON.parse(body), null, 2));
            });
          },
          function(cb) {
            request('https://api.foursquare.com/v2/' + endpoint.url + '&' + auth + '&v=' + v2, function(err, resp, body) {
              cb(null, JSON.stringify(JSON.parse(body), null, 2));
            });
          }
        ],
        function(err, results) {
          // API calls done! create diff and either print or write
          var d = diff.createPatch(e + '.diff', results[0], results[1], 'v=' + v1, 'v=' + v2);
        
          if (print) {
            process.stdout.write(d);
            callback();
          } else {
            var subDir = outDir + e + '/';
            if (!fs.existsSync(subDir))
              fs.mkdirSync(outDir + e);

            async.each([
              {filename: subDir + v1 + '.json', data: results[0]},
              {filename: subDir + v2 + '.json', data: results[1]},
              {filename: subDir + e + '.diff', data: d}
            ],
            function(writeObj, cb) {
              fs.writeFile(writeObj.filename, writeObj.data, function(e) {
                writeErr(e);
                cb();
              });
            },
            function(err) {
              process.stdout.write('Done.\n');
              callback();
            });
          }
        });
      }
    };

    // CHECK: various args
    if (argv.v1 && argv.v2) {
      v1 = argv.v1;
      v2 = argv.v2;
    } else {
      badUsage('Missing one or both of v1 and v2\n');
      process.exit(1);
    }

    if (argv.o) {
      outDir = argv.o;
      if (outDir[outDir.length-1] !== '/')
        outDir += '/';

      if (!fs.existsSync(outDir))
        fs.mkdirSync(outDir);

    } else {
      print = true;
    }

    // RUN: select endpoints vs. everything
    var endpoints = argv._.length > 0 ? argv._ : Object.keys(tests);

    async.eachSeries(endpoints, test, function() {
      if (!print)
        process.stdout.write('All done!\n');

      process.exit(0);
    });
  });
}
