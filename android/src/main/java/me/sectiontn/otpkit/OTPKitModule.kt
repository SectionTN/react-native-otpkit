package me.sectiontn.otpkit

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.os.BundleCompat
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.api.Status

class OTPKitModule(reactContext: ReactApplicationContext) :
  NativeOTPKitSpec(reactContext), ActivityEventListener, LifecycleEventListener {

  private enum class Mode { CONSENT, RETRIEVER }

  private class Session(val mode: Mode, val promise: Promise) {
    var receiver: BroadcastReceiver? = null
    var pendingConsent: Intent? = null
  }

  // Only touched on the main thread, where broadcasts and activity results arrive.
  private var session: Session? = null
  // The session that opened the consent sheet, so a stale sheet never answers a newer one.
  private var consentOwner: Session? = null
  private var resumed = false

  init {
    reactContext.addActivityEventListener(this)
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName() = NAME

  override fun isAvailable(): Boolean =
    GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(reactApplicationContext) ==
      ConnectionResult.SUCCESS

  override fun startConsent(sender: String?, promise: Promise) {
    start(Mode.CONSENT, sender, promise)
  }

  override fun startRetriever(promise: Promise) {
    start(Mode.RETRIEVER, null, promise)
  }

  override fun stop() {
    UiThreadUtil.runOnUiThread { cancel() }
  }

  override fun getAppHash(promise: Promise) {
    try {
      val context = reactApplicationContext
      val signature = signingCertificate(context) ?: error("No signing certificate")
      promise.resolve(appHash(context.packageName, signature.toCharsString()))
    } catch (e: Exception) {
      promise.reject(E_NATIVE, e.message, e)
    }
  }

  override fun invalidate() {
    UiThreadUtil.runOnUiThread { cancel() }
    reactApplicationContext.removeActivityEventListener(this)
    reactApplicationContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  private fun start(mode: Mode, sender: String?, promise: Promise) {
    UiThreadUtil.runOnUiThread { startOnMainThread(mode, sender, promise) }
  }

  private fun startOnMainThread(mode: Mode, sender: String?, promise: Promise) {
    cancel()
    if (!isAvailable()) {
      promise.reject(E_UNAVAILABLE, "Google Play services is not available")
      return
    }
    val next = Session(mode, promise)
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent) = onSmsBroadcast(next, intent)
    }
    ContextCompat.registerReceiver(
      reactApplicationContext,
      receiver,
      IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION),
      SmsRetriever.SEND_PERMISSION,
      null,
      ContextCompat.RECEIVER_EXPORTED,
    )
    next.receiver = receiver
    session = next
    val client = SmsRetriever.getClient(reactApplicationContext)
    val task = if (mode == Mode.CONSENT) client.startSmsUserConsent(sender) else client.startSmsRetriever()
    task.addOnFailureListener { error -> end(next)?.promise?.reject(E_UNAVAILABLE, error.message, error) }
  }

  private fun onSmsBroadcast(target: Session, intent: Intent) {
    if (session !== target || intent.action != SmsRetriever.SMS_RETRIEVED_ACTION) return
    val extras = intent.extras ?: return
    val status = BundleCompat.getParcelable(extras, SmsRetriever.EXTRA_STATUS, Status::class.java) ?: return
    val outcome = outcomeForStatus(status.statusCode)
    when {
      outcome != SmsOutcome.DELIVER ->
        end(target)?.promise?.reject(outcome.errorCode(), "SMS listening ended: ${outcome.name}")
      target.mode == Mode.RETRIEVER ->
        end(target)?.promise?.resolve(extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE).orEmpty())
      else -> {
        unregister(target)
        val consent = BundleCompat.getParcelable(extras, SmsRetriever.EXTRA_CONSENT_INTENT, Intent::class.java)
        if (consent == null) {
          end(target)?.promise?.reject(E_NATIVE, "The consent intent is missing")
        } else {
          target.pendingConsent = consent
          launchConsent(target)
        }
      }
    }
  }

  private fun launchConsent(target: Session) {
    val consent = target.pendingConsent ?: return
    val activity = reactApplicationContext.currentActivity
    if (activity == null || !resumed) return
    target.pendingConsent = null
    // Only start the intent when it resolves to Google Play services, never to another app.
    val component = consent.resolveActivity(activity.packageManager)
    if (component?.packageName != PLAY_SERVICES ||
      consent.flags and (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION) != 0
    ) {
      end(target)?.promise?.reject(E_NATIVE, "The consent intent does not come from Google Play services")
      return
    }
    try {
      consentOwner = target
      activity.startActivityForResult(consent, CONSENT_REQUEST)
    } catch (e: Exception) {
      end(target)?.promise?.reject(E_NATIVE, e.message, e)
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != CONSENT_REQUEST) return
    val target = consentOwner ?: return
    consentOwner = null
    if (outcomeForConsent(resultCode) == SmsOutcome.DELIVER) {
      end(target)?.promise?.resolve(data?.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE).orEmpty())
    } else {
      end(target)?.promise?.reject(E_DENIED, "The user did not allow reading the message")
    }
  }

  override fun onNewIntent(intent: Intent) = Unit

  override fun onHostResume() {
    resumed = true
    session?.let { launchConsent(it) }
  }

  override fun onHostPause() {
    resumed = false
  }

  override fun onHostDestroy() {
    resumed = false
  }

  private fun cancel() {
    session?.let { end(it)?.promise?.reject(E_CANCELLED, "Listening was cancelled") }
  }

  private fun end(target: Session): Session? {
    if (session !== target) return null
    session = null
    unregister(target)
    return target
  }

  private fun unregister(target: Session) {
    val receiver = target.receiver ?: return
    target.receiver = null
    runCatching { reactApplicationContext.unregisterReceiver(receiver) }
  }

  private fun signingCertificate(context: Context): Signature? {
    val manager = context.packageManager
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      @Suppress("DEPRECATION")
      manager.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
        .signingInfo?.apkContentsSigners?.firstOrNull()
    } else {
      @Suppress("DEPRECATION")
      manager.getPackageInfo(context.packageName, PackageManager.GET_SIGNATURES).signatures?.firstOrNull()
    }
  }

  companion object {
    const val NAME = "OTPKit"
    private const val CONSENT_REQUEST = 0x4f54
    private const val PLAY_SERVICES = "com.google.android.gms"
    private const val E_CANCELLED = "E_CANCELLED"
    private const val E_UNAVAILABLE = "E_UNAVAILABLE"
    private const val E_DENIED = "E_DENIED"
    private const val E_NATIVE = "E_NATIVE"
  }
}
