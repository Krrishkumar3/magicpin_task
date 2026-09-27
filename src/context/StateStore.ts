export class StateStore {
  private static instance: StateStore;
  
  // conversation_id -> turn history
  private conversations: Map<string, { from: string, msg: string }[]> = new Map();
  // conversation_id -> true if conversation ended
  private endedConversations: Set<string> = new Set();
  
  // suppression_key -> expiry timestamp (ms)
  private suppressions: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  // Conversaton Tracking
  public addTurn(conversation_id: string, from: string, msg: string) {
    if (!this.conversations.has(conversation_id)) {
      this.conversations.set(conversation_id, []);
    }
    this.conversations.get(conversation_id)!.push({ from, msg });
  }

  public getHistory(conversation_id: string): { from: string, msg: string }[] {
    return this.conversations.get(conversation_id) || [];
  }

  public endConversation(conversation_id: string) {
    this.endedConversations.add(conversation_id);
  }

  public isConversationEnded(conversation_id: string): boolean {
    return this.endedConversations.has(conversation_id);
  }

  // Suppression
  public suppress(key: string, durationMs: number = 24 * 60 * 60 * 1000) {
    if (!key) return;
    this.suppressions.set(key, Date.now() + durationMs);
  }

  public isSuppressed(key: string): boolean {
    if (!key) return false;
    const expiry = this.suppressions.get(key);
    if (expiry && expiry > Date.now()) {
      return true;
    }
    return false;
  }

  public clear() {
    this.conversations.clear();
    this.endedConversations.clear();
    this.suppressions.clear();
  }
}
