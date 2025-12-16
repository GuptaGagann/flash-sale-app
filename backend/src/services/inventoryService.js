import { config } from '../config.js';
import * as memory from "./inventoryServiceInMemory.js";
import * as postgres from "./inventoryServicePg.js";

const useDb = config.useDatabase;

const impl = useDb ? postgres : memory;

export const addProduct = impl.addProduct;
export const getProduct = impl.getProduct;
export const listProducts = impl.listProducts;
export const listOrdersForProduct = impl.listOrdersForProduct;
export const placeOrder = impl.placeOrder;
export const cancelOrder = impl.cancelOrder;
export const clearAll = impl.clearAll;
