package com.intrepid.ai.billing

import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

// Data classes for request and response payload matching Flask schema
data class BillingVerificationRequest(
    val username: String,
    val subscription_id: String,
    val purchase_token: String
)

data class UserDetails(
    val username: String,
    val email: String,
    val premium: Boolean,
    val purchased_skills: List<String>,
    val totalSpent: Double
)

data class VerificationMetadata(
    val status: String,
    val active: Boolean,
    val expiry_date: String?,
    val acknowledgement_state: Int?,
    val sandbox: Boolean?
)

data class BillingVerificationResponse(
    val status: String,
    val active: Boolean,
    val message: String,
    val user_details: UserDetails?,
    val verification_details: VerificationMetadata?
)

/**
 * Interface detailing retrofit end points for the Intrepid.ai billing transaction controller.
 */
interface BillingApiService {
    
    @POST("api/billing/verify")
    fun verifyBillingToken(
        @Body request: BillingVerificationRequest
    ): Call<BillingVerificationResponse>

    companion object {
        // Target host matching the development container or proxy gateway
        private const val BASE_URL = "https://ais-dev-owi4w7q2n56cc3s5yd7mn3-498372438.us-east1.run.app/"

        fun create(): BillingApiService {
            val retrofit = Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            return retrofit.create(BillingApiService::class.java)
        }
    }
}
