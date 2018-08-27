const rapify = require('../../src/index');
const userController = require('./controller');

rapify.bootstrap({
    onStart: () => console.log('rapify server listening...'),
    port: 3000,
    bodyParser: true,
    controllers: [
        userController,
    ],
});
