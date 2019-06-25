import { connectableObservableDescriptor } from "rxjs/internal/observable/ConnectableObservable";

const { parseString } = require("xml2js");
const https = require("https");
const axios = require("axios");
const { Client } = require("@elastic/elasticsearch");
const ELASTIC_SEARCH = "http://localhost:9200";

const sort_time_descending = [ { "datetime": "desc"} ];
const custom_match = {
    sort: sort_time_descending,
    query: {
        match: {
            status: null
        }
    }
};

const client = new Client({ node: ELASTIC_SEARCH, maxRetries: 5 });


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

  let getAllDocuments = async (indexName, status) => {
    let body = Object.assign({}, custom_match);
    body.query.match.status = status;
    return await client.search({ index: indexName, type: indexName, body: body });
  }

  server.route([
    {
      path: '/api/absythe/isAuthenticated',
      method: 'GET',
      handler: (request, response) => {
        let isAuthenticated = request.yar.get("isAuthenticated");
        if (isAuthenticated !== null && isAuthenticated.authenticated === 1) {
          return { authenticated: 1 };
        }
        else if (isAuthenticated === null) {
          request.yar.set("isAuthenticated", { authenticated: 0 });
        }
        return { authenticated: 0 };
      }
    },
    {
      path: '/api/absythe/authenticate',
      method: 'POST',
      handler: async (request, response) => {
        let credentials = request.payload;
        const { firewallType, firewallIpAddress, firewallUsername, firewallPassword } = credentials;
        let invalidCredentials = false;

        request.yar.set("credentials", request.payload);
        const resp = await axios.get(`https://${firewallIpAddress}/api/?type=keygen&user=${firewallUsername}&password=${firewallPassword}`, httpsAgent).catch(() => { });
        if (resp === undefined) { // error was thrown, resp remains unassigned therefore it is undefined
          request.yar.set("isAuthenticated", { authenticated: 0 });
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
            request.yar.set("isAuthenticated", { authenticated: 1 });
          }
          else {
            request.yar.set("isAuthenticated", { authenticated: 0 });
            invalidCredentials = true;
          }
        });
        request.payload.firewallPassword = "you're a newb thinking that you can find out the password just like that! sighh, better luck next time";
        return invalidCredentials ? { error: "invalid firewall credentials" } : request.payload;
      }
    },
    {
      path: '/api/absythe/getFirewallConfiguration',
      method: 'GET',
      handler: (request, response) => {
        let credentials = request.yar.get("credentials");
        if (credentials !== null) {
          credentials = Object.assign({}, credentials);
          delete credentials.firewallApiKey;
          credentials.firewallPassword = "you're a newb thinking that you can find out the password just like that! sighh, better luck next time";
          return credentials;
        }
        return { error: "not authenticated" };
      }
    },
    {
      path: '/api/absythe/example',
      method: 'GET',
      handler() {
        return { time: (new Date()).toISOString() };
      }
    },
    {
      path: '/api/absythe/firewallCommand',
      method: 'GET',
      handler: async (request, response) => {
        if (request.yar.get("isAuthenticated").authenticated === 0) {
          return { error: "not authenticated" };
        }
        let credentials = request.yar.get("credentials");
        const { firewallApiKey, firewallIpAddress } = credentials;
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
    },
    {
      path: '/api/absythe/getMsAlerts',
      method: 'GET',
      handler: async (request, response) => {
        const {status} = request.query;
        let resp = await getAllDocuments("msalerts", status);
        if (resp === undefined) {
          return { error: "error retrieving msalerts" };
        }
        if (resp.body.hits.total === 0){
          return [];
        }
        let resultsArray = resp.body.hits.hits.map(result => {
          return result._source;
        });
        return resultsArray;
      }
    },
    {
      path: '/api/absythe/msalerts/respond',
      method: 'GET',
      handler: async (request, response) => {
        if (request.yar.get("isAuthenticated").authenticated === 0) {
          return { error: "not authenticated" };
        }
        const alertId = request.query.id;
        let respType = request.query.respType;
        let credentials = request.yar.get("credentials");
        const { firewallApiKey, firewallIpAddress, firewallUsername } = credentials;
        let postObject = {
          id: alertId,
          apiKey: firewallApiKey,
          firewallIP: firewallIpAddress,
          user: firewallUsername,
          respType: respType
        }
        const resp = await axios.post(`${MICROSERVICE_IP}:5020/msalerts/respond`, postObject).catch(() => { });
        if(resp === undefined){
          return { error: "error connecting to micro-service" };
        }
        return resp.data;
      }
    },
    {
      path: '/api/absythe/notificationSetup',
      method: 'GET',
      handler: async (request, response) => {
        let credentials = request.yar.get("notificationCredentials");
        return credentials === null ? {} : credentials;
      }
    },
    {
      path: '/api/absythe/notificationSetup',
      method: 'POST',
      handler: async (request, response) => {
        const {medium, id} = request.payload;
        if(request.yar.get("notificationCredentials") === null){
          request.yar.set("notificationCredentials", {
            [medium]: id
          });
        }else{
          let newCredentials = Object.assign({}, request.yar.get("notificationCredentials"));
          newCredentials = Object.assign(newCredentials, {
            [medium]: id
          });
          request.yar.set("notificationCredentials", newCredentials);
        }
        return request.yar.get("notificationCredentials");
      }
    }]);
}