const rapify = require('../../../src/index');
const controllerOn = require('./controllerOn');
const controllerOff = require('./controllerOff');
const controllerNone = require('./controllerNone');

const app = rapify.bootstrap({
    onStart: () => console.log('rapify server listening...'),
    cors: true,
    bodyParser: true,
    controllers: [
        controllerOn,
        controllerOff,
        controllerNone,
    ],
});

module.exports = app;
