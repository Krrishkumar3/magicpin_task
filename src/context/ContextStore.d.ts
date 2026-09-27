import { CategoryContext, MerchantContext, CustomerContext, TriggerContext } from '../types';
export declare class ContextStore {
    private static instance;
    private categories;
    private merchants;
    private customers;
    private triggers;
    private constructor();
    static getInstance(): ContextStore;
    push(scope: string, context_id: string, version: number, payload: any): {
        accepted: boolean;
        reason?: string;
        current_version?: number;
    };
    getCategory(id: string): CategoryContext | null;
    getMerchant(id: string): MerchantContext | null;
    getCustomer(id: string): CustomerContext | null;
    getTrigger(id: string): TriggerContext | null;
    getCounts(): {
        category: number;
        merchant: number;
        customer: number;
        trigger: number;
    };
    clear(): void;
}
//# sourceMappingURL=ContextStore.d.ts.map