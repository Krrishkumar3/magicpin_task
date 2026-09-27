export type IntentAction = 'send' | 'wait' | 'end';

export interface ReplyResponse {
  action: IntentAction;
  body?: string;
  cta?: string;
  rationale: string;
  wait_seconds?: number;
}

export class IntentEngine {
  public static processReply(message: string, turnNumber: number, merchantContext: any, triggerId?: string): ReplyResponse {
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

    // 3. Check for Objection / Rejection
    const objectionKeywords = ['no', 'not interested', 'maybe later', 'too busy', 'not now'];
    if (objectionKeywords.some(kw => msgLower.includes(kw))) {
      return {
        action: 'end',
        body: 'Understood, I will leave it for now. Let me know if you need anything else.',
        rationale: 'Merchant objected or rejected the prompt. Gracefully stopping without being aggressive.'
      };
    }

    // 4. Check for Intent Transition (Acceptance)
    const acceptKeywords = ['yes', 'do it', 'go ahead', 'send', 'confirm', 'proceed', 'draft', 'next', 'ok', 'okay'];
    const qualifyingKeywords = ['would you', 'do you', 'can you tell', 'what if', 'how about', 'how much'];
    
    if (acceptKeywords.some(kw => msgLower.includes(kw)) && !qualifyingKeywords.some(kw => msgLower.includes(kw))) {
      return {
        action: 'send',
        body: 'Great. Drafting the requested message now. I will prepare it for dispatch. Reply CONFIRM to authorize sending it out.',
        cta: 'binary_confirm_cancel',
        rationale: 'Merchant explicitly committed; switching to action-execution.'
      };
    }

    // 5. Check for Questions
    const questionKeywords = ['how', 'what', 'why', 'who', 'when', 'expensive', 'cost', '?'];
    if (questionKeywords.some(kw => msgLower.includes(kw))) {
      return {
        action: 'send',
        body: 'I am here to help you grow your business. Depending on the campaign, costs are kept minimal or use existing assets. Want me to just draft a free preview for you?',
        cta: 'binary_yes_no',
        rationale: 'Merchant asked a question. Addressed generally and pivoted to a low-friction preview offer.'
      };
    }

    // 6. Out of scope / Curveball
    const curveballKeywords = ['gst', 'taxes', 'unrelated', 'file my', 'loan'];
    if (curveballKeywords.some(kw => msgLower.includes(kw))) {
      return {
        action: 'send',
        body: 'I am afraid I can only assist with customer engagement and growth. Coming back to our discussion — want me to proceed with drafting the update?',
        cta: 'binary_yes_no',
        rationale: 'Out-of-scope ask politely declined; redirects back to the original trigger without losing thread.'
      };
    }

    // 7. General / Ambiguous
    return {
      action: 'send',
      body: 'Understood. Would you like me to prepare a draft for you to review first?',
      cta: 'binary_yes_no',
      rationale: 'Acknowledged ambiguous input and proposed a low-friction next step.'
    };
  }
}
