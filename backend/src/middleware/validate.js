export function validate(schema) {
    return (req, res, next) => {
        const options = { abortEarly: false, allowUnknown: false, stripUnknown: true };
        const { error, value } = schema.validate(req.body, options);
        if (error) {
            const details = error.details.map(d => ({ message: d.message, path: d.path }));
            return res.status(400).json({ error: 'Validation error', details });
        }
        // put the sanitized value back on req.body
        req.body = value;
        next();
    };
}
