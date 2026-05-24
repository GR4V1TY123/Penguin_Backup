import fs from 'fs';
import zlib from 'zlib';
import ora from "ora";

export const compress_backup = (backup_file) => {
    const spinner = ora('Compressing backup...').start();
    const gzip = zlib.createGzip();
    const raw = fs.createReadStream(backup_file);
    const rawSize = fs.statSync(backup_file).size / (1024*1024);
    const compressed = fs.createWriteStream(backup_file + '.gz');

    raw.pipe(gzip).pipe(compressed).on('finish', () => {
        const compressedSize = fs.statSync(backup_file + '.gz').size / (1024*1024);
        console.log(`Backup compressed successfully to ${backup_file}.gz`.success);
        console.log(`Original size: ${rawSize.toFixed(3)} MB -> Compressed size: ${compressedSize.toFixed(3)} MB`.info);
        spinner.succeed('Backup Compressed Successfully!');
    }).on('error', (err) => {
        console.error(`Failed to compress backup: ${err}`.error);
        spinner.fail('Backup Compression Failed!');
    });
}