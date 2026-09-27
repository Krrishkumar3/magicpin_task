"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateStore = void 0;
class StateStore {
    static instance;
    // conversation_id -> turn history
    conversations = new Map();
    // conversation_id -> true if conversation ended
    endedConversations = new Set();
    // suppression_key -> expiry timestamp (ms)
    suppressions = new Map();
    constructor() { }
    static getInstance() {
        if (!StateStore.instance) {
            StateStore.instance = new StateStore();
        }
        return StateStore.instance;
    }
    // Conversaton Tracking
    addTurn(conversation_id, from, msg) {
        if (!this.conversations.has(conversation_id)) {
            this.conversations.set(conversation_id, []);
        }
        this.conversations.get(conversation_id).push({ from, msg });
    }
    getHistory(conversation_id) {
        return this.conversations.get(conversation_id) || [];
    }
    endConversation(conversation_id) {
        this.endedConversations.add(conversation_id);
    }
    isConversationEnded(conversation_id) {
        return this.endedConversations.has(conversation_id);
    }
    // Suppression
    suppress(key, durationMs = 24 * 60 * 60 * 1000) {
        if (!key)
            return;
        this.suppressions.set(key, Date.now() + durationMs);
    }
    isSuppressed(key) {
        if (!key)
            return false;
        const expiry = this.suppressions.get(key);
        if (expiry && expiry > Date.now()) {
            return true;
        }
        return false;
    }
    clear() {
        this.conversations.clear();
        this.endedConversations.clear();
        this.suppressions.clear();
    }
}
exports.StateStore = StateStore;
//# sourceMappingURL=StateStore.js.map