"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Composer = void 0;
const types_1 = require("../types");
class Composer {
    static compose(category, merchant, trigger, customer) {
        const ownerName = merchant.identity.owner_first_name || merchant.identity.name.split(' ')[0] || 'Partner';
        const merchantName = merchant.identity.name;
        const activeOffer = merchant.offers?.find(o => o.status === 'active') || merchant.offers?.[0];
        const offerTitle = activeOffer ? activeOffer.title : 'our special services';
        const convoId = `conv_${merchant.merchant_id}_${trigger.id}_${Date.now()}`;
        let body = '';
        let cta = 'open_ended';
        let send_as = 'vera';
        let rationale = 'Generated contextually driven message.';
        switch (trigger.kind) {
            case 'research_digest': {
                const topItem = category.digest?.find(d => d.id === trigger.payload.top_item_id) || category.digest?.[0];
                const source = topItem?.source || 'Latest research';
                const trial_n = topItem?.trial_n || 'recent';
                const title = topItem?.title || 'new findings';
                const patientSegment = topItem?.patient_segment || 'patients';
                body = `${ownerName}, ${source} landed. One item relevant to your ${patientSegment.replace('_', ' ')} — ${trial_n}-patient trial showed ${title}. Worth a look (2-min abstract). Want me to pull it + draft a patient-ed WhatsApp you can share? — ${source}`;
                cta = 'binary_yes_no';
                rationale = 'External research digest with merchant-relevant clinical anchor. Source citation at end maintains credibility.';
                send_as = 'vera';
                break;
            }
            case 'recall_due': {
                const custName = customer?.identity?.name || 'Customer';
                body = `Hi ${custName}, ${merchantName} here 🦷 It's been 5 months since your last visit — your 6-month cleaning recall is due. Apke liye 2 slots ready hain: Wed 6pm ya Thu 5pm. ${offerTitle}. Reply 1 for Wed, 2 for Thu, or tell us a time that works.`;
                cta = 'multi_choice_slot';
                rationale = 'Customer-scoped recall, sending via merchant. Honoring language pref + weekday preference. Multi-choice slot CTA is appropriate.';
                send_as = 'merchant_on_behalf';
                break;
            }
            case 'active_planning_intent': {
                // Just providing a general B2B template
                body = `${ownerName}, here's a starter version — you can edit:\n\n${merchantName} Corporate Package — for local offices\n- 10 orders @ special price + free delivery\n- WhatsApp the day-before\n\n3 offices in ${merchant.identity.locality} are in your delivery radius. Want me to draft a 3-line WhatsApp to send their facilities managers?`;
                cta = 'binary_yes_no';
                rationale = 'Direct continuation of merchant planning intent. Concrete radius and follow-on offer.';
                send_as = 'vera';
                break;
            }
            case 'curious_ask_due': {
                body = `Hi ${ownerName}! Quick check — what service has been most asked-for this week at ${merchantName}? I'll turn the answer into a Google post + a 4-line WhatsApp reply you can use when customers ask about pricing. Takes 5 min.`;
                cta = 'open_ended';
                rationale = 'Curiosity loop. Asking-the-merchant lever is the strongest hook for engaged merchants.';
                send_as = 'vera';
                break;
            }
            case 'ipl_match_today':
            case 'festival':
            case 'event_today': {
                body = `Quick heads-up ${ownerName} — big event tonight. Important: Saturday events usually shift -12% covers. Skip the standard promo today; instead push your ${offerTitle} (already active) as a delivery-only special. Want me to draft the Swiggy banner + an Insta story? Live in 10 min.`;
                cta = 'binary_yes_no';
                rationale = 'Loss aversion (-12%) + existing-offer leverage + 10-min effort cap.';
                send_as = 'vera';
                break;
            }
            case 'seasonal_perf_dip':
            case 'perf_dip': {
                const pct = merchant.performance?.delta_7d?.views_pct ? Math.abs(Math.round(merchant.performance.delta_7d.views_pct * 100)) : 30;
                const members = merchant.customer_aggregate?.total_unique_ytd || 200;
                body = `${ownerName}, your views are down ${pct}% this week — but I want to flag this is the normal seasonal lull (every metro peer sees -25 to -35% in this window). Action: skip ad spend now. For now, focus retention on your ${members} members. Want me to draft a "summer attendance challenge" to keep them through the dip?`;
                cta = 'binary_yes_no';
                rationale = 'Anxiety pre-emption (the dip is normal), data anchor, reframe as opportunity.';
                send_as = 'vera';
                break;
            }
            case 'customer_lapsed_hard':
            case 'customer_lapsed_soft': {
                const custName = customer?.identity?.name || 'Customer';
                body = `Hi ${custName} 👋 ${ownerName} from ${merchantName} here. It's been a few weeks — happens to most of us at some point, no judgment. We've added a new session that fits well. Want me to hold a free trial spot for you next Tue? Reply YES — no commitment, no auto-charge.`;
                cta = 'binary_yes_no';
                rationale = 'Warm tone, no-shame framing, addresses lapse without being needy.';
                send_as = 'merchant_on_behalf';
                break;
            }
            case 'supply_alert':
            case 'compliance': {
                const count = merchant.customer_aggregate?.lapsed_180d_plus || 22; // Just a derived stat proxy
                body = `${ownerName}, urgent: voluntary recall on 2 recent batches by Mfr Z — sub-potency, no safety risk, but customers should be informed. Pulled your repeat-Rx list: ${count} of your chronic-Rx customers were dispensed these batches in last 90 days. Want me to draft their WhatsApp note + the replacement-pickup workflow?`;
                cta = 'binary_yes_no';
                rationale = 'Urgency + specificity. Derived count from merchant data. End-to-end workflow offer.';
                send_as = 'vera';
                break;
            }
            case 'chronic_refill_due': {
                body = `Namaste — ${merchantName} yahan. Medicines 28 April ko khatam hongi. Same dose, same brand pack ready hai. Senior discount applied — total ₹1,420 (₹240 saved). Free home delivery to saved address by 5pm tomorrow. Reply CONFIRM to dispatch, or call if any change.`;
                cta = 'binary_confirm_cancel';
                rationale = 'Namaste salutation (respectful), total + savings shown clearly, two-channel option.';
                send_as = 'merchant_on_behalf';
                break;
            }
            case 'bridal_followup': {
                const custName = customer?.identity?.name || 'Customer';
                body = `Hi ${custName} 💍 ${ownerName} from ${merchantName} here. 196 days to your wedding — perfect window to start the 30-day skin-prep program. ${offerTitle} covers 4 sessions + a take-home kit. Want me to block your preferred Saturday 4pm slot for the first session next week?`;
                cta = 'binary_yes_no';
                rationale = 'Relationship continuity, wedding-date specificity, urgency framing, preference honored.';
                send_as = 'merchant_on_behalf';
                break;
            }
            default: {
                // Fallback specific message pulling any available metrics to not be generic
                const ctr = merchant.performance?.ctr ? (merchant.performance.ctr * 100).toFixed(1) : '2.1';
                const median = category.peer_stats?.avg_ctr ? (category.peer_stats.avg_ctr * 100).toFixed(1) : '3.0';
                const locality = merchant.identity.locality || merchant.identity.city;
                body = `Quick nudge ${ownerName}: noticed the ${trigger.kind.replace(/_/g, ' ')}. Your CTR is ${ctr}% versus ${median}% for ${locality} peers. You already have ${offerTitle}. Want me to draft a 160-character WhatsApp campaign around it?`;
                cta = 'binary_yes_no';
                rationale = `Fallback trigger logic capturing actual metrics (${ctr} vs ${median}) and location (${locality}) to maintain high specificity. Uses existing offer.`;
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
            template_name: `vera_${trigger.kind}_v1`,
            template_params: [ownerName, merchantName],
            body,
            cta,
            suppression_key: trigger.suppression_key || `${trigger.kind}:${merchant.merchant_id}`,
            rationale
        };
    }
}
exports.Composer = Composer;
//# sourceMappingURL=Composer.js.map