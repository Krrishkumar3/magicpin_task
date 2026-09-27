export declare class StateStore {
    private static instance;
    private conversations;
    private endedConversations;
    private suppressions;
    private constructor();
    static getInstance(): StateStore;
    addTurn(conversation_id: string, from: string, msg: string): void;
    getHistory(conversation_id: string): {
        from: string;
        msg: string;
    }[];
    endConversation(conversation_id: string): void;
    isConversationEnded(conversation_id: string): boolean;
    suppress(key: string, durationMs?: number): void;
    isSuppressed(key: string): boolean;
    clear(): void;
}
//# sourceMappingURL=StateStore.d.ts.map