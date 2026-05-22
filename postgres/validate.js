import ora from 'ora';
import pg from 'pg'
import colors from 'colors';

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
            console.log(`Connection attempt ${i + 1} failed: ${err.message}`.error);
        } finally {
            await client.end();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    if (i === 3) {
        console.log('All connection attempts failed. Please check your credentials and try again.'.error);
        validate_spinner.fail('Connection Failed!');
        return false;
    }
    validate_spinner.succeed('Connection Verified!');
    return true;
}
