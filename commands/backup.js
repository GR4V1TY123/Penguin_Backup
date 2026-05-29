import { spawn } from "node:child_process";
import ora from "ora";
import select, { Separator } from '@inquirer/select';
import inquirer from 'inquirer';
import { compress_backup } from "../utils/compress.js";
import path from "node:path";
import { logger } from "../utils/logger.js";
import fs from "fs";

const make_backup = async (config, backup_location, file_type) => {
    try {
        const start_time = Date.now();
        return run_process('pg_dump', [
            "-U", config.username,
            "-h", config.host,
            "-p", config.port,
            "-F", file_type === '.sql' ? 'p' : 'c',
            "-f", backup_location,
            config.database
        ], {
            env: {
                ...process.env,
                PGPASSWORD: config.password
            }
        }).then(() => {
            const end_time = Date.now();
            const duration = (end_time - start_time) / 1000;
            logger.info('Backup created successfully', {
                operation: "backup",
                status: "success",
                file_size: `${(fs.statSync(backup_location).size / (1024 * 1024)).toFixed(3)} MB`,
                suggestion: "You can find the backup at " + backup_location,
                duration: `${duration.toFixed(3)} s`
            });
            return backup_location;
        }).catch(err => {
            logger.error(`Failed to create backup`, {
                operation: "backup",
                error: err.message,
                status: "failure",
                suggestion: "Please check your database connection and try again."
            });
            throw err;
        });
    } catch (err) {
        logger.error(`Failed to create backup`, {
            operation: "backup",
            error: err.message,
            status: "failure",
            suggestion: "Please check your database connection and try again."
        });
        backup_spinner.fail('Backup Failed!');
    }
}

const make_backup_directory = () => {
    try {
        return run_process('mkdir', ['-p', path.resolve(`../backups/${config.database}`)]);
    } catch (err) {
        logger.error(`Failed to create backup directory`, {
            operation: "backup - make backup directory",
            error: err.message,
            status: "failure",
            suggestion: "Please check your file system permissions and try again."
        });
        throw err;
    }
}
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
    const backup_path = path.resolve(`../backups/${config.database}`);

    await make_backup_directory();

    const backup_location = `${backup_path}\\backup_${config.username}_${config.database}_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}${file_type}`;
    await make_backup(config, backup_location, file_type);

    await compress_backup(backup_location);
};