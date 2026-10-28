package me.sectiontn.otpkit

import android.app.Activity
import com.google.android.gms.common.api.CommonStatusCodes
import org.junit.Assert.assertEquals
import org.junit.Test

class SmsOutcomeTest {
  @Test
  fun mapsStatusCodes() {
    assertEquals(SmsOutcome.DELIVER, outcomeForStatus(CommonStatusCodes.SUCCESS))
    assertEquals(SmsOutcome.TIMEOUT, outcomeForStatus(CommonStatusCodes.TIMEOUT))
    assertEquals(SmsOutcome.FAIL, outcomeForStatus(CommonStatusCodes.API_NOT_CONNECTED))
  }

  @Test
  fun mapsConsentResults() {
    assertEquals(SmsOutcome.DELIVER, outcomeForConsent(Activity.RESULT_OK))
    assertEquals(SmsOutcome.DENIED, outcomeForConsent(Activity.RESULT_CANCELED))
  }

  @Test
  fun namesErrorCodes() {
    assertEquals("E_TIMEOUT", SmsOutcome.TIMEOUT.errorCode())
    assertEquals("E_DENIED", SmsOutcome.DENIED.errorCode())
    assertEquals("E_NATIVE", SmsOutcome.FAIL.errorCode())
  }
}
