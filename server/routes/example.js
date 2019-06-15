const { Client } = require("@elastic/elasticsearch");

const client = new Client({ node: "http://localhost:9200", maxRetries: 5});

const defaultFirewallDocument = {
  firewallType: "palo_alto",
  firewallIpAddress: "",
  firewallUsername: "",
  firewallPassword: ""
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
    path: '/api/absythe/firewallConfiguration',
    method: 'GET',
    handler: async function handler() {

      let resp = await client.indices.exists( {index: "firewall"} );
      let firewallDoc;
  
      if (resp.statusCode === 404) {
          await client.indices.create({index: "firewall", body: firewallIndexMapping});
          await client.create({ id: "1", index: "firewall", type: "firewall", body: defaultFirewallDocument});
          firewallDoc = defaultFirewallDocument;
      } else {
          resp = await client.count({ index: "firewall", type: "firewall" });
          if (resp.body.count === 0) {
              await client.create({ id: "1", index: "firewall", type: "firewall", body: defaultFirewallDocument});
              firewallDoc = defaultFirewallDocument;
          } else {
              resp = await client.get({ id: "1", index: "firewall" });
              firewallDoc = resp.body._source;
          }
      }
      return firewallDoc;
  }
  }]);
}