import select, { Separator } from '@inquirer/select';
import { search } from '@inquirer/prompts';
import inquirer from 'inquirer';
import path from "node:path";
import { logger } from "../../utils/logger.js";
import fs from "fs";
import { full_restore } from "./full_restore.js";
import zlib from "zlib";
import { safe_restore } from './safe_restore.js';

export const restore_cmd = async (config) => {

    const restore_type = await select({
        message: 'Select the restore type:',
        choices: [
            { name: 'Safe Restore (Safe)', value: 'safe', description: 'Restore via temporary database' },
            { name: 'Full Restore (Risky)', value: 'full', description: 'Drop existing database and restore from backup' },
        ]
    });

    const start_time = Date.now();

    const selected_backup_file = await search({
        message: 'Select backup file to restore from: (Search by name)',
        source: async (input) => {

            const file_path = path.resolve("../backups/" + config.database);
            const backup_files = await fs.readdirSync(file_path);

            if (!input) {
                return backup_files.toSorted().reverse().map(file => ({
                    name: file,
                    value: path.resolve(file_path + "/" + file)
                }));
            }

            const filtered_files = backup_files.filter(file => {
                return file.toLowerCase().includes(input.toLowerCase());
            });
            return filtered_files.toSorted().reverse().map(file => ({
                name: file,
                value: path.resolve(file_path + "/" + file)
            }));
        },
    });

    if (selected_backup_file.endsWith('.gz')) {
        // if file is compressed
        const gunzip = zlib.createGunzip();
        const newFile = selected_backup_file.replace('.gz', '');
        const input = fs.createReadStream(selected_backup_file);
        const output = fs.createWriteStream(newFile);
        input.pipe(gunzip).pipe(output);
        config.file = newFile;
    } else {
        // if file is not compressed
        config.file = selected_backup_file;
    }

    if (restore_type === 'full') {
        await full_restore(config);
    } else {
        await safe_restore(config);
    }
}