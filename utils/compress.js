import fs from 'fs';
import zlib from 'zlib';
import ora from "ora";
import { logger } from './logger.js';

const delete_raw_backup = async (backup_file) => {
    try {
        await fs.promises.unlink(backup_file);
        logger.info(`Raw backup deleted successfully: ${backup_file}`);
    } catch (error) {
        logger.error(`Failed to delete raw backup`, {
            operation: "delete_raw_backup",
            error: error.message,
            suggestion: "Please check the file permissions and try again."
        });
    }
};

export const compress_backup = async (backup_file) => {
    const spinner = ora('Compressing backup...').start();
    const gzip = zlib.createGzip();
    const raw = fs.createReadStream(backup_file);
    const rawSize = fs.statSync(backup_file).size / (1024*1024);
    const compressed = fs.createWriteStream(backup_file + '.gz');

    raw.pipe(gzip).pipe(compressed).on('finish', async () => {
        const compressedSize = fs.statSync(backup_file + '.gz').size / (1024*1024);
        logger.info(`Backup compressed successfully: ${backup_file}.gz (Original Size: ${rawSize.toFixed(3)} MB -> Compressed Size: ${compressedSize.toFixed(3)} MB)`);
        await delete_raw_backup(backup_file);
        spinner.succeed('Backup Compressed Successfully!');
    }).on('error', (err) => {
        logger.error(`Failed to compress backup`, {
            operation: "compress_backup",
            error: err.message,
            suggestion: "Please check the file permissions and try again."
        });
        spinner.fail('Backup Compression Failed!');
    });
}