// Import requirements

const { parseString } = require("xml2js");
const { Client } = require("@elastic/elasticsearch");
const https = require("https");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

// Defining constants, initial configuration

const ELASTIC_SEARCH = "http://localhost:9200";
const MICROSERVICE_IP = "192.168.1.20";
const MICROSERVICE_PORT = "5020";
const JOKE = "you're a newb thinking that you can find out the password just like that! sighh, better luck next time";

let SENDGRID_APIKEY = process.env.SENDGRID_APIKEY;
sgMail.setApiKey(SENDGRID_APIKEY);

// Constant Objects

const AUTHENTICATED = {
  authenticated: 1
};

const NOT_AUTHENTICATED = {
  authenticated: 0
};

const ELASTICSEARCH_CLIENT = new Client(
  { node: ELASTIC_SEARCH, maxRetries: 5 }
);

const agent = new https.Agent({
  rejectUnauthorized: false
});

const httpsAgent = {
  httpsAgent: agent,
  timeout: 10000
};

const sort_time_descending = [{ "dateTime": "desc" }];
const custom_match = {
  sort: sort_time_descending,
  query: {
    match: {
      status: null
    }
  }
};

const ERROR = (errType) => {
  let err = { error: null};
  switch (errType){
    case "FIREWALL_CONNECTION_FAILED":
      err.error = "failed to connect to firewall";
      break;
    case "MICROSERVICE_CONNECTION_FAILED":
      err.error = "failed to connect to microservice";
      break;
    case "INVALID_FIREWALL_APIKEY":
      err.error = "invalid firewall api key";  
      break;
    case "INVALID_FIREWALL_CREDENTIALS":
      err.error = "invalid firewall credentials"
      break;
    case "NOT_AUTHENTICATED":
      err.error = "not authenticated";
      break;
    case "DOCUMENT_RETRIEVAL_FAILED":
      err.error = "error retrieving documents from elasticsearch";
      break;
    case "NOTIFICATIONCREDENTIALS_EMPTY":
      err.error = "notification credentials is empty"
      break;
    default:
      err.error = "an error has occured";
      break;
  } 
  return err;
}

const notifiable_alerts_query = {
  query: {
    match: {
      notified: false
    }
  }
}

export default function (server) {

  let getFirewallCommandLink = (firewallIpAddress, firewallApiKey, firewallCommand) => {

    let xmlFirewallCommand;

    switch (firewallCommand) {
      case "showSysInfo":
        xmlFirewallCommand = "<show><system><info></info></system></show>";
    }

    return `https://${firewallIpAddress}/api/?type=op&cmd=${xmlFirewallCommand}&key=${firewallApiKey}`;
  }

  let getAllAlertsWithProvidedStatus = async (indexName, status) => {

    let body = Object.assign({}, custom_match);
    body.query.match.status = status;
    return await ELASTICSEARCH_CLIENT.search({ index: indexName, type: "_doc", body: body });

  }

  let getAllNotifiableAlerts = async (indexName) => {

    return await ELASTICSEARCH_CLIENT.search({ index: indexName, type: "_doc", body: notifiable_alerts_query });

  }

  let addLeadingZero = (val) => {

    return val < 10 ? "0" + val : val;

  }

  let generateHtmlBodyFromAlerts = (alertsArray) => {
    let htmlContent = "";

    alertsArray.forEach(alert => {

      let threatLevel = alert.threatLevel.charAt(0).toUpperCase() + alert.threatLevel.slice(1);
      let date = new Date(alert.dateTime);
      let dateTime = `${addLeadingZero(date.getHours())}:${addLeadingZero(date.getMinutes())}:${addLeadingZero(date.getSeconds())}<br/>${date.toDateString()}`;
      let content =
        `<div style="margin-bottom: 20px; line-height: 25px;">
        <strong>Date Time:  </strong><span${dateTime}</span>
        <br/>
        <strong>Threat Level:  </strong><span>${threatLevel}</span>
        <br/>
        <strong>Threat Description:  </strong><span>${alert.description}</span>
        <br/>
        <strong>Protocol:  </strong><span>${alert.protocol}</span>
        <br/>
        <strong>Source IP | Port:  </strong><span>${alert.source.ip} : ${alert.source.port}</span>
        <br/>
        <strong>Destination IP | Port:  </strong><span>${alert.destination.ip} : ${alert.destination.port}</span>
      </div>`;
      htmlContent += content;

    });
    return htmlContent;

  }

  let isAuthenticated = (request) => {
    let isAuthenticated = request.yar.get("isAuthenticated");
    if (isAuthenticated !== null && isAuthenticated.authenticated === 1)
      return true;
    else if (isAuthenticated === null)
      request.yar.set("isAuthenticated", NOT_AUTHENTICATED);
    return false;
  }

  server.route([
    {
      path: '/api/absythe/isAuthenticated',
      method: 'GET',
      handler: (request, response) => {
        return isAuthenticated(request) ? AUTHENTICATED : NOT_AUTHENTICATED;
      }
    },
    {
      path: '/api/absythe/authenticate',
      method: 'POST',
      handler: async (request, response) => {

        let credentials = request.payload;
        const { firewallIpAddress, firewallUsername, firewallPassword } = credentials;
        let invalidCredentials = false;

        request.yar.set("credentials", credentials);
        const resp = await axios.get(`https://${firewallIpAddress}/api/?type=keygen&user=${firewallUsername}&password=${firewallPassword}`, httpsAgent).catch(() => { });
        if (resp === undefined) { // error was thrown, resp remains unassigned therefore it is undefined
          request.yar.set("isAuthenticated", NOT_AUTHENTICATED);
          return ERROR("FIREWALL_CONNECTION_FAILED");
        }

        parseString(resp.data, (err, result) => {
          if (result.response.$.status === "success") {
            let firewallApiKey = result.response.result[0].key[0];
            request.yar.set("credentials", {
              ...credentials,
              firewallApiKey: firewallApiKey
            });
            request.yar.set("isAuthenticated", AUTHENTICATED);
          }
          else {
            request.yar.set("isAuthenticated", NOT_AUTHENTICATED);
            invalidCredentials = true;
          }
        });
        credentials.firewallPassword = JOKE;
        return invalidCredentials ? ERROR("INVALID_FIREWALL_CREDENTIALS") : credentials;

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
          credentials.firewallPassword = JOKE;
          return credentials;
        }
        return ERROR("NOT_AUTHENTICATED");

      }
    },
    {
      path: '/api/absythe/firewallCommand',
      method: 'GET',
      handler: async (request, response) => {

        if (!isAuthenticated(request))
          return ERROR("NOT_AUTHENTICATED");

        let credentials = request.yar.get("credentials");
        const { firewallApiKey, firewallIpAddress } = credentials;
        let firewallCommand = request.query.firewallCommand;
        let respObj = {};
        let command = getFirewallCommandLink(firewallIpAddress, firewallApiKey, firewallCommand);

        const resp = await axios.get(command, httpsAgent).catch((err) => { console.log(err) });
        if (resp === undefined) {
          return ERROR("FIREWALL_CONNECTION_FAILED");
        }
        parseString(resp.data, (err, result) => {
          if (result.response.$.status === "success")
            respObj = result.response.result[0].system[0];
          else
            respObj = ERROR("INVALID_FIREWALL_APIKEY");
        });
        return respObj;

      }
    },
    {
      path: '/api/absythe/getMsAlerts',
      method: 'GET',
      handler: async (request, response) => {

        const { status } = request.query;

        let resp = await getAllAlertsWithProvidedStatus("msalerts", status);
        if (resp === undefined)
          return ERROR("DOCUMENT_RETRIEVAL_FAILED");
        if (resp.body.hits.total === 0)
          return [];

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

        if (!isAuthenticated(request))
          return ERROR("NOT_AUTHENTICATED");

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

        const resp = await axios.post(`http://${MICROSERVICE_IP}:${MICROSERVICE_PORT}/msalerts/respond`, postObject).catch((err) => { console.log(err); });
        if (resp === undefined)
          return ERROR("MICROSERVICE_CONNECTION_FAILED");
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

        const { medium, id } = request.payload;

        if (request.yar.get("notificationCredentials") === null)
          request.yar.set("notificationCredentials", { [medium]: id });
        else {
          let newCredentials = Object.assign({}, request.yar.get("notificationCredentials"));
          newCredentials = { ...newCredentials, [medium]: id  };
          request.yar.set("notificationCredentials", newCredentials);
        }
        return request.yar.get("notificationCredentials");

      }
    },
    {
      path: '/api/absythe/getNotifiableAlerts',
      method: 'GET',
      handler: async (request, response) => {

        let resp = await getAllNotifiableAlerts("msalerts");
        if (resp === undefined)
          return ERROR("DOCUMENT_RETRIEVAL_FAILED");
        if (resp.body.hits.total === 0)
          return [];
        let resultsArray = resp.body.hits.hits.map(result => {
          return result._source;
        });
        return resultsArray;

      }
    },
    {
      path: '/api/absythe/sendNotifications',
      method: 'POST',
      handler: async (request, response) => {

        let credentials = request.yar.get("notificationCredentials");
        if (credentials === null || credentials.email === undefined)
          return ERROR("NOTIFICATIONCREDENTIALS_EMPTY");

        let alertsArray = request.payload;
        let htmlEmailContent = generateHtmlBodyFromAlerts(alertsArray);
        let mail = {
          to: credentials.email,
          from: "msnotifications@absythe.me",
          subject: 'Micro-Service Alert Notification',
          text: "Hello World!",
          html: htmlEmailContent,
        }

        sgMail.send(mail).then(resp => {
          alertsArray.forEach(alert => {
            alert.notified = true;
            ELASTICSEARCH_CLIENT.update({ id: alert.id, index: "msalerts", type: "_doc", body: { doc: alert } });
          });
        }).catch(err => { console.log(err.response.body.errors) });

        return {};

      }
    }
  ]);
}