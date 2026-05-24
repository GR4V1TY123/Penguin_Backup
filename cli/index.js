import { program } from "commander";
import colors from 'colors';
import inquirer from 'inquirer';
import ora from 'ora';
import { backup_cmd } from "../commands/backup.js";
import { validate_connection } from "../commands/connect.js";

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    success: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    info: 'blue',
    error: 'red'
});

program
    .name("penguin")
    .description("A CLI tool for managing your projects")
    .version("1.0.0");

program.command("backup")
    .description("Create a backup of your database")
    .version("1.0.0")
    .option("-d, --database <database>", "Name of the database to backup")
    .option("-u, --username <username>", "Username for the database")
    .option("-p, --password <password>", "Password for the database")
    .option("-H, --host <host>", "Host of the database")
    .option("-P, --port <port>", "Port of the database")
    .action(async (options) => {
        const config = {
            database: options.database,
            username: options.username,
            password: options.password,
            host: options.host || 'localhost',
            port: options.port || 5432
        };
        if (await validate_connection(config) === false) {
            process.exit(1);
        }
        backup_cmd(config);
    });

program.command("restore")
    .description("Restore your database from a backup")
    .version("1.0.0")
    .option("-d, --database <database>", "Name of the database to restore")
    .option("-u, --username <username>", "Username for the database")
    .option("-p, --password <password>", "Password for the database")
    .option("-H, --host <host>", "Host of the database")
    .option("-P, --port <port>", "Port of the database")
    .action((options) => {
        if (!options.database || !options.username || !options.password) {
            console.error("CLI error: Database name, username, and password are required.");
            process.exit(1);
        }
        logger.info(`Restoring the ${options.database} ${options.username} database...`);
    });

program.command("listdb")
    .description("List all available databases")
    .version("1.0.0")
    .action(() => {
        logger.info("Listing all available databases...");
    });

program.parse();