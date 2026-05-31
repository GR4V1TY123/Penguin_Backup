import { restore_cmd } from "../commands/mongodb/restore.js";
import { validate_connection } from "../commands/postgres/connect.js";
import { backup_cmd } from './../commands/mongodb/backup.js';

export default {
    restore: restore_cmd,
    backup: backup_cmd,
};