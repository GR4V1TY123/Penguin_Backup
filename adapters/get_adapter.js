export const get_adapter = (db_type) => {
    switch (db_type) {
        case 'postgres':
            return import('./postgres.js');
        default:
            throw new Error('Unsupported database type: ' + db_type);
    }
};