import { spawn } from "node:child_process";
import ora from "ora";
import select, { Separator } from '@inquirer/select';
import inquirer from 'inquirer';
import { compress_backup } from "../utils/compress.js";
import path from "node:path";
import { logger } from "../utils/logger.js";

export const backup_cmd = async (config) => {

    const backup_spinner = ora('Creating Backup of ' + config.database + '...').start();
    const backup_fileType = await select({
        message: 'Select the backup file type:',
        choices: [
            { name: 'SQL', value: '.sql', description: 'Plain SQL format (.sql)' },
            { name: 'Custom Format (recommended)', value: '.dump', description: 'Custom format (.dump), (recommended for PostgreSQL)' },
            { name: 'Directory Format', value: 'directory', description: 'Directory format (a directory with multiple files)', disabled: 'Not supported yet' },
            { name: 'Tar Format', value: '.tar', description: 'Tar format (.tar)', disabled: 'Not supported yet' },
        ]
    });
    const file_type = backup_fileType || '.dump';

    const backup_cmd = `pg_dump`;
    const backup_path = path.resolve('../', `backups/${config.database}`);
    const make_backup_directory = spawn('mkdir', ['-p', backup_path]);
    const backup_location = `${backup_path}\\backup_${config.username}_${config.database}_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}${file_type}`;

    const ls = spawn(backup_cmd, [
        "-U", config.username,
        "-h", config.host,
        "-p", config.port,
        "-d", config.database,
        "-F", file_type === '.sql' ? 'p' : file_type === '.dump' ? 'c' : file_type === 'directory' ? 'd' : file_type === '.tar' ? 't' : 'c',
        "-f", backup_location
    ], {
        env: {
            ...process.env,
            PGPASSWORD: config.password
        }
    });

    ls.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ls.on('error', (err) => {
        logger.error(`Failed to start backup process`, {
            operation: "backup",
            error: err.message,
            suggestion: "Please check your database connection and try again."
        });
        backup_spinner.fail('Backup Failed!');
    });

    ls.on('exit', (code) => {
        if (code === 0) {
            logger.info(`Backup for ${config.database} created successfully at ${backup_location}`);
            backup_spinner.succeed('Backup Created Successfully!');
            compress_backup(backup_location);
        } else {
            logger.error(`Backup process exited with code ${code}`, {
                operation: "backup",
                suggestion: "Please try again later."
            });
            backup_spinner.fail('Backup Failed!');
        }
    })
};