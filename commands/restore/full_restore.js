import ora from "ora";
import path from "node:path";
import { spawn } from "node:child_process";
import { logger } from "../../utils/logger.js";
import fs from "fs";

export const full_restore = async (config) => {
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
                operation: "full_restore - drop db",
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
                        operation: "full_restore - create db",
                        status: "failure",
                        suggestion: "Please check your database connection and try again."
                    });
                    return;
                } else {
                    const psql_args = ["-U", config.username, "-h", config.host, "-p", config.port, "-d", config.database, "-f", config.file];
                    const pg_restore_args = ["-U", config.username, "-h", config.host, "-p", config.port, "-d", config.database, config.file];
                    const restore_process = spawn(cmd, [
                        ...cmd === "psql" ? psql_args : pg_restore_args
                    ], {
                        env: {
                            ...process.env,
                            PGPASSWORD: config.password
                        }
                    });

                    restore_process.stderr.on('data', (data) => {
                        console.error(`stderr: ${data}`);
                    });
                    restore_process.on('error', (err) => {
                        logger.error(`Failed to start full restore process`, {
                            operation: "full_restore - restore",
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
                                operation: "full_restore - restore",
                                status: "success",
                                file_size: `${file_size.toFixed(3)} MB`,
                                duration: `${duration.toFixed(3)} s`
                            });
                            restore_spinner.succeed('Database Restored Successfully in ' + duration.toFixed(3) + ' seconds!');
                        } else {
                            const end_time = Date.now();
                            const duration = (end_time - start_time) / 1000;
                            logger.error(`Restore process exited with code ${code}`, {
                                operation: "full_restore - restore",
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
