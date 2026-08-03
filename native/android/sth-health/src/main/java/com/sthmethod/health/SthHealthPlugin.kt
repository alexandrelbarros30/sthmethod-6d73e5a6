package com.sthmethod.health

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.aggregate.AggregateMetric
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Mass
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.Period

/**
 * Ponte nativa do STH METHOD com o Health Connect para os tipos que o plugin
 * `capacitor-health` nao expoe: sono, peso, frequencia cardiaca de repouso e
 * calorias totais. Passos e calorias ativas tambem sao lidos aqui para que uma
 * unica chamada resolva o dia inteiro.
 */
@CapacitorPlugin(name = "SthHealth")
class SthHealthPlugin : Plugin() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
    )

    private val labels = mapOf(
        HealthPermission.getReadPermission(StepsRecord::class) to "steps",
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class) to "active_kcal",
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class) to "total_kcal",
        HealthPermission.getReadPermission(SleepSessionRecord::class) to "sleep",
        HealthPermission.getReadPermission(WeightRecord::class) to "weight",
        HealthPermission.getReadPermission(RestingHeartRateRecord::class) to "resting_hr",
        HealthPermission.getReadPermission(HeartRateRecord::class) to "heart_rate",
    )

    private fun client(): HealthConnectClient? = try {
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else {
            null
        }
    } catch (e: Exception) {
        null
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        call.resolve(JSObject().put("available", client() != null))
    }

    @PluginMethod
    fun checkHealthPermissions(call: PluginCall) {
        val c = client()
        if (c == null) {
            call.resolve(JSObject().put("available", false).put("missing", JSArray()))
            return
        }
        scope.launch {
            val granted = try {
                withContext(Dispatchers.IO) { c.permissionController.getGrantedPermissions() }
            } catch (e: Exception) {
                emptySet<String>()
            }
            val missing = JSArray()
            permissions.filterNot { granted.contains(it) }.forEach { missing.put(labels[it] ?: it) }
            call.resolve(JSObject().put("available", true).put("missing", missing))
        }
    }

    @PluginMethod
    fun requestHealthPermissions(call: PluginCall) {
        val c = client()
        if (c == null) {
            call.resolve(JSObject().put("granted", false))
            return
        }
        scope.launch {
            val granted = try {
                withContext(Dispatchers.IO) { c.permissionController.getGrantedPermissions() }
            } catch (e: Exception) {
                emptySet<String>()
            }
            if (granted.containsAll(permissions)) {
                call.resolve(JSObject().put("granted", true))
                return@launch
            }
            try {
                val intent = PermissionController
                    .createRequestPermissionResultContract()
                    .createIntent(activity, permissions)
                startActivityForResult(call, intent, "permissionsResult")
            } catch (e: Exception) {
                call.resolve(JSObject().put("granted", granted.isNotEmpty()))
            }
        }
    }

    @ActivityCallback
    fun permissionsResult(call: PluginCall?, result: ActivityResult?) {
        if (call == null) return
        val c = client()
        if (c == null) {
            call.resolve(JSObject().put("granted", false))
            return
        }
        scope.launch {
            val granted = try {
                withContext(Dispatchers.IO) { c.permissionController.getGrantedPermissions() }
            } catch (e: Exception) {
                emptySet<String>()
            }
            call.resolve(JSObject().put("granted", granted.any { permissions.contains(it) }))
        }
    }

    @PluginMethod
    fun openSettings(call: PluginCall) {
        try {
            val intent = android.content.Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (e: Exception) {
            // noop
        }
        call.resolve()
    }

    @PluginMethod
    fun readDays(call: PluginCall) {
        val days = call.getInt("days") ?: 30
        val c = client()
        if (c == null) {
            call.reject("unavailable")
            return
        }
        val end = LocalDateTime.now()
        val start = LocalDate.now().minusDays(days.toLong()).atStartOfDay()

        scope.launch {
            try {
                val rows = HashMap<String, JSObject>()
                fun row(day: String): JSObject = rows.getOrPut(day) { JSObject().put("day", day) }

                suspend fun collect(metric: AggregateMetric<*>, field: String, transform: (Double) -> Any) {
                    val values = aggregate(c, metric, start, end)
                    values.forEach { (day, value) -> row(day).put(field, transform(value)) }
                }

                collect(StepsRecord.COUNT_TOTAL, "steps") { Math.round(it).toInt() }
                collect(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL, "active_kcal") { Math.round(it).toInt() }
                collect(SleepSessionRecord.SLEEP_DURATION_TOTAL, "sleep_minutes") { Math.round(it).toInt() }
                collect(WeightRecord.WEIGHT_AVG, "weight_kg") { Math.round(it * 10.0) / 10.0 }
                collect(RestingHeartRateRecord.BPM_AVG, "resting_hr") { Math.round(it).toInt() }

                // Reservas: relogios que so publicam calorias totais ou FC continua.
                val totals = aggregate(c, TotalCaloriesBurnedRecord.ENERGY_TOTAL, start, end)
                totals.forEach { (day, value) ->
                    val r = row(day)
                    if (!r.has("active_kcal")) r.put("active_kcal", Math.round(value).toInt())
                }
                val minHr = aggregate(c, HeartRateRecord.BPM_MIN, start, end)
                minHr.forEach { (day, value) ->
                    val r = row(day)
                    if (!r.has("resting_hr")) r.put("resting_hr", Math.round(value).toInt())
                }

                val out = JSArray()
                rows.keys.sorted().forEach { out.put(rows[it]) }
                call.resolve(JSObject().put("days", out))
            } catch (e: Exception) {
                call.reject(e.message ?: "read-failed")
            }
        }
    }

    /** Agrega uma metrica por dia local; devolve mapa YYYY-MM-DD -> valor. */
    private suspend fun aggregate(
        c: HealthConnectClient,
        metric: AggregateMetric<*>,
        start: LocalDateTime,
        end: LocalDateTime,
    ): Map<String, Double> = withContext(Dispatchers.IO) {
        val result = HashMap<String, Double>()
        try {
            val buckets = c.aggregateGroupByPeriod(
                AggregateGroupByPeriodRequest(
                    metrics = setOf(metric),
                    timeRangeFilter = TimeRangeFilter.between(start, end),
                    timeRangeSlicer = Period.ofDays(1),
                )
            )
            for (bucket in buckets) {
                val value = when (val raw = bucket.result[metric]) {
                    null -> null
                    is Long -> raw.toDouble()
                    is Int -> raw.toDouble()
                    is Double -> raw
                    is Energy -> raw.inKilocalories
                    is Mass -> raw.inKilograms
                    is Duration -> raw.toMinutes().toDouble()
                    else -> null
                }
                if (value != null && value > 0.0) {
                    result[bucket.startTime.toLocalDate().toString()] = value
                }
            }
        } catch (e: Exception) {
            // Permissao ausente para esse tipo: segue sem o dado.
        }
        result
    }
}