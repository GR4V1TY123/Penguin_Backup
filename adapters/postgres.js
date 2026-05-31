import { backup_cmd } from "../commands/postgres/backup.js";
import { restore_cmd } from "../commands/postgres/restore.js";

export default {
    restore: restore_cmd,
    backup: backup_cmd,
};