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
    }
});

// Validate configuration
conf.validate({ allowed: 'strict' });

export const config = conf.getProperties();
