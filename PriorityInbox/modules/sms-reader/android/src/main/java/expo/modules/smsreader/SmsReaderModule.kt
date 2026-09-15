package expo.modules.smsreader

import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SmsReaderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SmsReader")

    Function("getInboxSms") { limit: Int ->
      val ctx = appContext.reactContext
        ?: return@Function emptyList<Map<String, String>>()
      val out = mutableListOf<Map<String, String>>()
      val cursor = ctx.contentResolver.query(
        Uri.parse("content://sms/inbox"),
        arrayOf("_id", "address", "body", "date"),
        null,
        null,
        "date DESC"
      ) ?: return@Function emptyList<Map<String, String>>()
      cursor.use { c ->
        var n = 0
        while (c.moveToNext() && n < limit) {
          out.add(
            mapOf(
              "from" to (c.getString(1) ?: "Unknown"),
              "body" to (c.getString(2) ?: ""),
              "timestamp" to (c.getLong(3).toString())
            )
          )
          n++
        }
      }
      out
    }
  }
}
