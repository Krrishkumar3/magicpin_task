"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextStore = void 0;
const types_1 = require("../types");
class ContextStore {
    static instance;
    categories = new Map();
    merchants = new Map();
    customers = new Map();
    triggers = new Map();
    constructor() { }
    static getInstance() {
        if (!ContextStore.instance) {
            ContextStore.instance = new ContextStore();
        }
        return ContextStore.instance;
    }
    push(scope, context_id, version, payload) {
        let store;
        switch (scope) {
            case 'category':
                store = this.categories;
                break;
            case 'merchant':
                store = this.merchants;
                break;
            case 'customer':
                store = this.customers;
                break;
            case 'trigger':
                store = this.triggers;
                break;
            default: return { accepted: false, reason: 'invalid_scope' };
        }
        const current = store.get(context_id);
        if (current && current.version >= version) {
            return { accepted: false, reason: 'stale_version', current_version: current.version };
        }
        store.set(context_id, { version, payload });
        return { accepted: true };
    }
    getCategory(id) {
        return this.categories.get(id)?.payload || null;
    }
    getMerchant(id) {
        return this.merchants.get(id)?.payload || null;
    }
    getCustomer(id) {
        return this.customers.get(id)?.payload || null;
    }
    getTrigger(id) {
        return this.triggers.get(id)?.payload || null;
    }
    getCounts() {
        return {
            category: this.categories.size,
            merchant: this.merchants.size,
            customer: this.customers.size,
            trigger: this.triggers.size
        };
    }
    clear() {
        this.categories.clear();
        this.merchants.clear();
        this.customers.clear();
        this.triggers.clear();
    }
}
exports.ContextStore = ContextStore;
//# sourceMappingURL=ContextStore.js.map