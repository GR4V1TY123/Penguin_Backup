import { spawn } from "node:child_process";
import ora from "ora";
import select, { Separator } from '@inquirer/select';
import inquirer from 'inquirer';
import { compress_backup } from "./compress.js";

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
    const make_backup_directory = spawn('mkdir', ['-p', `backups_${config.database}`]);
    const backup_Directory = `backups_${config.database}/backup_${config.username}_${config.database}_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}${file_type}`;

    const ls = spawn(backup_cmd, [
        "-U", config.username,
        "-h", config.host,
        "-p", config.port,
        "-d", config.database,
        "-F", file_type === '.sql' ? 'p' : file_type === '.dump' ? 'c' : file_type === 'directory' ? 'd' : file_type === '.tar' ? 't' : 'c',
        "-f", backup_Directory
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
        console.error(`${data.toString().red}`);
    });

    ls.on('error', (err) => {
        console.error(`Failed to start backup process: ${err}`);
        backup_spinner.fail('Backup Failed!');
    });

    ls.on('exit', (code) => {
        if (code === 0) {
            console.log(`Backup for ${config.database} created successfully at ${backup_Directory}`.success);
            backup_spinner.succeed('Backup Created Successfully!');
            compress_backup(backup_Directory);
        } else {
            console.error(`Backup process exited with code ${code}`.error);
            backup_spinner.fail('Backup Failed!');
        }
    })
};