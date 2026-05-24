import winston from "winston";
import path from "node:path";
import { spawn } from "node:child_process";

const log_path = path.resolve('../logs');
const mkdir = spawn('mkdir', ['-p', log_path]);

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A', // 2022-01-25 03:23:10.350 PM
        }),
        winston.format.prettyPrint(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, operation, suggestion }) => {
            if (operation) {
                return `${timestamp} [${level}]: ${message} (Operation: ${operation}), Suggestion: ${suggestion}`;
            }
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: `${log_path}/error.log`, level: 'error'}),
        new winston.transports.File({ filename: `${log_path}/combined.log` })
    ]
});