const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: 'config.env' });
const ApiError = require('./utils/apiError');
const golbaleError = require('./middlewares/errorMiddleware');
const dbConnection = require('./config/database');
// Routes
const mountRoutes = require('./routes');
//const { webhookCheckout } = require('./services/orderService');

//connect with db
dbConnection();

//Express app
const app =express();

//Enable other domains to access tour application
app.use(cors());
app.options('*', cors());

//compress all responses
app.use(compression());

///Checkout webhook
//app.post('/webhook-checkout',express.raw({ type: 'application/json' }),
//webhookCheckout )

//Middlewares
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV === 'development') {
app.use(morgan('dev'));
console.log(`mode: ${process.env.NODE_ENV}`);
}

// Limit each IP to 100 requests per `window` (here, per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message:
    'Too many accounts created from this IP, please try again after an hour',
});

// Apply the rate limiting middlewareto all requests
app.use('/api', limiter);

// Mount Routs
mountRoutes(app);

app.all('*', (req, res, next) => {
  next(new ApiError(`Cant find this route: ${req.originalUrl}`, 400));
});

//Global error handling middleware
app.use(golbaleError);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>{
console.log( `App Running On Port ${PORT}`);
});

// Handle rejections outside express
process.on('unhandledRejection', (err) => {
console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
server.close(() =>{
    console.error(`Shutting down....`);
    process.exit(1);
  });
});
