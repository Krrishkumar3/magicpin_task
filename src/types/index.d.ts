export interface CategoryContext {
    slug: string;
    offer_catalog: any[];
    voice: {
        tone: string;
        vocab_allowed?: string[];
        taboos?: string[];
    };
    peer_stats: any;
    digest: any[];
    patient_content_library?: any[];
    seasonal_beats?: any[];
    trend_signals?: any[];
}
export interface MerchantContext {
    merchant_id: string;
    category_slug: string;
    identity: any;
    subscription: any;
    performance: any;
    offers: any[];
    conversation_history: any[];
    customer_aggregate: any;
    signals: string[];
}
export interface CustomerContext {
    customer_id: string;
    merchant_id: string;
    identity: any;
    relationship: any;
    state: string;
    preferences: any;
    consent: any;
}
export interface TriggerContext {
    id: string;
    scope: 'merchant' | 'customer';
    kind: string;
    source: 'external' | 'internal';
    merchant_id: string;
    customer_id?: string | null;
    payload: any;
    urgency: number;
    suppression_key: string;
    expires_at: string;
}
export interface Action {
    conversation_id: string;
    merchant_id: string;
    customer_id: string | null;
    send_as: 'vera' | 'merchant_on_behalf';
    trigger_id: string;
    template_name: string;
    template_params: string[];
    body: string;
    cta: string;
    suppression_key: string;
    rationale: string;
}
//# sourceMappingURL=index.d.ts.map