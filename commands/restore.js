import { spawn } from "node:child_process";
import ora from "ora";
import select, { Separator } from '@inquirer/select';
import { search } from '@inquirer/prompts';
import inquirer from 'inquirer';
import { compress_backup } from "../utils/compress.js";
import path from "node:path";
import { logger } from "../utils/logger.js";
import fs from "fs";

const full_restore = async (config) => {
    const restore_spinner = ora('Restoring Backup to ' + config.database + '...').start();
    const start_time = Date.now();

    const file_type = path.extname(config.file);
    let cmd;
    if (file_type === '.sql') {
        cmd = "psql"
    } else if (file_type === '.dump') {
        cmd = "pg_restore";
    }
    const drop_current_db = spawn('dropdb', [
        config.database,
        "-U", config.username,
        "-h", config.host,
        "-p", config.port,
        "--if-exists",
        "--force"
    ], {
        env: {
            ...process.env,
            PGPASSWORD: config.password
        }
    });

    drop_current_db.on('close', (code) => {
        if (code !== 0) {
            logger.error(`Failed to drop database`, {
                operation: "restore",
                status: "failure",
                suggestion: "Please check your database connection and try again."
            });
            return;
        } else {
            const create_db = spawn('createdb', [
                config.database,
                "-U", config.username,
                "-h", config.host,
                "-p", config.port
            ], {
                env: {
                    ...process.env,
                    PGPASSWORD: config.password
                }
            });
            create_db.on('close', (code) => {
                if (code !== 0) {
                    logger.error(`Failed to create database`, {
                        operation: "restore",
                        status: "failure",
                        suggestion: "Please check your database connection and try again."
                    });
                    return;
                } else {
                    const restore_process = spawn(cmd, [
                        "-U", config.username,
                        "-h", config.host,
                        "-p", config.port,
                        "-d", config.database,
                        "-f", config.file
                    ], {
                        env: {
                            ...process.env,
                            PGPASSWORD: config.password
                        }
                    });
                    restore_process.stdout.on('data', (data) => {
                        // console.log(`stdout: ${data}`);
                    });

                    restore_process.stderr.on('data', (data) => {
                        console.error(`stderr: ${data}`);
                    });
                    restore_process.on('error', (err) => {
                        logger.error(`Failed to start full restore process`, {
                            operation: "restore",
                            error: err.message,
                            status: "failure",
                            suggestion: "Please check your database connection and try again."
                        });
                    });
                    restore_process.on('close', (code) => {
                        if (code === 0) {
                            const file_size = fs.statSync(config.file).size / (1024 * 1024);
                            const end_time = Date.now();
                            const duration = (end_time - start_time) / 1000;
                            logger.info(`Database restored successfully`, {
                                operation: "restore",
                                status: "success",
                                file_size: `${file_size.toFixed(3)} MB`,
                                duration: `${duration.toFixed(3)} s`
                            });
                            restore_spinner.succeed('Database Restored Successfully in ' + duration.toFixed(3) + ' seconds!');
                        } else {
                            const end_time = Date.now();
                            const duration = (end_time - start_time) / 1000;
                            logger.error(`Restore process exited with code ${code}`, {
                                operation: "restore",
                                status: "failure",
                                suggestion: "Please try again later.",
                                duration: `${duration.toFixed(3)} s`
                            });
                            restore_spinner.fail('Database Restore Failed!');
                        }
                    });
                }
            });
        }
    });
};

export const restore_cmd = async (config) => {

    const restore_type = await select({
        message: 'Select the restore type:',
        choices: [
            { name: 'Full Restore (Risky)', value: 'full', description: 'Drop existing database and restore from backup' },
            { name: 'Safe Restore (Safe)', value: 'safe', description: 'Restore via temporary database', disabled: 'Not supported yet' }
        ]
    });

    const start_time = Date.now();

    const selected_backup_file = await search({
        message: 'Select backup file to restore from:',
        source: async (input) => {
            if (!input) {
                return [];
            }
            const file_path = path.resolve("../backups/" + config.database);
            const backup_files = await fs.readdirSync(file_path);

            const filtered_files = backup_files.filter(file => {
                return file.toLowerCase().includes(input.toLowerCase());
            });
            return filtered_files.toSorted().reverse().map(file => ({
                name: file,
                value: path.resolve("../backups/" + config.database + "/" + file)
            }));
        },
    });

    config.file = selected_backup_file;
    if(restore_type === 'full') {
        await full_restore(config);
    } else {
        // Handle safe restore logic here
    }
}