package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateEventParticipationRequest;
import com.camp.backend.dto.EventParticipationResponse;
import com.camp.backend.dto.QrEventInfoResponse;
import com.camp.backend.entity.EventParticipationStatus;
import com.camp.backend.service.EventParticipationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/event-participations")
public class EventParticipationController {

    private final EventParticipationService participationService;

    public EventParticipationController(EventParticipationService participationService) {
        this.participationService = participationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventParticipationResponse>> participate(@Valid @RequestBody CreateEventParticipationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Event participation registered", participationService.participate(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventParticipationResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Event participations fetched", participationService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventParticipationResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Event participation fetched", participationService.findById(id)));
    }
    
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<EventParticipationResponse>>> findByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok("Event participations fetched", participationService.findByEventId(eventId)));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<EventParticipationResponse>>> findByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("User event participations fetched", participationService.findByUserId(userId)));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EventParticipationResponse>> updateStatus(@PathVariable Long id, @RequestParam EventParticipationStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated", participationService.updateStatus(id, status)));
    }

    @GetMapping("/qr/{token}")
    public ResponseEntity<ApiResponse<QrEventInfoResponse>> getByQrToken(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.ok("Event info fetched via QR", participationService.getByQrToken(token)));
    }

    @GetMapping("/qr-image/{token}")
    public ResponseEntity<byte[]> getQrImage(@PathVariable String token) {
        byte[] png = participationService.generateQrImage(token);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .body(png);
    }

    @GetMapping(value = "/ticket/{token}", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> getTicketPage(@PathVariable String token) {
        QrEventInfoResponse info = participationService.getByQrToken(token);

        java.time.format.DateTimeFormatter fmt =
                java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");
        String start = info.eventStartAt() != null ? info.eventStartAt().format(fmt) : "TBD";
        String end = info.eventEndAt() != null ? info.eventEndAt().format(fmt) : "TBD";
        String regDate = info.registeredAt() != null ? info.registeredAt().format(fmt) : "N/A";

        StringBuilder acts = new StringBuilder();
        if (info.activities() != null && !info.activities().isEmpty()) {
            acts.append("<div class=\"divider\"></div>");
            acts.append("<div class=\"section-label\">Activities</div>");
            acts.append("<div class=\"activities-list\">");
            for (QrEventInfoResponse.ActivityInfo a : info.activities()) {
                acts.append("<div class=\"act-item\"><span class=\"act-dot\"></span><div>")
                    .append("<span class=\"act-name\">").append(esc(a.name())).append("</span>");
                if (a.description() != null && !a.description().isBlank()) {
                    acts.append("<span class=\"act-desc\">").append(esc(a.description())).append("</span>");
                }
                acts.append("</div></div>");
            }
            acts.append("</div>");
        }

        String html = "<!DOCTYPE html><html lang=\"en\"><head>"
            + "<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<title>Ticket – " + esc(info.eventTitle()) + "</title>"
            + "<style>"
            + "*{box-sizing:border-box;margin:0;padding:0}"
            + "body{background:linear-gradient(135deg,#1b4332 0%,#2d6a4f 50%,#081c15 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',Arial,sans-serif;padding:20px}"
            + ".ticket{width:440px;max-width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 25px 70px rgba(0,0,0,.55)}"
            + ".header{background:linear-gradient(140deg,#1b4332 0%,#40916c 100%);color:#fff;padding:28px 28px 0}"
            + ".brand{display:flex;align-items:center;gap:8px;margin-bottom:16px}"
            + ".brand-icon{font-size:26px}"
            + ".brand-name{font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;opacity:.8}"
            + ".event-title{font-size:26px;font-weight:800;line-height:1.25;margin-bottom:20px}"
            + ".header-details{background:rgba(0,0,0,.18);margin:0 -28px;padding:14px 28px;display:flex;flex-direction:column;gap:9px}"
            + ".detail-row{display:flex;align-items:center;gap:8px;font-size:13px}"
            + ".detail-icon{font-size:15px;min-width:20px;text-align:center}"
            + ".serrated{height:30px;background:#fff;position:relative;overflow:hidden}"
            + ".serrated::before,.serrated::after{content:'';position:absolute;width:34px;height:34px;background:linear-gradient(140deg,#1b4332,#40916c);border-radius:50%;top:-2px}"
            + ".serrated::before{left:-17px}.serrated::after{right:-17px}"
            + ".dashed{position:absolute;top:50%;left:30px;right:30px;border-top:2px dashed #d4edda;transform:translateY(-50%)}"
            + ".body{padding:22px 28px}"
            + ".section-label{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#40916c;margin-bottom:8px}"
            + ".participant-name{font-size:22px;font-weight:700;color:#1b4332;margin-bottom:3px}"
            + ".participant-email{font-size:13px;color:#666;margin-bottom:12px}"
            + ".badge{display:inline-flex;align-items:center;gap:5px;background:#d8f3dc;color:#1b4332;font-size:11px;font-weight:700;padding:5px 14px;border-radius:30px;letter-spacing:1px;text-transform:uppercase;border:1px solid #b7e4c7}"
            + ".divider{height:1px;background:#f0f0f0;margin:18px 0}"
            + ".activities-list{display:flex;flex-direction:column;gap:8px}"
            + ".act-item{display:flex;align-items:flex-start;gap:10px;background:#f8fdf9;padding:10px 14px;border-radius:8px;border-left:3px solid #52b788}"
            + ".act-dot{width:7px;height:7px;background:#52b788;border-radius:50%;margin-top:5px;flex-shrink:0}"
            + ".act-name{font-size:13px;color:#1b4332;font-weight:600;display:block}"
            + ".act-desc{font-size:12px;color:#777;margin-top:2px;display:block}"
            + ".footer{background:#f6fbf7;padding:16px 28px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e8f5e9}"
            + ".reg-info{font-size:11px;color:#888;line-height:1.6}"
            + ".reg-info strong{display:block;font-size:12px;color:#444}"
            + ".official{background:#1b4332;color:#fff;font-size:10px;font-weight:700;padding:7px 13px;border-radius:8px;letter-spacing:1.5px;text-transform:uppercase}"
            + "</style></head><body>"
            + "<div class=\"ticket\">"
            +   "<div class=\"header\">"
            +     "<div class=\"brand\"><span class=\"brand-icon\">🏕️</span><span class=\"brand-name\">Camp Events</span></div>"
            +     "<div class=\"event-title\">" + esc(info.eventTitle()) + "</div>"
            +     "<div class=\"header-details\">"
            +       "<div class=\"detail-row\"><span class=\"detail-icon\">📍</span><span>" + esc(info.eventLocation()) + "</span></div>"
            +       "<div class=\"detail-row\"><span class=\"detail-icon\">🗓️</span><span>From " + start + "</span></div>"
            +       "<div class=\"detail-row\"><span class=\"detail-icon\">⏰</span><span>Until " + end + "</span></div>"
            +     "</div>"
            +   "</div>"
            +   "<div class=\"serrated\"><div class=\"dashed\"></div></div>"
            +   "<div class=\"body\">"
            +     "<div class=\"section-label\">Participant</div>"
            +     "<div class=\"participant-name\">" + esc(info.participantName()) + "</div>"
            +     "<div class=\"participant-email\">" + esc(info.participantEmail()) + "</div>"
            +     "<span class=\"badge\">✓&nbsp;&nbsp;" + esc(info.participationStatus()) + "</span>"
            +     acts
            +   "</div>"
            +   "<div class=\"footer\">"
            +     "<div class=\"reg-info\">Registered on<strong>" + regDate + "</strong></div>"
            +     "<div class=\"official\">✓&nbsp;Official Ticket</div>"
            +   "</div>"
            + "</div>"
            + "</body></html>";

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.TEXT_HTML)
                .body(html);
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        participationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Event participation deleted", null));
    }
}
