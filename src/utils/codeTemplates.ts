/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const codeTemplates = {
  nodejs: {
    stripe: `// Node.js Express — Stripe Skill Purchase & Webhook Validation
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

// Protect your Premium AI Skill Endpoint
app.post('/api/skills/execute', async (req, res) => {
  const { userId, skillId, params } = req.body;

  // 1. Verify payment status from your database
  const subscription = await db.getCurrentSubscription(userId);
  const payPerCallBalance = await db.getPayPerCallBalance(userId);

  if (!subscription?.isActive && payPerCallBalance <= 0) {
    return res.status(402).json({
      error: "Insufficient Funds",
      message: "Please upgrade your subscription or top up credits to use this premium AI skill."
    });
  }

  // 2. Perform the premium AI agent action (e.g. Gemini LLM execution)
  try {
    const result = await runAIModel(skillId, params);
    
    // Deduct usage credit if model is Pay-as-you-go
    if (subscription?.billingMode === 'Pay-as-you-go') {
      await db.deductCredits(userId, 0.05);
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Stripe webhook handler to instantly activate subscription or credits
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle successful payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const amount = session.amount_total / 100;

    // Provision subscriber or top up developer balance in DB
    await db.activatePremiumSkill(userId, amount);
  }

  res.json({ received: true });
});`,
    paypal: `// Node.js Express — PayPal Subscription Capture Endpoint
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Capture PayPal Order after frontend checkout is approved
app.post('/api/paypal/capture-order', async (req, res) => {
  const { orderId, userId, skillId } = req.body;
  
  try {
    // 1. Get PayPal OAuth token
    const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET).toString("base64");
    const tokenResponse = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      { headers: { Authorization: \`Basic \${auth}\`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    const accessToken = tokenResponse.data.access_token;

    // 2. Capture PayPal payment
    const captureResponse = await axios.post(
      \`https://api-m.sandbox.paypal.com/v2/checkout/orders/\${orderId}/capture\`,
      {},
      { headers: { Authorization: \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' } }
    );

    if (captureResponse.data.status === 'COMPLETED') {
      // 3. Grant the premium AI Skill access
      await db.grantUserSkillAccess(userId, skillId);
      return res.json({ status: 'success', details: captureResponse.data });
    }
    
    res.status(400).json({ status: 'payment_not_completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`
  },
  python: {
    stripe: `# Python Flask — Stripe Premium Skill Checkout & Webhooks
import os
import stripe
from flask import Flask, request, jsonify

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

app = Flask(__name__)

@app.route("/api/execute-premium-skill", methods=["POST"])
def execute_skill():
    data = request.json
    user_id = data.get("user_id")
    skill_id = data.get("skill_id")
    
    # 1. Query user plan in database
    user_plan = db.get_user_plan(user_id)
    if not user_plan or not user_plan.is_active:
        return jsonify({
            "error": "PaymentRequired", 
            "message": "Premium access required. Please subscribe or pay per request."
        }), 402

    # 2. Run your complex AI Pipeline
    try:
        response_text = run_ai_agent(skill_id, data.get("prompt"))
        return jsonify({"success": True, "result": response_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/stripe-webhook", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        amount_paid = session.get("amount_total") / 100
        
        # Provision skill subscription access
        db.upgrade_user_to_premium(user_id, amount_paid)
        
    return jsonify({"success": True})`,
    paypal: `# Python Flask — PayPal captured billing implementation
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com"

def get_paypal_token():
    client_id = os.getenv("PAYPAL_CLIENT_ID")
    client_secret = os.getenv("PAYPAL_SECRET")
    response = requests.post(
        f"{PAYPAL_API_BASE}/v1/oauth2/token",
        auth=(client_id, client_secret),
        data={"grant_type": "client_credentials"}
    )
    return response.json().get("access_token")

@app.route("/api/paypal/capture", methods=["POST"])
def capture_order():
    token = get_paypal_token()
    order_id = request.json.get("orderId")
    user_id = request.json.get("userId")
    skill_id = request.json.get("skillId")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Capture transaction payment
    resp = requests.post(f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}/capture", headers=headers, json={})
    result = resp.json()
    
    if result.get("status") == "COMPLETED":
        # Enable skill access
        db.enable_user_skill(user_id, skill_id)
        return jsonify({"success": True, "details": result})
        
    return jsonify({"error": "Payment failed"}), 400`
  }
};
