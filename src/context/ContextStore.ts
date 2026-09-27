import { CategoryContext, MerchantContext, CustomerContext, TriggerContext } from '../types';

export class ContextStore {
  private static instance: ContextStore;
  
  private categories: Map<string, { version: number, payload: CategoryContext }> = new Map();
  private merchants: Map<string, { version: number, payload: MerchantContext }> = new Map();
  private customers: Map<string, { version: number, payload: CustomerContext }> = new Map();
  private triggers: Map<string, { version: number, payload: TriggerContext }> = new Map();

  private constructor() {}

  public static getInstance(): ContextStore {
    if (!ContextStore.instance) {
      ContextStore.instance = new ContextStore();
    }
    return ContextStore.instance;
  }

  public push(scope: string, context_id: string, version: number, payload: any): { accepted: boolean, reason?: string, current_version?: number } {
    let store: Map<string, { version: number, payload: any }>;
    switch(scope) {
      case 'category': store = this.categories; break;
      case 'merchant': store = this.merchants; break;
      case 'customer': store = this.customers; break;
      case 'trigger': store = this.triggers; break;
      default: return { accepted: false, reason: 'invalid_scope' };
    }

    const current = store.get(context_id);
    if (current && current.version >= version) {
      return { accepted: false, reason: 'stale_version', current_version: current.version };
    }

    store.set(context_id, { version, payload });
    return { accepted: true };
  }

  public getCategory(id: string): CategoryContext | null {
    return this.categories.get(id)?.payload || null;
  }

  public getMerchant(id: string): MerchantContext | null {
    return this.merchants.get(id)?.payload || null;
  }

  public getCustomer(id: string): CustomerContext | null {
    return this.customers.get(id)?.payload || null;
  }

  public getTrigger(id: string): TriggerContext | null {
    return this.triggers.get(id)?.payload || null;
  }

  public getCounts() {
    return {
      category: this.categories.size,
      merchant: this.merchants.size,
      customer: this.customers.size,
      trigger: this.triggers.size
    };
  }

  public clear() {
    this.categories.clear();
    this.merchants.clear();
    this.customers.clear();
    this.triggers.clear();
  }
}
