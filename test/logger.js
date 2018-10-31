const winston = require('winston');
const level = 'warn'; // 'debug';
const format = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple()
);
module.exports = winston.createLogger({
  level,
  format,
  exitOnError: false,
  transports: [
    new winston.transports.Console()
  ]
});
