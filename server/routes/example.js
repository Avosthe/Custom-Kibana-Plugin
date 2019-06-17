import { connectableObservableDescriptor } from "rxjs/internal/observable/ConnectableObservable";

const { Client } = require("@elastic/elasticsearch");
const { parseString } = require("xml2js");
const https = require("https");
const axios = require("axios");

const ELASTIC_SEARCH = "http://localhost:9200";

const client = new Client({ node: ELASTIC_SEARCH, maxRetries: 5 });

const defaultFirewallDocument = {
  firewallType: "palo_alto",
  firewallIpAddress: "",
  firewallUsername: "",
  firewallPassword: "",
  firewallApiKey: ""
}

export default function (server) {

  server.route([{
    path: '/api/absythe/example',
    method: 'GET',
    handler() {
      return { time: (new Date()).toISOString() };
    }
  },
  {
    path: '/api/absythe/initialFirewallQuery',
    method: 'GET',
    handler: async function handler() {
      let firewallDoc;

      async function indexDefaultDocument() {
        await client.create({ id: "1", index: "firewall", type: "firewall", body: defaultFirewallDocument });
        firewallDoc = defaultFirewallDocument;
      }

      let resp = await client.indices.exists({ index: "firewall" });

      if (resp.statusCode === 404) {
        await indexDefaultDocument();
      } else {
        resp = await client.count({ index: "firewall", type: "firewall" });
        if (resp.body.count === 0) {
          await indexDefaultDocument();
        } else {
          resp = await client.get({ id: "1", index: "firewall" });
          firewallDoc = resp.body._source;
        }
      }
      return firewallDoc;
    }
  },
  {
    path: '/api/absythe/setFirewallConfiguration',
    method: 'POST',
    handler: async function handler(request, response) {
      await client.update({ id: "1", index: "firewall", type: "firewall", body: { doc: request.payload } });
      return request.payload;
    }
  },
  {
    path: '/api/absythe/getFirewallApiKey',
    method: 'GET',
    handler: async function handler(request, response) {
      let firewallUsername = request.query.firewallUsername;
      let firewallPassword = request.query.firewallPassword;
      let firewallIpAddress = request.query.firewallIpAddress;
      let firewallApiKey;

      const agent = new https.Agent({
        rejectUnauthorized: false
      });

      const resp = await axios.get(`https://${firewallIpAddress}/api/?type=keygen&user=${firewallUsername}&password=${firewallPassword}`, { httpsAgent: agent, timeout: 2000 }).catch(() => { });
      if (resp === undefined) { // means promise was rejected, most possibly could not connect to the server
        return { error: "could not connect to the firewall" };
      }
      parseString(resp.data, (err, result) => {
        if (result.response.$.status === "success") {
          firewallApiKey =  result.response.result[0].key[0];
        }
      });

      return { firewallApiKey: firewallApiKey };

    }
  }]);
}