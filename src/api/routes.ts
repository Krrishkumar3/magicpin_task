import { Router, Request, Response } from 'express';
import { ContextStore } from '../context/ContextStore';
import { StateStore } from '../context/StateStore';
import { Composer } from '../engine/Composer';
import { IntentEngine } from '../conversation/IntentEngine';

export const apiRouter = Router();

apiRouter.get('/healthz', (req: Request, res: Response) => {
  const store = ContextStore.getInstance();
  const uptime_seconds = Math.floor(process.uptime());
  res.json({
    status: 'ok',
    uptime_seconds,
    contexts_loaded: store.getCounts()
  });
});

apiRouter.get('/metadata', (req: Request, res: Response) => {
  res.json({
    team_name: process.env.TEAM_NAME || 'Autonamous Team',
    team_members: (process.env.TEAM_MEMBERS || 'Engineer').split(','),
    model: process.env.MODEL_NAME || 'Deterministic Rules Engine (No LLM)',
    approach: process.env.APPROACH || 'Deterministic robust pattern-matching and retrieval engine with deep category specializations. Guarantees 0 hallucinations and 100% determinism.',
    contact_email: process.env.CONTACT_EMAIL || 'bot@magicpin.ai',
    version: process.env.APP_VERSION || '1.0.0',
    submitted_at: new Date().toISOString()
  });
});

apiRouter.post('/context', (req: Request, res: Response) => {
  const { scope, context_id, version, payload } = req.body;
  if (!scope || !context_id || version === undefined || !payload) {
    return res.status(400).json({ accepted: false, reason: 'invalid_payload' });
  }

  const store = ContextStore.getInstance();
  const result = store.push(scope, context_id, version, payload);
  if (result.accepted) {
    return res.status(200).json({
      accepted: true,
      ack_id: `ack_${context_id}_v${version}`,
      stored_at: new Date().toISOString()
    });
  } else if (result.reason === 'stale_version') {
    return res.status(409).json({
      accepted: false,
      reason: 'stale_version',
      current_version: result.current_version
    });
  } else {
    return res.status(400).json({
      accepted: false,
      reason: result.reason
    });
  }
});

apiRouter.post('/tick', (req: Request, res: Response) => {
  const { now, available_triggers } = req.body;
  const actions: any[] = [];
  const contextStore = ContextStore.getInstance();
  const stateStore = StateStore.getInstance();

  if (Array.isArray(available_triggers)) {
    for (const trg_id of available_triggers) {
      const trigger = contextStore.getTrigger(trg_id);
      if (!trigger) continue;

      // Check suppression
      if (trigger.suppression_key && stateStore.isSuppressed(trigger.suppression_key)) {
        continue;
      }
      // Fallback deduplication: do not send same trigger to same merchant today
      const fallbackKey = `${trigger.kind}:${trigger.merchant_id}`;
      if (stateStore.isSuppressed(fallbackKey)) {
        continue;
      }

      const merchant = contextStore.getMerchant(trigger.merchant_id);
      if (!merchant) continue;

      const category = contextStore.getCategory(merchant.category_slug);
      if (!category) continue;

      let customer = null;
      if (trigger.customer_id) {
        customer = contextStore.getCustomer(trigger.customer_id);
      }

      const action = Composer.compose(category, merchant, trigger, customer);
      
      // Mark as suppressed so we don't spam
      stateStore.suppress(trigger.suppression_key || fallbackKey);

      actions.push(action);
      
      if (actions.length >= 20) break; // Limit of 20 actions per tick
    }
  }

  res.status(200).json({ actions });
});

apiRouter.post('/reply', (req: Request, res: Response) => {
  const { conversation_id, merchant_id, message, turn_number } = req.body;
  
  const stateStore = StateStore.getInstance();
  const contextStore = ContextStore.getInstance();
  
  if (stateStore.isConversationEnded(conversation_id)) {
    return res.status(400).json({ error: 'Conversation ended' });
  }

  stateStore.addTurn(conversation_id, 'merchant', message);

  const merchant = merchant_id ? contextStore.getMerchant(merchant_id) : null;
  const replyResponse = IntentEngine.processReply(message, turn_number, merchant);

  if (replyResponse.action === 'end') {
    stateStore.endConversation(conversation_id);
  }

  // To prevent repetition, we must track our own outgoing messages too.
  if (replyResponse.body) {
    stateStore.addTurn(conversation_id, 'vera', replyResponse.body);
  }

  res.status(200).json(replyResponse);
});
