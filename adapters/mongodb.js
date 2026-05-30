import { validate_connection } from "../commands/postgres/connect.js";
import { restore_cmd } from './../utils/restore_main.js';
import { backup_cmd } from './../commands/mongodb/backup.js';

export default {
    validate: validate_connection,
    restore: restore_cmd,
    backup: backup_cmd,
};