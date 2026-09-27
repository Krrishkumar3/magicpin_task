export type IntentAction = 'send' | 'wait' | 'end';
export interface ReplyResponse {
    action: IntentAction;
    body?: string;
    cta?: string;
    rationale: string;
    wait_seconds?: number;
}
export declare class IntentEngine {
    static processReply(message: string, turnNumber: number, merchantContext: any, triggerId?: string): ReplyResponse;
}
//# sourceMappingURL=IntentEngine.d.ts.map