import { backup_cmd } from "../commands/backup";
import { validate_connection } from "../commands/connect";
import { restore_cmd } from "../commands/restore/restore_main";

export const postgres_adapter = {
    validate: validate_connection,
    restore: restore_cmd,
    backup: backup_cmd,
};