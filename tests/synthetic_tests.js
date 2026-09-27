const http = require('http');

function request(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 8080,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("=== SYNTHETIC AND ADVERSARIAL TEST SUITE ===");
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      const start = Date.now();
      await fn();
      const latency = Date.now() - start;
      console.log(`[PASS] ${name} (${latency}ms)`);
      passed++;
    } catch (e) {
      console.log(`[FAIL] ${name}: ${e.message}`);
    }
  }

  // Helper for Context Push
  async function pushContext(scope, context_id, version, payload) {
    const res = await request('/v1/context', { scope, context_id, version, payload });
    if (res.status !== 200 && res.status !== 409) {
      throw new Error(`Context push failed: ${res.status} ${JSON.stringify(res.data)}`);
    }
  }

  // 1. Missing Customer Data (Adversarial)
  await test("Tick with missing customer object", async () => {
    await pushContext('merchant', 'm_adv_1', 1, { merchant_id: 'm_adv_1', category_slug: 'salons', identity: { name: 'Adversarial Salon' } });
    await pushContext('category', 'salons', 1, { slug: 'salons' });
    await pushContext('trigger', 't_adv_1', 1, { id: 't_adv_1', kind: 'recall_due', merchant_id: 'm_adv_1', customer_id: 'non_existent_customer' });
    
    const res = await request('/v1/tick', { available_triggers: ['t_adv_1'] });
    if (!res.data.actions || res.data.actions.length === 0) throw new Error("No action returned");
    if (!res.data.actions[0].body.includes('Hi Customer')) throw new Error("Fallback customer name failed");
  });

  // 2. completely unknown trigger
  await test("Tick with completely unknown trigger (Fallback logic)", async () => {
    await pushContext('merchant', 'm_adv_2', 1, { merchant_id: 'm_adv_2', category_slug: 'unknown_cat', identity: { name: 'Unknown Shop', city: 'Delhi' }, performance: { ctr: 0.05 } });
    await pushContext('category', 'unknown_cat', 1, { slug: 'unknown_cat', peer_stats: { avg_ctr: 0.02 } });
    await pushContext('trigger', 't_adv_2', 1, { id: 't_adv_2', kind: 'alien_invasion_alert', merchant_id: 'm_adv_2' });
    
    const res = await request('/v1/tick', { available_triggers: ['t_adv_2'] });
    if (!res.data.actions || res.data.actions.length === 0) throw new Error("No action returned");
    const body = res.data.actions[0].body;
    if (!body.includes('alien invasion alert')) throw new Error("Did not parse trigger kind dynamically");
    if (!body.includes('5.0%')) throw new Error("Did not parse performance dynamically");
  });

  // 3. Null values everywhere
  await test("Tick with null/undefined values everywhere", async () => {
    await pushContext('merchant', 'm_adv_3', 1, { merchant_id: 'm_adv_3', category_slug: 'gyms', identity: {}, offers: [] });
    await pushContext('category', 'gyms', 1, { slug: 'gyms' });
    await pushContext('trigger', 't_adv_3', 1, { id: 't_adv_3', kind: 'seasonal_perf_dip', merchant_id: 'm_adv_3' });
    
    const res = await request('/v1/tick', { available_triggers: ['t_adv_3'] });
    if (!res.data.actions || res.data.actions.length === 0) throw new Error("No action returned");
    const body = res.data.actions[0].body;
    if (body.includes('undefined') || body.includes('null') || body.includes('NaN')) {
      throw new Error("Hallucinated undefined/null values in message");
    }
  });

  // 4. Very Large Numbers / Float parsing
  await test("Float and Large number parsing", async () => {
    await pushContext('merchant', 'm_adv_4', 1, { merchant_id: 'm_adv_4', category_slug: 'gyms', identity: {name:'X'}, customer_aggregate: { total_unique_ytd: 99999999999 } });
    await pushContext('trigger', 't_adv_4', 1, { id: 't_adv_4', kind: 'seasonal_perf_dip', merchant_id: 'm_adv_4' });
    const res = await request('/v1/tick', { available_triggers: ['t_adv_4'] });
    if (!res.data.actions[0].body.includes('99999999999')) throw new Error("Failed to handle large integer");
  });

  // 5. Hostile reply test
  await test("Reply with Hostile intent", async () => {
    const res = await request('/v1/reply', { conversation_id: 'conv_1', merchant_id: 'm_adv_1', message: 'Stop bothering me', turn_number: 1 });
    if (res.data.action !== 'end') throw new Error("Did not end hostile interaction");
  });

  // 6. Question reply test
  await test("Reply with Question intent", async () => {
    const res = await request('/v1/reply', { conversation_id: 'conv_2', merchant_id: 'm_adv_1', message: 'how much is this?', turn_number: 1 });
    if (res.data.action !== 'send' || !res.data.body.includes('costs are kept minimal')) throw new Error("Did not answer question correctly");
  });

  // 7. Missing specific context object entirely
  await test("Missing merchant completely", async () => {
    await pushContext('trigger', 't_adv_5', 1, { id: 't_adv_5', kind: 'recall_due', merchant_id: 'non_existent' });
    const res = await request('/v1/tick', { available_triggers: ['t_adv_5'] });
    if (res.data.actions && res.data.actions.length > 0) throw new Error("Should not compose if merchant is missing completely");
  });

  // Add more as needed...
  console.log(`\nCompleted: ${passed}/${total} passed.`);
  process.exit(passed === total ? 0 : 1);
}

runTests();
