import { backup_cmd } from "../commands/postgres/backup.js";
import { validate_connection } from "../commands/postgres/connect.js";
import { restore_cmd } from './../utils/restore_main.js';

export default {
    validate: validate_connection,
    restore: restore_cmd,
    backup: backup_cmd,
};