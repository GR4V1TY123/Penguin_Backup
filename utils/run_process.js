import { spawn } from "node:child_process";

export const run_process = (command, args, options = {}) => {

    return new Promise((resolve, reject) => {
        const process = spawn(command, args, options);
        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        process.on('error', (err) => {
            reject(err);
        });
        process.on('error', reject);
        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Process failed with code ${code}`));
            } else {
                resolve();
            }
        });
    });
};