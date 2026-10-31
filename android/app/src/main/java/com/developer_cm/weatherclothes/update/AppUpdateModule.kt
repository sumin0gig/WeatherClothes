package com.developer_cm.weatherclothes.update

import android.app.Activity
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability

/**
 * 최신 버전 확인 — Google Play 인앱 업데이트 API.
 *
 * 우리 서버 없이 Play 스토어가 "이 기기에 더 새 버전이 있는지" 알려 준다 (확정 사항: 서버 없음).
 * Play에서 설치하지 않은 앱(디버그 빌드, 직접 설치한 APK)은 확인이 실패하는데,
 * 그때는 reject 대신 supported=false로 돌려줘서 앱이 조용히 넘어가게 한다.
 */
class AppUpdateModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  private val manager by lazy { AppUpdateManagerFactory.create(ctx) }

  override fun getName() = NAME

  @ReactMethod
  fun getCurrentVersion(promise: Promise) {
    promise.resolve(currentVersion())
  }

  @ReactMethod
  fun checkForUpdate(promise: Promise) {
    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        val map = currentVersion()
        val availability = info.updateAvailability()
        map.putBoolean("supported", true)
        map.putBoolean(
          "available",
          availability == UpdateAvailability.UPDATE_AVAILABLE,
        )
        // 업데이트 도중 앱이 꺼졌다가 다시 열린 경우 → 이어서 진행해야 한다
        map.putBoolean(
          "inProgress",
          availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS,
        )
        map.putInt("availableVersionCode", info.availableVersionCode())
        val staleness = info.clientVersionStalenessDays()
        if (staleness != null) map.putInt("stalenessDays", staleness)
        else map.putNull("stalenessDays")
        map.putInt("priority", info.updatePriority())
        map.putBoolean("immediateAllowed", immediateAllowed(info))
        promise.resolve(map)
      }
      .addOnFailureListener { e ->
        val map = currentVersion()
        map.putBoolean("supported", false)
        map.putString("error", e.message ?: e.javaClass.simpleName)
        promise.resolve(map)
      }
  }

  /**
   * Play의 전체 화면 업데이트를 띄운다. 끝나면 Play가 앱을 다시 시작한다.
   * 결과: "ok" | "canceled" | "failed" | "unavailable"
   */
  @ReactMethod
  fun startImmediateUpdate(promise: Promise) {
    val activity: Activity? = ctx.currentActivity
    if (activity == null) {
      promise.resolve("unavailable")
      return
    }
    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        val availability = info.updateAvailability()
        val canStart =
          (availability == UpdateAvailability.UPDATE_AVAILABLE ||
            availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) &&
            immediateAllowed(info)
        if (!canStart) {
          promise.resolve("unavailable")
          return@addOnSuccessListener
        }
        manager
          .startUpdateFlow(info, activity, AppUpdateOptions.defaultOptions(AppUpdateType.IMMEDIATE))
          .addOnSuccessListener { code ->
            promise.resolve(
              when (code) {
                Activity.RESULT_OK -> "ok"
                Activity.RESULT_CANCELED -> "canceled"
                else -> "failed"
              },
            )
          }
          .addOnFailureListener { promise.resolve("failed") }
      }
      .addOnFailureListener { promise.resolve("unavailable") }
  }

  private fun immediateAllowed(info: AppUpdateInfo) =
    info.isUpdateTypeAllowed(AppUpdateOptions.defaultOptions(AppUpdateType.IMMEDIATE))

  @Suppress("DEPRECATION")
  private fun currentVersion(): WritableMap {
    val map = Arguments.createMap()
    try {
      val pkg = ctx.packageManager.getPackageInfo(ctx.packageName, 0)
      map.putString("currentVersionName", pkg.versionName ?: "")
      val code =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) pkg.longVersionCode.toInt()
        else pkg.versionCode
      map.putInt("currentVersionCode", code)
    } catch (_: Exception) {
      map.putString("currentVersionName", "")
      map.putInt("currentVersionCode", 0)
    }
    return map
  }

  companion object {
    const val NAME = "AppUpdate"
  }
}
