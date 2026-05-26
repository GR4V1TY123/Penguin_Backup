import { program } from "commander";
import colors from 'colors';
import inquirer from 'inquirer';
import ora from 'ora';
import { backup_cmd } from "../commands/backup.js";
import { validate_connection } from "../commands/connect.js";
import { restore_cmd } from "../commands/restore/restore_main.js";

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
    // .option("-f, --file <file>", "Path to the backup file to restore from")
    .action(async (options) => {
        const config = {
            database: options.database,
            username: options.username,
            password: options.password,
            host: options.host || 'localhost',
            port: options.port || 5432,
            // file: options.file
        };
        if (await validate_connection(config) === false) {
            process.exit(1);
        }
        restore_cmd(config);
    });

program.command("listdb")
    .description("List all available databases")
    .version("1.0.0")
    .action(() => {
        // logger.info("Listing all available databases...");
    });

program.parse();