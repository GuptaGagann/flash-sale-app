// src/middleware/errorHandler.js
export function notFoundHandler(req, res, next) {
    res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
    // err may be a custom error with .status
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    const payload = {
        error: err.message || 'Internal Server Error',
    };

    if (process.env.NODE_ENV !== 'production') {
        payload.stack = err.stack;
        if (err.details) payload.details = err.details;
    }

    res.status(status).json(payload);
}
