"use strict"

const alexa = require("alexa-app");
const _ = require("underscore");
const express = require('express');
const bodyParser = require('body-parser');
const PubSub = require('pubsub-js');
PubSub.immediateExceptions = true;

module.exports = new function () {
  var self = this;

  //replace these settings to point to your webhook channel
  var metadata = {
    allowConfigUpdate: true, //set to false to turn off REST endpoint of allowing update of metadata
    waitForMoreResponsesMs: 200,  //milliseconds to wait for additional webhook responses
    amzn_appId: "amzn1.ask.skill.9d37072a-31e0-4390-97aa-e59fd7205b2d",
    channelSecretKey: 'FmfrPvUvGNf0H3ZYvhXdkjtOtmI2Zqn6',
    channelUrl: 'https://botfrk1I0024H8BCC65bots-mpaasocimt.botmxp.ocp.oraclecloud.com:443/connectors/v1/tenants/idcs-6d466372210e4300bb31f4db15e8e96c/listeners/webhook/channels/4A982611-EC67-489C-BD6D-7A630C04CF42'
  };

  this.randomIntInc = function (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
  };

  this.setConfig = function (config) {
    metadata = _.extend(metadata, _.pick(config, _.keys(metadata)));
  }


  this.init = function (config) {

    var app = express();
    var alexaRouter = express.Router();
    alexaRouter.use(bodyParser.json());

    app.use('/alexa', alexaRouter);
    var logger = (config ? config.logger : null);
    if (!logger) {
      logger = console;
    }

    if (metadata.allowConfigUpdate) {
      app.put('/config', bodyParser.json(), function (req, res) {
        let config = req.body;
        logger.info(config);
        if (config) {
          self.setConfig(config);
        }
        res.sendStatus(200).send();
      });
    }


    // OracleBot.init(app);

    app.get('/home', bodyParser.json(), function (req, res) {
      console.log("inside /home");
      res.send('Welcome to home page!');
    });

    var alexa_app = new alexa.app("app");

    alexa_app.intent("CommandBot", {},
      function (alexa_req, alexa_res) {

        var command = alexa_req.slot("command");
        var session = alexa_req.getSession();
        var userId = session.get("userId");
        if (!userId) {
          //userId = session.details.userId;
          userId = session.details.user.userId;
          if (!userId) {
            userId = self.randomIntInc(1000000, 9999999).toString();
          }
          session.set("userId", userId);
        }
        alexa_res.shouldEndSession(false);
        if (userId && command) {
          alexa_res.say("You have successfully triggered Alexa using Command Bot");
          //alexa_res.send();
        } else {
          _.defer(function () {
            alexa_res.say("I don't understand. Could you please repeat what you want?");
            //alexa_res.send();
          });
        }
        //return false;
      }
    );

    alexa_app.intent("AMAZON.StopIntent", {},
      function (alexa_req, alexa_res) {
        alexa_res.shouldEndSession(true);
      }
    );

    alexa_app.launch(function (alexa_req, alexa_res) {
      var session = alexa_req.getSession();
      session.set("startTime", Date.now());
      alexa_res.say("Welcome to SingleBot. ");
    });

    alexa_app.pre = function (alexa_req, alexa_res, alexa_type) {
      logger.debug(alexa_req.data.session.application.applicationId);
      // change the application id
      if (alexa_req.data.session.application.applicationId != metadata.amzn_appId) {
        logger.error("fail as application id is not valid");
        alexa_res.fail("Invalid applicationId");
      }
      logger.info(JSON.stringify(alexa_req.data, null, 4));

    };
    //alexa_app.express(alexaRouter, "/", true);
    alexa_app.express({ router: alexaRouter, checkCert: false });

    app.locals.endpoints = [];

    app.locals.endpoints.push({
      name: 'alexa',
      method: 'POST',
      endpoint: '/alexa/app'
    });

    app.locals.endpoints.push({
      name: 'home',
      method: 'GET',
      endpoint: '/home'
    });

    return app;
  };

  return this;

}();


