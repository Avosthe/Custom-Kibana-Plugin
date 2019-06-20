import exampleRoute from './server/routes/example';

let hapiCookiePw = process.env.HAPI_JS_PW;
let hapiJsOptions = {
  storeBlank: false,
  cookieOptions: {
      password: hapiCookiePw,
      isSecure: false
  }
};

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

    async init(server, options) { // eslint-disable-line no-unused-vars
      // Add server routes and initialize the plugin here
      await server.register({
        plugin: require('@hapi/yar'),
        options: hapiJsOptions
      });
      exampleRoute(server);
    }
  });
}
