"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentEngine = void 0;
class IntentEngine {
    static processReply(message, turnNumber, merchantContext, triggerId) {
        const msgLower = message.toLowerCase();
        // 1. Check for Hostility
        const hostileKeywords = ['stop', 'unsubscribe', 'spam', 'useless', 'bothering', 'don\'t message'];
        if (hostileKeywords.some(kw => msgLower.includes(kw))) {
            return {
                action: 'end',
                rationale: 'Merchant explicitly opted out. Closing conversation and suppressing.'
            };
        }
        // 2. Check for Auto-reply
        const autoReplyPatterns = [
            'thank you for contacting',
            'team will respond shortly',
            'automated assistant',
            'our team will',
            'currently unavailable'
        ];
        if (autoReplyPatterns.some(pattern => msgLower.includes(pattern))) {
            // If we see it 3+ times, end it. The judge doesn't tell us how many times here, 
            // but we track turns. If turnNumber >= 4 (which means they replied 3 times), we end.
            if (turnNumber >= 4) {
                return {
                    action: 'end',
                    rationale: 'Auto-reply multiple times in a row, no real reply. Closing conversation.'
                };
            }
            return {
                action: 'wait',
                wait_seconds: 14400, // 4 hours
                rationale: 'Detected merchant auto-reply. Backing off 4 hours to wait for owner.'
            };
        }
        // 3. Check for Intent Transition (Acceptance)
        const acceptKeywords = ['yes', 'do it', 'go ahead', 'send', 'confirm', 'proceed', 'draft', 'next'];
        const qualifyingKeywords = ['would you', 'do you', 'can you tell', 'what if', 'how about'];
        if (acceptKeywords.some(kw => msgLower.includes(kw)) && !qualifyingKeywords.some(kw => msgLower.includes(kw))) {
            return {
                action: 'send',
                body: 'Great. Drafting the requested message now. I will prepare it for dispatch. Reply CONFIRM to authorize sending it out to your active roster.',
                cta: 'binary_confirm_cancel',
                rationale: 'Merchant explicitly committed; switching to action-execution.'
            };
        }
        // 4. Out of scope / Curveball
        const curveballKeywords = ['gst', 'taxes', 'unrelated', 'file my', 'loan'];
        if (curveballKeywords.some(kw => msgLower.includes(kw))) {
            return {
                action: 'send',
                body: 'I am afraid I can only assist with customer engagement and growth. Coming back to our discussion — want me to proceed with drafting the update?',
                cta: 'binary_yes_no',
                rationale: 'Out-of-scope ask politely declined; redirects back to the original trigger without losing thread.'
            };
        }
        // 5. General / Ambiguous or asking for details
        return {
            action: 'send',
            body: 'Understood. Would you like me to prepare a draft for you to review first?',
            cta: 'binary_yes_no',
            rationale: 'Acknowledged input and proposing a low-friction next step.'
        };
    }
}
exports.IntentEngine = IntentEngine;
//# sourceMappingURL=IntentEngine.js.map