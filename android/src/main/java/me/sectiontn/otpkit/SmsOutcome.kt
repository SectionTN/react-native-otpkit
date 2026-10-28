package me.sectiontn.otpkit

import android.app.Activity
import com.google.android.gms.common.api.CommonStatusCodes

internal enum class SmsOutcome { DELIVER, TIMEOUT, DENIED, FAIL }

internal fun outcomeForStatus(statusCode: Int): SmsOutcome =
  when (statusCode) {
    CommonStatusCodes.SUCCESS -> SmsOutcome.DELIVER
    CommonStatusCodes.TIMEOUT -> SmsOutcome.TIMEOUT
    else -> SmsOutcome.FAIL
  }

internal fun outcomeForConsent(resultCode: Int): SmsOutcome =
  if (resultCode == Activity.RESULT_OK) SmsOutcome.DELIVER else SmsOutcome.DENIED

internal fun SmsOutcome.errorCode(): String =
  when (this) {
    SmsOutcome.TIMEOUT -> "E_TIMEOUT"
    SmsOutcome.DENIED -> "E_DENIED"
    SmsOutcome.DELIVER, SmsOutcome.FAIL -> "E_NATIVE"
  }
