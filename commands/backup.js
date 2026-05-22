import { spawn } from "node:child_process";

export const backup_cmd = (username, password, host, port, database) => {

    const backup_cmd = `pg_dump`;

    const ls = spawn(backup_cmd, [
        "-U", username,
        "-h", host,
        "-p", port,
        "-d", database,
        "-f", `backup_${username}.sql`
    ], {
        env: {
            ...process.env,
            PGPASSWORD: password
        }
    });

    ls.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ls.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}