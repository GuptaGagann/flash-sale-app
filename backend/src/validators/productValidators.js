// src/validators/productValidators.js
import Joi from 'joi';

export const createProductSchema = Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    stock: Joi.number().integer().min(0).required(),
}).unknown(true);

export const bulkUploadSchema = Joi.array().items(createProductSchema).min(1);

export const placeOrderSchema = Joi.object({
    userId: Joi.string().trim().min(1).required(),
    quantity: Joi.number().integer().min(1).required(),
});
