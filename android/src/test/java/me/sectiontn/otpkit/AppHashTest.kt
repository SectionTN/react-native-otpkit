package me.sectiontn.otpkit

import org.junit.Assert.assertEquals
import org.junit.Test

class AppHashTest {
  // Expected: printf '%s' "<package> <hex>" | shasum -a 256 | cut -c1-18 | xxd -r -p | base64 | cut -c1-11
  @Test
  fun matchesTheKeytoolPipeline() {
    assertEquals(
      "wF+rOCcuJHJ",
      appHash("me.sectiontn.otpkit.example", "308201dd30820146020101300d06092a864886f70d010105050030"),
    )
    assertEquals("dMyAr4cpDW3", appHash("com.example.app", "00ff"))
  }
}
