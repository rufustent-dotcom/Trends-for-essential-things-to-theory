package com.intrepid.ai.billing

import android.content.Context
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.android.billingclient.api.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.security.MessageDigest

class BillingManager(
    private val context: Context,
    private val scope: CoroutineScope,
    private val clientUsername: String,
    private val onVerificationFinished: (success: Boolean, message: String) -> Unit
) {

    private lateinit var billingClient: BillingClient
    private val apiService: BillingApiService by lazy { BillingApiService.create() }

    private val sharedPreferences by lazy {
        try {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                "secure_billing_cache",
                masterKeyAlias,
                context,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.e("BillingManager", "Failed to initialize EncryptedSharedPreferences: ${e.message}")
            null
        }
    }

    fun initialize() {
        billingClient = BillingClient.newBuilder(context)
            .setListener { billingResult, purchases ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
                    for (purchase in purchases) {
                        handleIncomingPurchase(purchase)
                    }
                } else {
                    Log.w("BillingManager", "Purchase listener updated with error: ${billingResult.debugMessage}")
                }
            }
            .enablePendingPurchases() // Mandatory safety guardrail for PBL
            .build()

        startConnectionLoop()
    }

    private fun startConnectionLoop() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    Log.i("BillingManager", "Play Billing Setup Success. Under-the-hood channel is active.")
                } else {
                    Log.e("BillingManager", "Billing Setup Failed: ${billingResult.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() {
                Log.w("BillingManager", "Billing client disconnected. Retrying connection actively.")
                // Adaptive recovery: Automatically attempt reconnection if system drops
                scope.launch(Dispatchers.IO) {
                    startConnectionLoop()
                }
            }
        })
    }

    private fun handleIncomingPurchase(purchase: Purchase) {
        // Prevent entitlement bypass: Ensure purchase is processed and token is safely verified by backend
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            for (product in purchase.products) {
                // Send the payload off to the backend verification engine
                verifyTokenOnBackend(product, purchase.purchaseToken)
            }
        }
    }

    private fun verifyTokenOnBackend(subscriptionId: String, purchaseToken: String) {
        scope.launch(Dispatchers.IO) {
            val tokenHash = hashString(purchaseToken)
            if (isTokenCached(tokenHash)) {
                Log.i("BillingManager", "Token verification bypassed: Valid cache hit for purchaseToken hash.")
                onVerificationFinished(true, "Successfully verified from offline secure cache.")
                return@launch
            }

            val requestBody = BillingVerificationRequest(
                username = clientUsername,
                subscription_id = subscriptionId,
                purchase_token = purchaseToken
            )

            apiService.verifyBillingToken(requestBody).enqueue(object : Callback<BillingVerificationResponse> {
                override fun onResponse(
                    call: Call<BillingVerificationResponse>,
                    response: Response<BillingVerificationResponse>
                ) {
                    if (response.isSuccessful && response.body()?.active == true) {
                        Log.i("BillingManager", "Premium assets unlocked via Play Billing verification!")
                        cacheVerifiedToken(tokenHash)
                        onVerificationFinished(true, response.body()?.message ?: "Success")
                    } else {
                        val errMsg = response.body()?.message ?: response.errorBody()?.string() ?: "Validation rejected"
                        Log.e("BillingManager", "Token verification rejected by backend validator: $errMsg")
                        onVerificationFinished(false, errMsg)
                    }
                }

                override fun onFailure(call: Call<BillingVerificationResponse>, t: Throwable) {
                    Log.e("BillingManager", "Failed to communicate with billing verification controller layer", t)
                    onVerificationFinished(false, t.message ?: "Network route failure")
                }
            })
        }
    }

    private fun isTokenCached(tokenHash: String): Boolean {
        val prefs = sharedPreferences ?: return false
        return try {
            prefs.getBoolean(tokenHash, false)
        } catch (e: Exception) {
            Log.e("BillingManager", "Error reading token hash from secure storage", e)
            false
        }
    }

    private fun cacheVerifiedToken(tokenHash: String) {
        val prefs = sharedPreferences ?: return
        try {
            prefs.edit().putBoolean(tokenHash, true).apply()
        } catch (e: Exception) {
            Log.e("BillingManager", "Failed to write token hash in secure storage cache", e)
        }
    }

    private fun hashString(input: String): String {
        return try {
            val digest = MessageDigest.getInstance("SHA-256")
            val hash = digest.digest(input.toByteArray(Charsets.UTF_8))
            hash.fold("") { str, it -> str + "%02x".format(it) }
        } catch (e: Exception) {
            Log.e("BillingManager", "SHA-256 hashing failed, fallback to raw purchase token", e)
            input
        }
    }
}
