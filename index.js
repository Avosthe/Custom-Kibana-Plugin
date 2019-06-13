import exampleRoute from './server/routes/example';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'absythe',
    uiExports: {
      app: {
        title: 'Absythe',
        description: 'Capstone Micro-Service',
        main: 'plugins/absythe/app',
        //euiIconType: 'absytheApp',
        icon: 'plugins/absythe/icon.svg'
      },
      hacks: [
        'plugins/absythe/hack'
      ],
      styleSheetPaths: require('path').resolve(__dirname, 'public/app.scss'),
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server, options) { // eslint-disable-line no-unused-vars
      // Add server routes and initialize the plugin here
      exampleRoute(server);
    }
  });
}
