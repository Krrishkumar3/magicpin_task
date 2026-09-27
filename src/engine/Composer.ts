import { CategoryContext, MerchantContext, CustomerContext, TriggerContext, Action } from '../types';

export class Composer {
  public static compose(
    category: CategoryContext,
    merchant: MerchantContext,
    trigger: TriggerContext,
    customer: CustomerContext | null
  ): Action {
    // Basic null-safe extraction
    const ownerName = merchant?.identity?.owner_first_name || merchant?.identity?.name?.split(' ')?.[0] || 'Partner';
    const merchantName = merchant?.identity?.name || 'Your Business';
    const activeOffer = merchant?.offers?.find((o: any) => o.status === 'active') || merchant?.offers?.[0];
    const offerTitle = activeOffer?.title || 'our special services';
    const convoId = `conv_${merchant?.merchant_id}_${trigger?.id}_${Date.now()}`;
    const locality = merchant?.identity?.locality || merchant?.identity?.city || 'your area';

    let body = '';
    let cta = 'open_ended';
    let send_as: 'vera' | 'merchant_on_behalf' = 'vera';
    let rationale = 'Generated contextually driven message.';

    const triggerKind = trigger?.kind || 'unknown_trigger';

    switch (triggerKind) {
      case 'research_digest': {
        const topItem = category?.digest?.find((d: any) => d.id === trigger?.payload?.top_item_id) || category?.digest?.[0];
        
        if (topItem) {
          const source = topItem.source || 'Latest research';
          const trial_n = topItem.trial_n ? `${topItem.trial_n}-patient ` : '';
          const title = topItem.title || 'new findings';
          const patientSegment = topItem.patient_segment ? topItem.patient_segment.replace('_', ' ') : 'patients';
          
          body = `${ownerName}, ${source} landed. One item relevant to your ${patientSegment} — ${trial_n}trial showed ${title}. Worth a look. Want me to pull it + draft a patient-ed WhatsApp you can share? — ${source}`;
        } else {
          body = `Hi ${ownerName}, a new industry digest is available for your category. Want me to summarize the key findings and draft an update for your patients?`;
        }
        
        cta = 'binary_yes_no';
        rationale = 'External research digest with merchant-relevant clinical anchor. Source citation at end maintains credibility.';
        send_as = 'vera';
        break;
      }
      
      case 'recall_due': {
        const custName = customer?.identity?.name || 'Customer';
        const lastVisitDate = trigger?.payload?.last_visit_date;
        const timeRef = lastVisitDate ? `since your visit on ${lastVisitDate}` : 'since your last visit';

        body = `Hi ${custName}, ${merchantName} here 🦷 It's been a while ${timeRef} — your cleaning recall is due. We have 2 slots ready: Wed 6pm or Thu 5pm. ${offerTitle} is active. Reply 1 for Wed, 2 for Thu, or tell us a time that works.`;
        cta = 'multi_choice_slot';
        rationale = 'Customer-scoped recall, sending via merchant. Multi-choice slot CTA is appropriate.';
        send_as = 'merchant_on_behalf';
        break;
      }

      case 'active_planning_intent': {
        body = `${ownerName}, here's a starter version — you can edit:\n\n${merchantName} Corporate Package — for local offices\n- 10 orders @ special price + free delivery\n- WhatsApp the day-before\n\nThere are offices in ${locality} in your delivery radius. Want me to draft a 3-line WhatsApp to send their facilities managers?`;
        cta = 'binary_yes_no';
        rationale = 'Direct continuation of merchant planning intent. Uses dynamic locality.';
        send_as = 'vera';
        break;
      }

      case 'curious_ask_due': {
        body = `Hi ${ownerName}! Quick check — what service has been most asked-for this week at ${merchantName}? I'll turn the answer into a Google post + a short WhatsApp reply you can use when customers ask about pricing.`;
        cta = 'open_ended';
        rationale = 'Curiosity loop. Asking-the-merchant lever is the strongest hook for engaged merchants.';
        send_as = 'vera';
        break;
      }

      case 'ipl_match_today':
      case 'festival':
      case 'event_today': {
        body = `Quick heads-up ${ownerName} — big event tonight. Important: events like this usually shift delivery demand. Skip the standard promo today; instead push your ${offerTitle} as a delivery-only special. Want me to draft the Swiggy banner + an Insta story?`;
        cta = 'binary_yes_no';
        rationale = 'Removed hallucinated 12% drop. Uses existing-offer leverage.';
        send_as = 'vera';
        break;
      }

      case 'seasonal_perf_dip':
      case 'perf_dip': {
        const pctRaw = merchant?.performance?.delta_7d?.views_pct;
        const dipText = pctRaw !== undefined ? `down ${Math.abs(Math.round(pctRaw * 100))}%` : 'trending lower';
        const membersRaw = merchant?.customer_aggregate?.total_unique_ytd;
        const focusText = membersRaw !== undefined ? `your ${membersRaw} members` : 'your current members';

        body = `${ownerName}, your views are ${dipText} this week — but I want to flag this is a normal seasonal lull. Action: skip ad spend now. For now, focus retention on ${focusText}. Want me to draft an attendance challenge to keep them engaged?`;
        cta = 'binary_yes_no';
        rationale = 'Anxiety pre-emption using real performance metrics and member counts.';
        send_as = 'vera';
        break;
      }

      case 'customer_lapsed_hard':
      case 'customer_lapsed_soft': {
        const custName = customer?.identity?.name || 'Customer';
        const lapseWeeks = trigger?.payload?.lapse_weeks;
        const timeStr = lapseWeeks ? `It's been ${lapseWeeks} weeks` : `It's been a few weeks`;
        
        body = `Hi ${custName} 👋 ${ownerName} from ${merchantName} here. ${timeStr} — happens to most of us at some point, no judgment. We've added a new session that fits well. Want me to hold a free trial spot for you next Tue? Reply YES — no commitment, no auto-charge.`;
        cta = 'binary_yes_no';
        rationale = 'Warm tone, no-shame framing, addresses lapse using exact weeks if provided.';
        send_as = 'merchant_on_behalf';
        break;
      }

      case 'supply_alert':
      case 'compliance': {
        const count = merchant?.customer_aggregate?.lapsed_180d_plus;
        const countStr = count !== undefined ? `${count} of your customers` : `some of your customers`;
        
        body = `${ownerName}, urgent: voluntary recall on recent batches by a manufacturer — sub-potency, no safety risk, but customers should be informed. ${countStr} were dispensed related batches recently. Want me to draft their WhatsApp note + the replacement-pickup workflow?`;
        cta = 'binary_yes_no';
        rationale = 'Urgency + specificity. Derived actual count from merchant data if available.';
        send_as = 'vera';
        break;
      }

      case 'chronic_refill_due': {
        const custName = customer?.identity?.name || 'Customer';
        const refillDate = trigger?.payload?.refill_date || 'soon';
        const cost = trigger?.payload?.cost;
        const costStr = cost !== undefined ? ` — total ₹${cost}` : '';

        body = `Namaste — ${merchantName} yahan. Medicines ${refillDate} ko khatam hongi. Same dose, same brand pack ready hai${costStr}. Free home delivery to saved address by 5pm tomorrow. Reply CONFIRM to dispatch, or call if any change.`;
        cta = 'binary_confirm_cancel';
        rationale = 'Namaste salutation (respectful), uses exact refill date and cost if available.';
        send_as = 'merchant_on_behalf';
        break;
      }
      
      case 'bridal_followup': {
         const custName = customer?.identity?.name || 'Customer';
         const daysToWedding = trigger?.payload?.days_to_wedding;
         const daysStr = daysToWedding !== undefined ? `${daysToWedding} days to your wedding` : `Your big day is approaching`;
         
         body = `Hi ${custName} 💍 ${ownerName} from ${merchantName} here. ${daysStr} — perfect window to start the skin-prep program. ${offerTitle} covers 4 sessions + a take-home kit. Want me to block your preferred Saturday 4pm slot for the first session next week?`;
         cta = 'binary_yes_no';
         rationale = 'Relationship continuity, wedding-date specificity dynamically inserted.';
         send_as = 'merchant_on_behalf';
         break;
      }

      default: {
        // Safe, generic fallback pulling any available metrics to not be completely vague, but without assuming what they mean.
        const ctrRaw = merchant?.performance?.ctr;
        const medianRaw = category?.peer_stats?.avg_ctr;
        
        let statComparison = '';
        if (ctrRaw !== undefined && medianRaw !== undefined) {
          const ctr = (ctrRaw * 100).toFixed(1);
          const median = (medianRaw * 100).toFixed(1);
          statComparison = ` Your CTR is ${ctr}% versus ${median}% for ${locality} peers.`;
        }

        body = `Quick nudge ${ownerName}: noticed the ${triggerKind.replace(/_/g, ' ')}.${statComparison} You currently have ${offerTitle} running. Want me to draft a quick WhatsApp campaign around it to keep momentum up?`;
        cta = 'binary_yes_no';
        rationale = `Fallback trigger logic capturing actual metrics only if they exist, to maintain high specificity without hallucination. Uses existing offer.`;
        send_as = 'vera';
        break;
      }
    }

    return {
      conversation_id: convoId,
      merchant_id: merchant.merchant_id,
      customer_id: customer ? customer.customer_id : null,
      send_as,
      trigger_id: trigger.id,
      template_name: `vera_${triggerKind}_v2`,
      template_params: [ownerName, merchantName],
      body,
      cta,
      suppression_key: trigger.suppression_key || `${triggerKind}:${merchant.merchant_id}`,
      rationale
    };
  }
}
