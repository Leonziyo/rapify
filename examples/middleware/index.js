const rapify = require('../../src/index');
const userController = require('./controller');

rapify.bootstrap({
    onStart: () => console.log('rapify server listening...'),
    port: 3000,
    cors: true,
    bodyParser: true,
    middleware: [
        {
            middleware: (req, res, next) => {
                console.log('you can specify the middleware level for better control');
                next();
            },
            level: 'postDefault',
        },
        (req, res, next) => {
            console.log('you can specify a middleware function directly');
            next();
        },
    ],
    controllers: [
        userController,
    ],
});
