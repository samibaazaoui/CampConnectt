package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
public class EventAnalyticsController {

    @PersistenceContext
    private EntityManager em;

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEventAnalytics() {

        // ── 1. Per-event stats ──────────────────────────────────────────────
        List<?> rawStats = em.createNativeQuery("""
            SELECT e.id, e.title, e.location,
                   e.start_at, e.end_at,
                   COUNT(CASE WHEN ep.status='ATTENDED'   THEN 1 END) AS attended,
                   COUNT(CASE WHEN ep.status='REGISTERED' THEN 1 END) AS registered,
                   COUNT(CASE WHEN ep.status='CANCELLED'  THEN 1 END) AS cancelled,
                   COUNT(ep.id) AS total
            FROM events e
            LEFT JOIN event_participations ep ON ep.event_id = e.id
            GROUP BY e.id, e.title, e.location, e.start_at, e.end_at
            ORDER BY attended DESC, total DESC
        """).getResultList();

        // Total registered across all events (for attractivity ratio)
        Number totalRegisteredGlobal = (Number) em.createNativeQuery(
            "SELECT COUNT(*) FROM event_participations WHERE status='REGISTERED'"
        ).getSingleResult();
        double totalReg = totalRegisteredGlobal.doubleValue();
        if (totalReg == 0) totalReg = 1;

        List<Map<String, Object>> eventStats = new ArrayList<>();
        for (Object row : rawStats) {
            Object[] r = (Object[]) row;
            long attended   = ((Number) r[5]).longValue();
            long registered = ((Number) r[6]).longValue();
            long cancelled  = ((Number) r[7]).longValue();
            long total      = ((Number) r[8]).longValue();

            double presenceRate     = total > 0 ? (double) attended / total : 0;
            double attractivityRate = registered / totalReg;
            double fidelityRate     = total > 0 ? 1.0 - (double) cancelled / total : 1.0;
            double score = (presenceRate * 0.50 + attractivityRate * 0.30 + fidelityRate * 0.20) * 5;
            score = Math.round(score * 100.0) / 100.0;

            Map<String, Object> stat = new LinkedHashMap<>();
            stat.put("id",         ((Number) r[0]).longValue());
            stat.put("title",      r[1]);
            stat.put("location",   r[2]);
            stat.put("startAt",    r[3] != null ? r[3].toString() : null);
            stat.put("endAt",      r[4] != null ? r[4].toString() : null);
            stat.put("attended",   attended);
            stat.put("registered", registered);
            stat.put("cancelled",  cancelled);
            stat.put("total",      total);
            stat.put("score",      score);
            stat.put("cancellationRate", total > 0
                ? Math.round((double) cancelled / total * 10000.0) / 100.0 : 0.0);
            eventStats.add(stat);
        }

        // ── 2. Monthly peaks ────────────────────────────────────────────────
        List<?> rawMonthly = em.createNativeQuery("""
            SELECT YEAR(e.start_at) AS yr, MONTH(e.start_at) AS mo,
                   COUNT(ep.id) AS total_participations,
                   COUNT(CASE WHEN ep.status='ATTENDED' THEN 1 END) AS presents
            FROM events e
            JOIN event_participations ep ON ep.event_id = e.id
            GROUP BY YEAR(e.start_at), MONTH(e.start_at)
            ORDER BY yr, mo
        """).getResultList();

        List<Map<String, Object>> monthlyPeaks = new ArrayList<>();
        String[] monthNames = {"", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        for (Object row : rawMonthly) {
            Object[] r = (Object[]) row;
            int mo = ((Number) r[1]).intValue();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("year",         ((Number) r[0]).intValue());
            m.put("month",        mo);
            m.put("monthName",    monthNames[mo] + " " + ((Number) r[0]).intValue());
            m.put("total",        ((Number) r[2]).longValue());
            m.put("attended",     ((Number) r[3]).longValue());
            monthlyPeaks.add(m);
        }

        // ── 3. Activities per event ─────────────────────────────────────────
        List<?> rawActivities = em.createNativeQuery("""
            SELECT e.id, e.title,
                   COUNT(a.id) AS nb_activities,
                   GROUP_CONCAT(a.name ORDER BY a.name SEPARATOR ', ') AS activity_list
            FROM events e
            LEFT JOIN activities a ON a.event_id = e.id
            GROUP BY e.id, e.title
            ORDER BY nb_activities DESC
        """).getResultList();

        List<Map<String, Object>> activityStats = new ArrayList<>();
        for (Object row : rawActivities) {
            Object[] r = (Object[]) row;
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("eventId",      ((Number) r[0]).longValue());
            a.put("title",        r[1]);
            a.put("nbActivities", ((Number) r[2]).longValue());
            a.put("activities",   r[3]);
            activityStats.add(a);
        }

        // ── 4. Global stats ─────────────────────────────────────────────────
        Object[] g = (Object[]) em.createNativeQuery("""
            SELECT COUNT(*),
                   COUNT(CASE WHEN status='ATTENDED'   THEN 1 END),
                   COUNT(CASE WHEN status='REGISTERED' THEN 1 END),
                   COUNT(CASE WHEN status='CANCELLED'  THEN 1 END)
            FROM event_participations
        """).getSingleResult();

        long gTotal     = ((Number) g[0]).longValue();
        long gAttended  = ((Number) g[1]).longValue();
        long gRegistered= ((Number) g[2]).longValue();
        long gCancelled = ((Number) g[3]).longValue();

        Map<String, Object> globalStats = new LinkedHashMap<>();
        globalStats.put("totalParticipations", gTotal);
        globalStats.put("totalAttended",       gAttended);
        globalStats.put("totalRegistered",     gRegistered);
        globalStats.put("totalCancelled",      gCancelled);
        globalStats.put("cancellationRate",    gTotal > 0
            ? Math.round((double) gCancelled / gTotal * 10000.0) / 100.0 : 0.0);
        globalStats.put("attendanceRate",      gTotal > 0
            ? Math.round((double) gAttended  / gTotal * 10000.0) / 100.0 : 0.0);

        // ── 5. Top active users ─────────────────────────────────────────────
        List<?> rawTopUsers = em.createNativeQuery("""
            SELECT u.id, u.full_name, u.email,
                   COUNT(*) AS total,
                   COUNT(CASE WHEN ep.status='ATTENDED'   THEN 1 END) AS attended,
                   COUNT(CASE WHEN ep.status='CANCELLED'  THEN 1 END) AS cancelled
            FROM users u
            JOIN event_participations ep ON ep.user_id = u.id
            GROUP BY u.id, u.full_name, u.email
            ORDER BY attended DESC, total DESC
            LIMIT 10
        """).getResultList();

        List<Map<String, Object>> topUsers = new ArrayList<>();
        for (Object row : rawTopUsers) {
            Object[] r = (Object[]) row;
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("id",       ((Number) r[0]).longValue());
            u.put("fullName", r[1]);
            u.put("email",    r[2]);
            u.put("total",    ((Number) r[3]).longValue());
            u.put("attended", ((Number) r[4]).longValue());
            u.put("cancelled",((Number) r[5]).longValue());
            topUsers.add(u);
        }

        // ── 6. User retention ───────────────────────────────────────────────
        Object[] ret = (Object[]) em.createNativeQuery("""
            SELECT
              COUNT(CASE WHEN cnt >= 2 THEN 1 END) AS returning_users,
              COUNT(*) AS total_users
            FROM (
              SELECT user_id, COUNT(*) AS cnt
              FROM event_participations
              GROUP BY user_id
            ) t
        """).getSingleResult();

        long returningUsers = ((Number) ret[0]).longValue();
        long totalUsers     = ((Number) ret[1]).longValue();
        Map<String, Object> retention = new LinkedHashMap<>();
        retention.put("returningUsers",  returningUsers);
        retention.put("totalUsers",      totalUsers);
        retention.put("retentionRate",   totalUsers > 0
            ? Math.round((double) returningUsers / totalUsers * 10000.0) / 100.0 : 0.0);

        // ── 7. Registrations by day of week ─────────────────────────────────
        List<?> rawDow = em.createNativeQuery("""
            SELECT DAYOFWEEK(registered_at) AS dow,
                   DAYNAME(registered_at)   AS dname,
                   COUNT(*) AS total,
                   COUNT(CASE WHEN status='ATTENDED' THEN 1 END) AS attended
            FROM event_participations
            WHERE registered_at IS NOT NULL
            GROUP BY DAYOFWEEK(registered_at), DAYNAME(registered_at)
            ORDER BY dow
        """).getResultList();

        List<Map<String, Object>> byDayOfWeek = new ArrayList<>();
        for (Object row : rawDow) {
            Object[] r = (Object[]) row;
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("dow",      ((Number) r[0]).intValue());
            d.put("dayName",  r[1]);
            d.put("total",    ((Number) r[2]).longValue());
            d.put("attended", ((Number) r[3]).longValue());
            byDayOfWeek.add(d);
        }

        // ── 8. Registrations by hour of day ─────────────────────────────────
        List<?> rawHour = em.createNativeQuery("""
            SELECT HOUR(registered_at) AS hr, COUNT(*) AS total
            FROM event_participations
            WHERE registered_at IS NOT NULL
            GROUP BY HOUR(registered_at)
            ORDER BY hr
        """).getResultList();

        List<Map<String, Object>> byHour = new ArrayList<>();
        for (Object row : rawHour) {
            Object[] r = (Object[]) row;
            Map<String, Object> h = new LinkedHashMap<>();
            h.put("hour",  ((Number) r[0]).intValue());
            h.put("label", String.format("%02dh", ((Number) r[0]).intValue()));
            h.put("total", ((Number) r[1]).longValue());
            byHour.add(h);
        }

        // ── 9. Conversion funnel (global) ────────────────────────────────────
        Map<String, Object> funnel = new LinkedHashMap<>();
        funnel.put("totalRegistrations",  gTotal);
        funnel.put("stillRegistered",     gRegistered);
        funnel.put("attended",            gAttended);
        funnel.put("cancelled",           gCancelled);
        funnel.put("conversionRate",      gTotal > 0
            ? Math.round((double) gAttended / gTotal * 10000.0) / 100.0 : 0.0);
        funnel.put("dropoffRate",         gTotal > 0
            ? Math.round((double) gCancelled / gTotal * 10000.0) / 100.0 : 0.0);

        // ── 10. Event durations ──────────────────────────────────────────────
        List<?> rawDur = em.createNativeQuery("""
            SELECT e.title,
                   TIMESTAMPDIFF(HOUR, e.start_at, e.end_at) AS duration_h,
                   COUNT(CASE WHEN ep.status='ATTENDED' THEN 1 END) AS attended,
                   COUNT(ep.id) AS total
            FROM events e
            LEFT JOIN event_participations ep ON ep.event_id = e.id
            WHERE e.end_at > e.start_at
            GROUP BY e.id, e.title, duration_h
            ORDER BY duration_h DESC
        """).getResultList();

        List<Map<String, Object>> eventDurations = new ArrayList<>();
        for (Object row : rawDur) {
            Object[] r = (Object[]) row;
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("title",      r[0]);
            d.put("durationH",  ((Number) r[1]).longValue());
            d.put("attended",   ((Number) r[2]).longValue());
            d.put("total",      ((Number) r[3]).longValue());
            eventDurations.add(d);
        }

        // ── 11. Build response ───────────────────────────────────────────────
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("eventStats",     eventStats);
        data.put("monthlyPeaks",   monthlyPeaks);
        data.put("activityStats",  activityStats);
        data.put("globalStats",    globalStats);
        data.put("topUsers",       topUsers);
        data.put("retention",      retention);
        data.put("byDayOfWeek",    byDayOfWeek);
        data.put("byHour",         byHour);
        data.put("funnel",         funnel);
        data.put("eventDurations", eventDurations);

        return ResponseEntity.ok(ApiResponse.ok("Analytics loaded", data));
    }
}
