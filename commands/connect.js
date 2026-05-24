import ora from 'ora';
import pg from 'pg'
import colors from 'colors';
import { logger } from '../utils/logger.js';

const { Pool, Client } = pg

export const validate_connection = async (config) => {
    const validate_spinner = ora('Verifying Connection...').start();
    let i = 0;
    for (i = 0; i < 3; i++) {
        const client = new Client({
            user: config.username,
            host: config.host,
            database: config.database,
            password: config.password,
            port: config.port,
        });
        try {

            await client.connect();
            await client.query('SELECT 1');
            await client.end();
            break;
        } catch (err) {
        } finally {
            await client.end();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    if (i === 3) {
        logger.error('Database connection failed after retries', {
            operation: "connect",
            suggestion: "Please check your connection details and try again."
        });
        validate_spinner.fail('Connection Failed!');
        return false;
    }
    validate_spinner.succeed('Connection Verified!');
    return true;
}
