export const get_adapter = async (db_type) => {
    switch (db_type) {
        case 'postgres':
            return (await import('./postgres.js')).default;
        case 'mongodb':
            return (await import('./mongodb.js')).default;
        default:
            throw new Error('Unsupported database type: ' + db_type);
    }
};