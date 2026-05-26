import ora from "ora";
import path from "node:path";
import { spawn } from "node:child_process";
import { logger } from "../../utils/logger.js";
import fs from "fs";
import select, { Separator } from '@inquirer/select';

// steps:
// 1. Create temp db
// 2. Restore backup to temp db
// 3. Option to switch to temp db and drop old db, or rollback to old db if anything goes wrong with temp db
// 4. If switch to temp db, rename temp db to old db name
// 5. else rollback to old db by dropping temp db and keeping old db as is

const drop_db = async (db_name, config) => {
    const drop_db_process = spawn('dropdb', [
        db_name,
        "-U", config.username,
        "-h", config.host,
        "-p", config.port,
        "-f"
    ], {
        env: {
            ...process.env,
            PGPASSWORD: config.password
        }
    });
    drop_db_process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    drop_db_process.on('close', (code) => {
        if (code !== 0) {
            logger.error(`Failed to drop database ${db_name} during safe restore`, {
                operation: "safe_restore - drop db",
                status: "failure",
                suggestion: "Please check your database connection and try again."
            });
            reject(new Error(`Failed to drop database ${db_name} during safe restore`));
        }
    });
    drop_db_process.on('error', (err) => {
        logger.error(`Failed to start process to drop database ${db_name} during safe restore`, {
            operation: "safe_restore - drop db",
            error: err.message,
            status: "failure",
            suggestion: "Please check your database connection and try again."
        });
        reject(new Error(`Failed to start process to drop database ${db_name} during safe restore`));
    });
}

export const safe_restore = async (config) => {
    const restore_spinner = ora('Restoring Backup to ' + config.database + ' via Safe Restore...').start();
    const start_time = Date.now();

    const file_type = path.extname(config.file);
    let cmd;
    if (file_type === '.sql') {
        cmd = "psql"
    } else if (file_type === '.dump') {
        cmd = "pg_restore";
    }
    const temp_db_name = config.database + '_temp';
    const create_db = spawn('createdb', [
        temp_db_name,
        "-U", config.username,
        "-h", config.host,
        "-p", config.port
    ], {
        env: {
            ...process.env,
            PGPASSWORD: config.password
        }
    });

    create_db.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    create_db.on('error', (err) => {
        logger.error(`Failed to start process to create temporary database for safe restore`, {
            operation: "safe_restore - create temp db",
            error: err.message,
            status: "failure",
            suggestion: "Please check your database connection and try again."
        });
        restore_spinner.fail('Failed to create temporary database for safe restore');
        return;
    });

    create_db.on('close', (code) => {
        if (code !== 0) {
            logger.error(`Failed to create temporary database for safe restore`, {
                operation: "safe_restore - create temp db",
                status: "failure",
                suggestion: "Please check your database connection and try again."
            });
            restore_spinner.fail('Failed to create temporary database for safe restore');
            return;
        } else {
            const psql_args = ["-U", config.username, "-h", config.host, "-p", config.port, "-d", temp_db_name, "-f", config.file];
            const pg_restore_args = ["-U", config.username, "-h", config.host, "-p", config.port, "-d", temp_db_name, config.file];
            const restore_temp_db = spawn(cmd, [
                ...cmd === "psql" ? psql_args : pg_restore_args
            ], {
                env: {
                    ...process.env,
                    PGPASSWORD: config.password
                }
            });
            restore_temp_db.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
            restore_temp_db.on('close', async (code) => {
                if (code !== 0) {
                    logger.error(`Failed to restore backup to temporary database for safe restore`, {
                        operation: "safe_restore - restore to temp db",
                        status: "failure",
                        suggestion: "Please check your database connection and try again."
                    });
                    restore_spinner.fail('Failed to restore backup to temporary database for safe restore');
                    return;
                } else {
                    const option = await select({
                        message: 'Backup restored to temporary database successfully. What would you like to do?',
                        choices: [
                            { name: 'Switch to temporary database and drop old database', value: 'switch' },
                            { name: 'Rollback to old database and keep it as is', value: 'rollback' }
                        ]
                    });
                    if (option === 'switch') {
                        const drop_old_db = spawn('dropdb', [
                            config.database,
                            "-U", config.username,
                            "-h", config.host,
                            "-p", config.port,
                            "-f"
                        ], {
                            env: {
                                ...process.env,
                                PGPASSWORD: config.password
                            }
                        });
                        drop_old_db.stderr.on('data', (data) => {
                            console.error(`stderr: ${data}`);
                        });
                        drop_old_db.on('close', (code) => {
                            if (code !== 0) {
                                logger.error(`Failed to drop old database during safe restore`, {
                                    operation: "safe_restore - drop old db",
                                    status: "failure",
                                    suggestion: "Please check your database connection and try again."
                                });
                                restore_spinner.fail('Failed to drop old database during safe restore');
                                return;
                            } else {
                                const rename_temp_db = spawn('psql', [
                                    "-U", config.username,
                                    "-h", config.host,
                                    "-p", config.port,
                                    "-d", "postgres",
                                    "-c", `ALTER DATABASE "${temp_db_name}" RENAME TO "${config.database}";`
                                ], {
                                    env: {
                                        ...process.env,
                                        PGPASSWORD: config.password
                                    }
                                });
                                rename_temp_db.stderr.on('data', (data) => {
                                    console.error(`stderr: ${data}`);
                                });
                                rename_temp_db.on('close', (code) => {
                                    if (code !== 0) {
                                        logger.error(`Failed to rename temporary database during safe restore`, {
                                            operation: "safe_restore - rename temp db",
                                            status: "failure",
                                            suggestion: "Please check your database connection and try again."
                                        });
                                    } else {
                                        const end_time = Date.now();
                                        const duration = (end_time - start_time) / 1000;
                                        logger.info(`Safe restore process completed successfully`, {
                                            operation: "safe_restore - switch",
                                            status: "success",
                                            duration: `${duration.toFixed(3)} s`
                                        });
                                        restore_spinner.succeed('Safe restore process completed successfully');
                                    }
                                });
                            }
                        });
                    } else if (option === 'rollback') {
                        const drop_temp_db = spawn('dropdb', [
                            temp_db_name,
                            "-U", config.username,
                            "-h", config.host,
                            "-p", config.port,
                            "-f"
                        ], {
                            env: {
                                ...process.env,
                                PGPASSWORD: config.password
                            }
                        });
                        drop_temp_db.on('close', (code) => {
                            if (code !== 0) {
                                logger.error(`Failed to drop temporary database during safe restore`, {
                                    operation: "safe_restore - drop temp db",
                                    status: "failure",
                                    suggestion: "Please check your database connection and try again."
                                });
                                restore_spinner.fail('Failed to drop temporary database during safe restore');
                                return;
                            } else {
                                const end_time = Date.now();
                                const duration = (end_time - start_time) / 1000;
                                logger.info(`Safe restore process rolled back to old database successfully`, {
                                    operation: "safe_restore - rollback",
                                    status: "success",
                                    duration: `${duration.toFixed(3)} s`
                                });
                                restore_spinner.succeed('Safe restore process rolled back to old database successfully');
                            }
                        });
                    }
                }
            });
            restore_temp_db.on('error', (err) => {
                logger.error(`Failed to start restore process to temporary database for safe restore`, {
                    operation: "safe_restore - restore to temp db",
                    error: err.message,
                    status: "failure",
                    suggestion: "Please check your database connection and try again."
                });
                restore_spinner.fail('Failed to start restore process to temporary database for safe restore');
                return;
            });
        }

    });
}