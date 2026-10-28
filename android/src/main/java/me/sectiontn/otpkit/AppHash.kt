package me.sectiontn.otpkit

import java.security.MessageDigest

private const val HASH_BYTES = 9
private const val HASH_LENGTH = 11
private const val BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

// Google's AppSignatureHelper. A local Base64, since java.util.Base64 needs API 26.
internal fun appHash(packageName: String, signatureHex: String): String {
  val digest = MessageDigest.getInstance("SHA-256")
    .digest("$packageName $signatureHex".toByteArray(Charsets.UTF_8))
  return base64(digest.copyOf(HASH_BYTES)).take(HASH_LENGTH)
}

// Nine bytes are a multiple of three, so there is no padding.
private fun base64(bytes: ByteArray): String = buildString {
  for (i in bytes.indices step 3) {
    val n = (bytes[i].toInt() and 0xff shl 16) or
      (bytes[i + 1].toInt() and 0xff shl 8) or
      (bytes[i + 2].toInt() and 0xff)
    append(BASE64[n shr 18 and 63])
    append(BASE64[n shr 12 and 63])
    append(BASE64[n shr 6 and 63])
    append(BASE64[n and 63])
  }
}
