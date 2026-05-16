import { program } from "commander";
import colors from 'colors';

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
    .action((options) => {
        if(!options.database || !options.username || !options.password) {
            console.error("Error: Database name, username, and password are required.".error);
            process.exit(1);
        }
        console.log(`Creating a backup of the ${options.database} ${options.username} database...`.success);
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
        if(!options.database || !options.username || !options.password) {
            console.error("Error: Database name, username, and password are required.".red);
            process.exit(1);
        }
        console.log(`Restoring the ${options.database} ${options.username} database...`.success);
    });

program.command("listdb")
    .description("List all available databases")
    .version("1.0.0")
    .action(() => {
        console.log("Listing all available databases...".info);
    });

program.parse();