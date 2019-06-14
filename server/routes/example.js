

export default function (server) {

  server.route({
    path: '/api/absythe/example',
    method: 'GET',
    handler() {
      return { time: (new Date()).toISOString() };
    }
  });
}