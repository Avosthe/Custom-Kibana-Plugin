import { connectableObservableDescriptor } from "rxjs/internal/observable/ConnectableObservable";

const { parseString } = require("xml2js");
const https = require("https");
const axios = require("axios");

const agent = new https.Agent({
  rejectUnauthorized: false
});

const httpsAgent = {
  httpsAgent: agent,
  timeout: 3000
};

export default function (server) {

  let getFirewallCommandLink = (firewallIpAddress, firewallApiKey, firewallCommand) => {
    let xmlFirewallCommand;

    switch (firewallCommand) {
      case "showSysInfo":
        xmlFirewallCommand = "<show><system><info></info></system></show>";
    }

    return `https://${firewallIpAddress}/api/?type=op&cmd=${xmlFirewallCommand}&key=${firewallApiKey}`;
  }

  server.route([
    {
      path: '/api/absythe/isAuthenticated',
      method: 'GET',
      handler: (request, response) => {
        let isAuthenticated = request.yar.get("isAuthenticated");
        if(isAuthenticated !== null && isAuthenticated.authenticated === 1){
          return {authenticated: 1};
        }
        else if(isAuthenticated === null){
          request.yar.set("isAuthenticated", {authenticated: 0});
        }
        return {authenticated: 0};
      }
    },
    {
      path: '/api/absythe/authenticate',
      method: 'POST',
      handler: async (request, response) => {
        let credentials = request.payload;
        const {firewallType, firewallIpAddress, firewallUsername, firewallPassword} = credentials;
        let invalidCredentials = false;

        request.yar.set("credentials", request.payload);
        const resp = await axios.get(`https://${firewallIpAddress}/api/?type=keygen&user=${firewallUsername}&password=${firewallPassword}`, httpsAgent).catch(() => { });
        if (resp === undefined) { // error was thrown, resp remains unassigned therefore it is undefined
          request.yar.set("isAuthenticated", {authenticated: 0});
          return { error: "could not connect to the firewall" };
        }
        parseString(resp.data, (err, result) => {
          if (result.response.$.status === "success") {
            let firewallApiKey = result.response.result[0].key[0];
            request.yar.set("credentials", {
            firewallType: firewallType,
            firewallIpAddress: firewallIpAddress,
            firewallUsername: firewallUsername,
            firewallPassword: firewallPassword,
            firewallApiKey: firewallApiKey
            });
            request.yar.set("isAuthenticated", {authenticated: 1});
          }
          else {
            request.yar.set("isAuthenticated", {authenticated: 0});
            invalidCredentials = true;
          }
        });
        request.payload.firewallPassword = "you're a newb thinking that you can find out the password just like that! sighh, better luck next time";
        return invalidCredentials ? {error: "invalid firewall credentials"} : request.payload;
      }
    },
    {
      path: '/api/absythe/getFirewallConfiguration',
      method: 'GET',
      handler: (request, response) => {
        let credentials = request.yar.get("credentials");
        if(credentials !== null){
          delete credentials.firewallApiKey;
          credentials.firewallPassword = "you're a newb thinking that you can find out the password just like that! sighh, better luck next time";
          return credentials;
        }
        return {error: "not authenticated"};
      }
    },
    {
      path: '/api/absythe/example',
      method: 'GET',
      handler() {
        return { time: (new Date()).toISOString() };
      }
    }, {
      path: '/api/absythe/firewallCommand',
      method: 'GET',
      handler: async (request, response) => {
        if(request.yar.get("isAuthenticated").authenticated === 0){
          return {error: "not authenticated"};
        }
        let credentials = request.yar.get("credentials");
        const {firewallApiKey, firewallIpAddress} = credentials;
        let firewallCommand = request.query.firewallCommand;
        let respObj = {};

        let command = getFirewallCommandLink(firewallIpAddress, firewallApiKey, firewallCommand);
        const resp = await axios.get(command, httpsAgent).catch(() => { });
        if (resp === undefined) {
          respObj.error = "could not connect to firewall";
          return respObj;
        }
        parseString(resp.data, (err, result) => {
          if (result.response.$.status === "success") {
            respObj = result.response.result[0].system[0];
          }
          else {
            respObj.error = "invalid firewallApiKey, might have expired";
          }
        });
        return respObj;
      }
    }]);
}