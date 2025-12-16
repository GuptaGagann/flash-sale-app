import convict from 'convict';
import dotenv from 'dotenv';

dotenv.config();

const conf = convict({
    port: {
        doc: 'The port to bind',
        format: 'port',
        default: 4000,
        env: 'PORT',
        arg: 'port'
    },
    db: {
        host: {
            doc: 'Database host name/IP',
            format: String,
            default: 'localhost',
            env: 'DB_HOST'
        },
        user: {
            doc: 'Database user',
            format: String,
            default: 'flashuser',
            env: 'DB_USER'
        },
        password: {
            doc: 'Database password',
            format: String,
            default: 'flashpass',
            env: 'DB_PASSWORD'
        },
        name: {
            doc: 'Database name',
            format: String,
            default: 'flashsale',
            env: 'DB_NAME'
        }
    },
    useDatabase: {
        doc: 'Whether to use the database implementation',
        format: Boolean,
        default: false,
        env: 'USE_DATABASE'
    }
});

// Validate configuration
conf.validate({ allowed: 'strict' });

export const config = conf.getProperties();
