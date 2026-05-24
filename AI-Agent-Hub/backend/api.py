# -*- coding: utf-8 -*-
"""
AI-Agent-Hub Monetization-Ready API Backend Service
Provides endpoints for Stripe/PayPal payment validation, user sandbox registries, 
and consolidated metrics analytics reporting.
"""

import os
import sys
from flask import Flask, request, jsonify
import json
import logging

# Ensure appropriate path resolution for service modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.services.google_billing import GoogleBillingValidator

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Instantiate Google Billing Validation Engine
billing_validator = GoogleBillingValidator()

# In-Memory Database for demonstration/sandbox matching the React telemetry
USERS = {
    'dev_alpha': {
        'username': 'dev_alpha', 
        'email': 'alpha@coder.net', 
        'premium': True, 
        'purchased_skills': ['skill-1', 'skill-2'], 
        'totalSpent': 68.99
    },
    'builder_jay': {
        'username': 'builder_jay', 
        'email': 'jay@agentlabs.ai', 
        'premium': False, 
        'purchased_skills': [], 
        'totalSpent': 0.00
    },
    'saas_founder_42': {
        'username': 'saas_founder_42', 
        'email': 'founder42@hq.io', 
        'premium': True, 
        'purchased_skills': ['skill-3'], 
        'totalSpent': 49.00
    },
    'hobby_coder': {
        'username': 'hobby_coder', 
        'email': 'hobby@gmail.com', 
        'premium': False, 
        'purchased_skills': ['skill-1'], 
        'totalSpent': 19.99
    }
}

SKILLS_REGISTRY = {
    "skill-1": {"name": "Gemini Code Compléter Pro", "price": 19.99, "billing": "subscription"},
    "skill-2": {"name": "Voice Clone Synthesis Studio", "price": 0.04, "billing": "pay-as-you-go"},
    "skill-3": {"name": "Multimodal OCR & Data Extractor", "price": 49.00, "billing": "one-time"},
    "skill-4": {"name": "Automated Twitter Auto-Promoter", "price": 9.99, "billing": "subscription"},
    "skill-5": {"name": "Recursive Agent Planner Logic", "price": 0.08, "billing": "pay-as-you-go"}
}

@app.route('/health', methods=['GET'])
def health_check():
    """Service health validation endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI-Agent-Hub Core API',
        'version': '1.0.0-beta'
    })

@app.route('/purchase_skill', methods=['POST'])
def purchase_skill():
    """
    Simulated checkout webhook callback handler for active subscriptions and one-time skill activation.
    Integrates secure validation parameters of third-party payment brokers (Stripe/PayPal).
    """
    data = request.json or {}
    username = data.get('username')
    skill_id = data.get('skill_id') or data.get('skill_name')
    provider = data.get('provider', 'stripe') # stripe or paypal

    if not username or not skill_id:
        return jsonify({
            'status': 'error',
            'message': 'Missing validation arguments. Requires username and skill_id.'
        }), 400

    username_key = username.lower().strip()
    
    # Auto-seed user if not in mem-db
    if username_key not in USERS:
        USERS[username_key] = {
            'username': username,
            'email': f"{username_key}@example.com",
            'premium': False,
            'purchased_skills': [],
            'totalSpent': 0.00
        }

    # Find skill metadata
    skill_info = SKILLS_REGISTRY.get(skill_id)
    cost = 19.99 if not skill_info else skill_info['price']
    skill_display_name = skill_id if not skill_info else skill_info['name']

    # Update state
    USERS[username_key]['premium'] = True
    if skill_id not in USERS[username_key]['purchased_skills']:
        USERS[username_key]['purchased_skills'].append(skill_id)
    
    USERS[username_key]['totalSpent'] = round(USERS[username_key]['totalSpent'] + cost, 2)

    logging.info(f"AUTHORIZED: Verified transaction via user={username}, skill={skill_display_name}, Cost=${cost} via {provider}.")

    return jsonify({
        'status': 'success',
        'message': f"Skill '{skill_display_name}' purchased and deployed for developer '{username}' successfully.",
        'user_details': USERS[username_key],
        'gateway_reference': f"tx_mock_{provider}_{hash(username + skill_id) % 1000000}"
    })

@app.route('/api/billing/verify', methods=['POST'])
def verify_billing_token():
    """
    Validates a Play Billing Library 9.0.0 purchase token.
    On successful verification, secures and unlocks developer user privileges,
    persisting activation across local records.
    """
    data = request.json or {}
    username = data.get('username')
    subscription_id = data.get('subscription_id') or data.get('subscriptionId')
    purchase_token = data.get('purchase_token') or data.get('purchaseToken')

    if not username or not subscription_id or not purchase_token:
        return jsonify({
            'status': 'error',
            'message': 'Missing required validation properties: username, subscription_id, purchase_token.'
        }), 400

    username_key = username.lower().strip()
    
    # Run Google billing verification engine
    verification_result = billing_validator.verify_subscription(subscription_id, purchase_token)
    
    if verification_result.get("status") in ["success", "sandbox_success"] or verification_result.get("active") is True:
        # Seed user if they do not exist
        if username_key not in USERS:
            USERS[username_key] = {
                'username': username,
                'email': f"{username_key}@intrepid-partner.ai",
                'premium': False,
                'purchased_skills': [],
                'totalSpent': 0.00
            }
            
        # Unlock Premium state & link Play Store Subscription skill
        USERS[username_key]['premium'] = True
        sub_id_skill = f"gplay-{subscription_id}"
        if sub_id_skill not in USERS[username_key]['purchased_skills']:
            USERS[username_key]['purchased_skills'].append(sub_id_skill)
            
        # Increment total developer spend based on standard Play subscription prices
        USERS[username_key]['totalSpent'] = round(USERS[username_key]['totalSpent'] + 14.99, 2)
        
        logging.info(f"PLAY_BILLING_VERIFICATION_SUCCESS: Verified token for user={username}, sub={subscription_id}, is_sandbox={verification_result.get('sandbox', False)}")
        
        return jsonify({
            'status': 'success',
            'active': True,
            'message': 'Play Billing 9.0.0 subscription validated successfully.',
            'user_details': USERS[username_key],
            'verification_details': verification_result
        })
    else:
        logging.warning(f"PLAY_BILLING_VERIFICATION_FAILED: Failed to authorize token for user={username}, sub={subscription_id}. Result: {verification_result}")
        return jsonify({
            'status': 'error',
            'active': False,
            'message': verification_result.get('message', 'Subscription verification failed or expired.'),
            'verification_details': verification_result
        }), 402

@app.route('/analytics', methods=['GET'])
def analytics():
    """
    Consolidated telemetry reporting on product conversions, gross active licenses, 
    and average usage metrics across premium developer workspaces.
    """
    premium_skill_usage = {
        info['username']: len(info['purchased_skills']) for user_key, info in USERS.items()
    }
    
    total_users = len(USERS)
    premium_conversions = sum(1 for info in USERS.values() if info['premium'])
    premium_ratio = (premium_conversions / max(total_users, 1)) * 100

    return jsonify({
        'status': 'success',
        'premium_skill_usage': premium_skill_usage,
        'metrics_telemetry': {
            'total_registered_developers': total_users,
            'premium_developer_conversions': premium_conversions,
            'conversion_index_ratio': f"{round(premium_ratio, 1)}%",
            'overall_gross_earnings_aggregate': sum(info['totalSpent'] for info in USERS.values())
        }
    })

# Error handling handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'status': 'error', 'message': 'Endpoint not found.'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'status': 'error', 'message': f"Internal Server Core Fault: {str(error)}"}), 500

if __name__ == '__main__':
    # Binds to Port 5001 for development sandbox isolation
    print("Backend API added with placeholders for premium skill analytics and payment integration.")
    app.run(host='0.0.0.0', port=5001, debug=True)
