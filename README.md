# Database Backup Utility

A cross-database command-line utility built with Node.js for managing database backups and restores.

The tool provides a unified interface for PostgreSQL and MongoDB, supporting backup creation, restoration, validation, compression, logging, and safe recovery workflows.

---

## Features

### Backup

* Create PostgreSQL backups
* Create MongoDB backups
* Automatic timestamped backup naming
* Backup compression support
* Backup validation

### Restore

* Restore databases from backup files
* Support for compressed backups
* Full database restoration
* Recovery workflow validation

### Safe Restore

* Restore into a temporary database
* Compare restored database with the current database
* User confirmation before switching
* Rollback support if restore validation fails

### Connection Testing

* Validate database credentials before operations
* Detect connection failures
* Authentication error handling
* Network error handling

### Logging

* Structured logging using Winston
* Operation tracking
* Error logging
* Backup and restore duration tracking

### Configuration

* Environment variable support
* Command-line configuration
* Input validation

### Multi-Database Support

* PostgreSQL
* MongoDB
* Adapter-based architecture for future database support

---

## Supported Databases

| Database   | Backup | Restore |
| ---------- | ------ | ------- |
| PostgreSQL | ✅      | ✅       |
| MongoDB    | ✅      | 🚧       |

---

## Installation

```bash
git clone https://github.com/your-username/database-backup-utility.git

cd database-backup-utility

npm install
```

---

## Usage

### Backup

```bash
node index.js backup \
-u postgres \
-p mypassword \
-H localhost \
-P 5432 \
-d mydatabase
```

### Restore

```bash
node index.js restore \
-u postgres \
-p mypassword \
-H localhost \
-P 5432 \
-d mydatabase
```

### Test Connection

```bash
node index.js test \
-u postgres \
-p mypassword \
-H localhost \
-P 5432 \
-d mydatabase
```

### List Backups

```bash
node index.js list
```

---

## Example Backup Structure

### PostgreSQL

```text
backups/
└── postgres/
    └── company_db/
        └── backup_postgres_company_db_20260530T142715.dump.gz
```

### MongoDB

```text
backups/
└── mongodb/
    └── world/
        └── world_20260530T142715.archive.gz
```

---

## Safe Restore Workflow

```text
Current Database
        │
        ▼
Create Temporary Database
        │
        ▼
Restore Backup
        │
        ▼
Validate Restore
        │
        ▼
Compare Databases
        │
        ▼
User Confirmation
        │
 ┌──────┴──────┐
 ▼             ▼
Proceed     Rollback
 ▼             ▼
Switch DB   Delete Temp DB
```

---

## Project Structure

```text
src/
├── adapters/
│   ├── postgres.js
│   └── mongodb.js
│
├── commands/
│   ├── backup/
│   ├── restore/
│   ├── test/
│   └── list/
│
├── utils/
│   ├── logger.js
│   ├── run_process.js
│   └── detect_db_type.js
│
└── index.js
```

---

## Technologies Used

* Node.js
* Commander
* PostgreSQL
* MongoDB
* Winston
* Inquirer
* Ora
* Child Process API
* Gzip Compression

---

## Future Improvements

* MySQL Support
* SQLite Support
* Scheduled Backups
* Cloud Storage Integration
* Backup Encryption
* Backup Integrity Verification
* Differential Backups

---

## License

MIT License
