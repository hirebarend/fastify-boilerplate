import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  format: format.combine(format.timestamp(), format.cli()),
  level: 'info',
  transports: [new transports.Console({})],
});
