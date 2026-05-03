import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventAnalyticsService } from '../../services/event-analytics';

@Component({
  selector: 'app-event-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fa-solid fa-chart-mixed"></i> Event Analytics</h1>
          <p class="page-sub">Real-time insights · {{ today }}</p>
        </div>
        <button class="btn-refresh" (click)="load()" [disabled]="loading()">
          <i class="fa-solid fa-arrows-rotate" [class.fa-spin]="loading()"></i> Refresh
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <i class="fa-solid fa-circle-notch fa-spin fa-2x"></i>
        <p>Loading analytics…</p>
      </div>

      <ng-container *ngIf="!loading() && data()">

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-blue">
            <div class="kpi-icon"><i class="fa-solid fa-users"></i></div>
            <div class="kpi-value">{{ data().globalStats.totalParticipations }}</div>
            <div class="kpi-label">Total Participations</div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon"><i class="fa-solid fa-circle-check"></i></div>
            <div class="kpi-value">{{ data().globalStats.totalAttended }}</div>
            <div class="kpi-label">Attended</div>
            <div class="kpi-rate">{{ data().globalStats.attendanceRate }}%</div>
          </div>
          <div class="kpi-card kpi-amber">
            <div class="kpi-icon"><i class="fa-solid fa-clock"></i></div>
            <div class="kpi-value">{{ data().globalStats.totalRegistered }}</div>
            <div class="kpi-label">Registered</div>
          </div>
          <div class="kpi-card kpi-red">
            <div class="kpi-icon"><i class="fa-solid fa-circle-xmark"></i></div>
            <div class="kpi-value">{{ data().globalStats.totalCancelled }}</div>
            <div class="kpi-label">Cancelled</div>
            <div class="kpi-rate">{{ data().globalStats.cancellationRate }}%</div>
          </div>
        </div>

        <div class="dashboard-grid">

          <!-- Left column -->
          <div class="col-main">

            <!-- Event Score Table -->
            <div class="card-block">
              <div class="block-header">
                <h2><i class="fa-solid fa-trophy"></i> Event Popularity Scores</h2>
                <span class="badge-info">Formula: presence×0.5 + attractivity×0.3 + fidelity×0.2 × 5</span>
              </div>
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Event</th>
                      <th>Score /5</th>
                      <th>Attended</th>
                      <th>Registered</th>
                      <th>Cancelled</th>
                      <th>Total</th>
                      <th>Cancel Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let ev of sortedEvents(); let i = index"
                        [class.row-alert]="ev.score < 2.0"
                        [class.row-top]="i === 0">
                      <td class="rank">
                        <span *ngIf="i === 0" class="medal gold"><i class="fa-solid fa-medal"></i></span>
                        <span *ngIf="i === 1" class="medal silver"><i class="fa-solid fa-medal"></i></span>
                        <span *ngIf="i === 2" class="medal bronze"><i class="fa-solid fa-medal"></i></span>
                        <span *ngIf="i > 2">{{ i + 1 }}</span>
                      </td>
                      <td>
                        <div class="ev-name">{{ ev.title }}</div>
                        <div class="ev-loc"><i class="fa-solid fa-map-pin"></i> {{ ev.location }}</div>
                      </td>
                      <td>
                        <div class="score-bar-wrap">
                          <div class="score-bar" [style.width.%]="ev.score / 5 * 100"
                               [class.score-low]="ev.score < 2"
                               [class.score-mid]="ev.score >= 2 && ev.score < 3.5"
                               [class.score-high]="ev.score >= 3.5"></div>
                          <span class="score-val" [class.text-red]="ev.score < 2">{{ ev.score }}</span>
                        </div>
                      </td>
                      <td class="num attended">{{ ev.attended }}</td>
                      <td class="num">{{ ev.registered }}</td>
                      <td class="num cancelled">{{ ev.cancelled }}</td>
                      <td class="num">{{ ev.total }}</td>
                      <td>
                        <span class="pill" [class.pill-red]="ev.cancellationRate > 30"
                              [class.pill-green]="ev.cancellationRate <= 10"
                              [class.pill-amber]="ev.cancellationRate > 10 && ev.cancellationRate <= 30">
                          {{ ev.cancellationRate }}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Monthly Peaks -->
            <div class="card-block">
              <div class="block-header">
                <h2><i class="fa-solid fa-chart-bar"></i> Monthly Attendance Peaks</h2>
              </div>
              <div class="bar-chart">
                <div *ngFor="let m of data().monthlyPeaks" class="bar-col">
                  <div class="bar-track">
                    <div class="bar-fill" [style.height.%]="barHeight(m.attended)"
                         [class.bar-peak]="isPeak(m.attended)">
                      <span class="bar-tooltip">{{ m.attended }} attended<br>{{ m.total }} total</span>
                    </div>
                  </div>
                  <div class="bar-label">{{ m.monthName }}</div>
                  <div class="bar-val">{{ m.attended }}</div>
                </div>
                <div *ngIf="data().monthlyPeaks.length === 0" class="empty-chart">
                  No monthly data available
                </div>
              </div>
            </div>

          </div>

          <!-- Right column -->
          <div class="col-side">

            <!-- Top 5 -->
            <div class="card-block">
              <div class="block-header">
                <h2><i class="fa-solid fa-ranking-star"></i> Top 5 by Attendance</h2>
              </div>
              <ul class="top-list">
                <li *ngFor="let ev of top5(); let i = index" class="top-item">
                  <div class="top-rank rank-{{ i + 1 }}">{{ i + 1 }}</div>
                  <div class="top-info">
                    <div class="top-name">{{ ev.title }}</div>
                    <div class="top-loc"><i class="fa-solid fa-map-pin"></i> {{ ev.location }}</div>
                  </div>
                  <div class="top-attended">{{ ev.attended }} <span>pres.</span></div>
                </li>
              </ul>
            </div>

            <!-- Activities -->
            <div class="card-block">
              <div class="block-header">
                <h2><i class="fa-solid fa-person-hiking"></i> Activities per Event</h2>
              </div>
              <ul class="activity-list">
                <li *ngFor="let a of data().activityStats.slice(0,8)" class="activity-item">
                  <div class="act-title">{{ a.title }}</div>
                  <div class="act-count"
                       [class.act-zero]="a.nbActivities === 0">
                    <i class="fa-solid fa-bolt"></i> {{ a.nbActivities }}
                    <span class="act-zero-label" *ngIf="a.nbActivities === 0">None</span>
                  </div>
                  <div *ngIf="a.activities" class="act-names">{{ a.activities }}</div>
                </li>
              </ul>
            </div>

            <!-- Alerts -->
            <div class="card-block alerts-block">
              <div class="block-header">
                <h2><i class="fa-solid fa-triangle-exclamation"></i> Alerts</h2>
              </div>
              <div class="alert-list">
                <div *ngFor="let ev of highCancellation()" class="alert-item alert-red">
                  <i class="fa-solid fa-xmark-circle"></i>
                  <div>
                    <strong>{{ ev.title }}</strong>
                    <span>Cancellation rate: {{ ev.cancellationRate }}%</span>
                  </div>
                </div>
                <div *ngFor="let ev of lowScore()" class="alert-item alert-amber">
                  <i class="fa-solid fa-chart-line-down"></i>
                  <div>
                    <strong>{{ ev.title }}</strong>
                    <span>Low score: {{ ev.score }}/5</span>
                  </div>
                </div>
                <div *ngFor="let a of noActivities()" class="alert-item alert-blue">
                  <i class="fa-solid fa-circle-info"></i>
                  <div>
                    <strong>{{ a.title }}</strong>
                    <span>No activities registered</span>
                  </div>
                </div>
                <div *ngIf="highCancellation().length === 0 && lowScore().length === 0 && noActivities().length === 0"
                     class="alert-ok">
                  <i class="fa-solid fa-circle-check"></i> All events healthy!
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- ═══════════════ ADVANCED ANALYTICS ═══════════════ -->
        <div class="section-divider">
          <span><i class="fa-solid fa-flask"></i> Advanced Analytics</span>
        </div>

        <!-- Row A: Funnel · Retention · Durations -->
        <div class="adv-grid-3">

          <!-- Conversion Funnel -->
          <div class="card-block">
            <div class="block-header"><h2><i class="fa-solid fa-filter"></i> Conversion Funnel</h2></div>
            <div class="funnel-wrap">
              <div class="funnel-step">
                <div class="funnel-bar" style="width:100%" [style.background]="'#6366f1'"></div>
                <div class="funnel-info">
                  <span class="funnel-label">Total inscriptions</span>
                  <span class="funnel-val">{{ data().funnel.totalRegistrations }}</span>
                </div>
              </div>
              <div class="funnel-arrow"><i class="fa-solid fa-chevron-down"></i></div>
              <div class="funnel-step">
                <div class="funnel-bar" [style.width]="funnelWidth(data().funnel.stillRegistered, data().funnel.totalRegistrations)" style="background:#f59e0b"></div>
                <div class="funnel-info">
                  <span class="funnel-label">En attente</span>
                  <span class="funnel-val amber">{{ data().funnel.stillRegistered }}</span>
                </div>
              </div>
              <div class="funnel-arrow"><i class="fa-solid fa-chevron-down"></i></div>
              <div class="funnel-step">
                <div class="funnel-bar" [style.width]="funnelWidth(data().funnel.attended, data().funnel.totalRegistrations)" style="background:#10b981"></div>
                <div class="funnel-info">
                  <span class="funnel-label">Présents</span>
                  <span class="funnel-val green">{{ data().funnel.attended }}</span>
                </div>
              </div>
              <div class="funnel-arrow"><i class="fa-solid fa-chevron-down"></i></div>
              <div class="funnel-step">
                <div class="funnel-bar" [style.width]="funnelWidth(data().funnel.cancelled, data().funnel.totalRegistrations)" style="background:#ef4444"></div>
                <div class="funnel-info">
                  <span class="funnel-label">Annulés</span>
                  <span class="funnel-val red">{{ data().funnel.cancelled }}</span>
                </div>
              </div>
            </div>
            <div class="funnel-rates">
              <div class="rate-chip green"><i class="fa-solid fa-arrow-trend-up"></i> Taux conv. {{ data().funnel.conversionRate }}%</div>
              <div class="rate-chip red"><i class="fa-solid fa-arrow-trend-down"></i> Drop-off {{ data().funnel.dropoffRate }}%</div>
            </div>
          </div>

          <!-- User Retention -->
          <div class="card-block">
            <div class="block-header"><h2><i class="fa-solid fa-rotate"></i> Rétention Utilisateurs</h2></div>
            <div class="retention-ring">
              <svg viewBox="0 0 100 100" class="donut">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="14"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#6366f1" stroke-width="14"
                        [attr.stroke-dasharray]="donutDash(data().retention.retentionRate) + ' 239'"
                        stroke-linecap="round" transform="rotate(-90 50 50)"/>
              </svg>
              <div class="donut-center">
                <div class="donut-pct">{{ data().retention.retentionRate }}%</div>
                <div class="donut-sub">rétention</div>
              </div>
            </div>
            <div class="retention-stats">
              <div class="ret-row">
                <span class="ret-label"><i class="fa-solid fa-user-check"></i> Utilisateurs récurrents</span>
                <span class="ret-val indigo">{{ data().retention.returningUsers }}</span>
              </div>
              <div class="ret-row">
                <span class="ret-label"><i class="fa-solid fa-users"></i> Total participants uniques</span>
                <span class="ret-val">{{ data().retention.totalUsers }}</span>
              </div>
              <div class="ret-row">
                <span class="ret-label"><i class="fa-solid fa-user-plus"></i> Nouveaux utilisateurs</span>
                <span class="ret-val amber">{{ data().retention.totalUsers - data().retention.returningUsers }}</span>
              </div>
            </div>
          </div>

          <!-- Event Durations -->
          <div class="card-block">
            <div class="block-header"><h2><i class="fa-solid fa-hourglass-half"></i> Durée vs Présence</h2></div>
            <div class="dur-list">
              <div *ngFor="let d of data().eventDurations.slice(0,7)" class="dur-item">
                <div class="dur-title">{{ d.title }}</div>
                <div class="dur-bar-row">
                  <div class="dur-track">
                    <div class="dur-fill" [style.width.%]="durWidth(d.durationH)"></div>
                  </div>
                  <span class="dur-h">{{ d.durationH }}h</span>
                </div>
                <div class="dur-meta">
                  <span class="dur-att"><i class="fa-solid fa-circle-check"></i> {{ d.attended }} présents</span>
                  <span class="dur-tot">/ {{ d.total }} total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row B: Top Users · Day of Week · Hours -->
        <div class="adv-grid-2">

          <!-- Top Users Leaderboard -->
          <div class="card-block">
            <div class="block-header"><h2><i class="fa-solid fa-crown"></i> Top Participants</h2></div>
            <table class="data-table">
              <thead>
                <tr><th>#</th><th>Utilisateur</th><th>Présences</th><th>Inscriptions</th><th>Annulations</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of data().topUsers; let i = index" [class.row-top]="i===0">
                  <td class="rank">
                    <span *ngIf="i===0" class="medal gold"><i class="fa-solid fa-crown"></i></span>
                    <span *ngIf="i===1" class="medal silver"><i class="fa-solid fa-medal"></i></span>
                    <span *ngIf="i===2" class="medal bronze"><i class="fa-solid fa-medal"></i></span>
                    <span *ngIf="i>2">{{ i+1 }}</span>
                  </td>
                  <td>
                    <div class="user-row">
                      <div class="user-avatar">{{ initials(u.fullName) }}</div>
                      <div>
                        <div class="ev-name">{{ u.fullName }}</div>
                        <div class="ev-loc">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="num attended">{{ u.attended }}</td>
                  <td class="num">{{ u.total }}</td>
                  <td class="num cancelled">{{ u.cancelled }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Temporal charts column -->
          <div class="col-charts-adv">

            <!-- Day of Week -->
            <div class="card-block">
              <div class="block-header"><h2><i class="fa-solid fa-calendar-week"></i> Inscriptions par jour</h2></div>
              <div class="hbar-chart">
                <div *ngFor="let d of data().byDayOfWeek" class="hbar-row">
                  <span class="hbar-label">{{ d.dayName.slice(0,3) }}</span>
                  <div class="hbar-track">
                    <div class="hbar-fill" [style.width.%]="hbarWidth(d.total, maxDow())"
                         [class.hbar-peak]="d.total === maxDow()"></div>
                  </div>
                  <span class="hbar-val">{{ d.total }}</span>
                </div>
                <div *ngIf="data().byDayOfWeek.length===0" class="empty-chart">Aucune donnée</div>
              </div>
            </div>

            <!-- Hours -->
            <div class="card-block">
              <div class="block-header"><h2><i class="fa-solid fa-clock"></i> Heure d'inscription</h2></div>
              <div class="micro-bars">
                <div *ngFor="let h of data().byHour" class="micro-col">
                  <div class="micro-bar" [style.height.%]="hbarWidth(h.total, maxHour())"
                       [class.micro-peak]="h.total === maxHour()">
                    <span class="micro-tip">{{ h.label }}: {{ h.total }}</span>
                  </div>
                  <span class="micro-label">{{ h.label }}</span>
                </div>
                <div *ngIf="data().byHour.length===0" class="empty-chart">Aucune donnée</div>
              </div>
            </div>

          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .analytics-page { padding: 1.5rem 1.75rem 4rem; max-width: 1600px; width: 100%; margin: 0 auto; box-sizing: border-box; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; font-weight: 800; color: white; margin: 0 0 0.25rem; display: flex; align-items: center; gap: 0.75rem; }
    .page-title i { color: #6366f1; }
    .page-sub { color: #64748b; font-size: 0.875rem; margin: 0; }
    .btn-refresh { padding: 0.6rem 1.25rem; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.4); color: #818cf8; border-radius: 0.5rem; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 0.5rem; }
    .btn-refresh:hover { background: rgba(99,102,241,0.25); }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; color: #64748b; }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
    .kpi-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.5rem; position: relative; overflow: hidden; }
    .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .kpi-blue::before  { background: #6366f1; }
    .kpi-green::before { background: #10b981; }
    .kpi-amber::before { background: #f59e0b; }
    .kpi-red::before   { background: #ef4444; }
    .kpi-icon { font-size: 1.25rem; margin-bottom: 0.75rem; }
    .kpi-blue  .kpi-icon { color: #6366f1; }
    .kpi-green .kpi-icon { color: #10b981; }
    .kpi-amber .kpi-icon { color: #f59e0b; }
    .kpi-red   .kpi-icon { color: #ef4444; }
    .kpi-value { font-size: 2.25rem; font-weight: 900; color: white; line-height: 1; margin-bottom: 0.25rem; }
    .kpi-label { font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-rate  { font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }

    /* Layout */
    .dashboard-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr); gap: 1.5rem; align-items: start; min-width: 0; }
    .col-main, .col-side { display: flex; flex-direction: column; gap: 1.5rem; min-width: 0; }

    /* Card block */
    .card-block { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.5rem; min-width: 0; }
    .block-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem; }
    .block-header h2 { font-size: 1rem; font-weight: 700; color: white; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .block-header h2 i { color: #6366f1; }
    .badge-info { font-size: 0.7rem; color: #64748b; background: rgba(255,255,255,0.05); padding: 0.25rem 0.6rem; border-radius: 20px; }

    /* Table */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table th { padding: 0.6rem 0.75rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }
    .data-table td { padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; color: #cbd5e1; }
    .data-table tr.row-top td { background: rgba(99,102,241,0.05); }
    .data-table tr.row-alert td { opacity: 0.7; }
    .data-table tr:last-child td { border-bottom: none; }

    .ev-name { font-weight: 700; color: white; margin-bottom: 0.2rem; }
    .ev-loc  { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 0.3rem; }
    .num { text-align: center; font-weight: 700; }
    .attended { color: #10b981; }
    .cancelled { color: #ef4444; }

    .score-bar-wrap { display: flex; align-items: center; gap: 0.5rem; min-width: 100px; }
    .score-bar { height: 6px; border-radius: 3px; min-width: 4px; transition: width 0.3s; }
    .score-low  { background: #ef4444; }
    .score-mid  { background: #f59e0b; }
    .score-high { background: #10b981; }
    .score-val  { font-weight: 800; font-size: 0.875rem; color: white; white-space: nowrap; }
    .text-red   { color: #ef4444; }

    .rank { text-align: center; width: 40px; }
    .medal { font-size: 1.1rem; }
    .gold   { color: #f59e0b; }
    .silver { color: #94a3b8; }
    .bronze { color: #b45309; }

    .pill { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .pill-red   { background: rgba(239,68,68,0.15);   color: #ef4444; }
    .pill-amber { background: rgba(245,158,11,0.15);  color: #f59e0b; }
    .pill-green { background: rgba(16,185,129,0.15);  color: #10b981; }

    /* Bar chart */
    .bar-chart { display: flex; align-items: flex-end; gap: 1rem; height: 160px; padding-bottom: 2rem; position: relative; overflow-x: auto; min-width: 0; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; }
    .bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; background: rgba(255,255,255,0.04); border-radius: 4px; overflow: hidden; position: relative; }
    .bar-fill { width: 100%; border-radius: 4px; background: linear-gradient(180deg, #6366f1, #818cf8); transition: height 0.5s ease; position: relative; cursor: pointer; min-height: 4px; }
    .bar-fill.bar-peak { background: linear-gradient(180deg, #10b981, #34d399); }
    .bar-tooltip { display: none; position: absolute; bottom: 105%; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; font-size: 0.7rem; padding: 0.35rem 0.6rem; border-radius: 6px; white-space: nowrap; text-align: center; z-index: 10; }
    .bar-fill:hover .bar-tooltip { display: block; }
    .bar-label { font-size: 0.7rem; color: #64748b; margin-top: 0.4rem; text-align: center; white-space: nowrap; }
    .bar-val { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
    .empty-chart { color: #64748b; font-size: 0.875rem; padding: 2rem; text-align: center; width: 100%; }

    /* Top 5 */
    .top-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .top-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 0.5rem; }
    .top-rank { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; flex-shrink: 0; }
    .rank-1 { background: rgba(245,158,11,0.2); color: #f59e0b; }
    .rank-2 { background: rgba(148,163,184,0.2); color: #94a3b8; }
    .rank-3 { background: rgba(180,83,9,0.2);   color: #b45309; }
    .rank-4, .rank-5 { background: rgba(99,102,241,0.1); color: #818cf8; }
    .top-info { flex: 1; min-width: 0; }
    .top-name { font-weight: 700; color: white; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-loc { font-size: 0.72rem; color: #64748b; display: flex; align-items: center; gap: 0.25rem; }
    .top-attended { font-size: 1rem; font-weight: 800; color: #10b981; white-space: nowrap; }
    .top-attended span { font-size: 0.65rem; color: #64748b; }

    /* Activities */
    .activity-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .activity-item { padding: 0.6rem 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.03); }
    .act-title { font-weight: 700; color: #cbd5e1; font-size: 0.8rem; }
    .act-count { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; color: #6366f1; margin-top: 0.15rem; }
    .act-zero  { color: #475569; }
    .act-zero-label { font-size: 0.65rem; color: #475569; }
    .act-names { font-size: 0.7rem; color: #64748b; margin-top: 0.2rem; }

    /* Alerts */
    .alert-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .alert-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.8rem; }
    .alert-item i { font-size: 1rem; flex-shrink: 0; margin-top: 0.1rem; }
    .alert-item div { display: flex; flex-direction: column; gap: 0.1rem; }
    .alert-item strong { color: white; }
    .alert-item span { color: #94a3b8; font-size: 0.75rem; }
    .alert-red   { background: rgba(239,68,68,0.08);   border: 1px solid rgba(239,68,68,0.2);   }
    .alert-red   i { color: #ef4444; }
    .alert-amber { background: rgba(245,158,11,0.08);  border: 1px solid rgba(245,158,11,0.2);  }
    .alert-amber i { color: #f59e0b; }
    .alert-blue  { background: rgba(99,102,241,0.08);  border: 1px solid rgba(99,102,241,0.2);  }
    .alert-blue  i { color: #818cf8; }
    .alert-ok { color: #10b981; font-size: 0.875rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; }

    /* Section divider */
    .section-divider { display: flex; align-items: center; gap: 1rem; margin: 2rem 0 1.5rem; }
    .section-divider::before, .section-divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.08); }
    .section-divider span { color: #818cf8; font-size: 0.875rem; font-weight: 700; display:flex; align-items:center; gap:0.5rem; white-space:nowrap; }

    /* Advanced grids */
    .adv-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; min-width: 0; }
    .adv-grid-2 { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; min-width: 0; }
    .col-charts-adv { display: flex; flex-direction: column; gap: 1.5rem; min-width: 0; }

    /* Funnel */
    .funnel-wrap { display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1rem; }
    .funnel-step { display:flex; flex-direction:column; gap:0.3rem; }
    .funnel-bar { height:28px; border-radius:4px; min-width:8px; transition:width 0.5s; }
    .funnel-info { display:flex; justify-content:space-between; align-items:center; }
    .funnel-label { font-size:0.78rem; color:#64748b; }
    .funnel-val { font-size:0.9rem; font-weight:800; color:white; }
    .funnel-val.green { color:#10b981; } .funnel-val.red { color:#ef4444; } .funnel-val.amber { color:#f59e0b; }
    .funnel-arrow { text-align:center; color:#475569; font-size:0.6rem; }
    .funnel-rates { display:flex; gap:0.75rem; flex-wrap:wrap; }
    .rate-chip { padding:0.3rem 0.7rem; border-radius:20px; font-size:0.75rem; font-weight:700; display:flex; align-items:center; gap:0.4rem; }
    .rate-chip.green { background:rgba(16,185,129,0.12); color:#10b981; }
    .rate-chip.red   { background:rgba(239,68,68,0.12);  color:#ef4444; }

    /* Donut */
    .retention-ring { display:flex; justify-content:center; margin-bottom:1.25rem; position:relative; }
    .donut { width:130px; height:130px; }
    .donut-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
    .donut-pct { font-size:1.5rem; font-weight:900; color:white; line-height:1; }
    .donut-sub { font-size:0.7rem; color:#64748b; }
    .retention-stats { display:flex; flex-direction:column; gap:0.5rem; }
    .ret-row { display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.04); }
    .ret-label { font-size:0.78rem; color:#94a3b8; display:flex; align-items:center; gap:0.4rem; }
    .ret-val { font-size:0.95rem; font-weight:800; color:white; }
    .ret-val.indigo { color:#818cf8; } .ret-val.amber { color:#f59e0b; }

    /* Durations */
    .dur-list { display:flex; flex-direction:column; gap:0.75rem; }
    .dur-item { display:flex; flex-direction:column; gap:0.25rem; }
    .dur-title { font-size:0.78rem; font-weight:700; color:#cbd5e1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dur-bar-row { display:flex; align-items:center; gap:0.5rem; }
    .dur-track { flex:1; height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; }
    .dur-fill  { height:100%; background:linear-gradient(90deg,#6366f1,#818cf8); border-radius:3px; transition:width 0.4s; }
    .dur-h { font-size:0.72rem; color:#64748b; font-weight:700; min-width:28px; text-align:right; }
    .dur-meta { display:flex; gap:0.5rem; font-size:0.7rem; }
    .dur-att { color:#10b981; } .dur-tot { color:#475569; }

    /* User avatar */
    .user-row { display:flex; align-items:center; gap:0.6rem; }
    .user-avatar { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#818cf8); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:800; color:white; flex-shrink:0; }

    /* Horizontal bars */
    .hbar-chart { display:flex; flex-direction:column; gap:0.5rem; }
    .hbar-row { display:flex; align-items:center; gap:0.5rem; }
    .hbar-label { font-size:0.72rem; color:#64748b; min-width:28px; font-weight:700; }
    .hbar-track { flex:1; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; }
    .hbar-fill { height:100%; background:linear-gradient(90deg,#6366f1,#818cf8); border-radius:4px; transition:width 0.4s; min-width:4px; }
    .hbar-fill.hbar-peak { background:linear-gradient(90deg,#10b981,#34d399); }
    .hbar-val { font-size:0.72rem; font-weight:700; color:#94a3b8; min-width:20px; text-align:right; }

    /* Micro bars (hours) */
    .micro-bars { display:flex; align-items:flex-end; gap:4px; height:70px; padding-bottom:1.5rem; overflow-x:auto; }
    .micro-col { display:flex; flex-direction:column; align-items:center; flex:1; height:100%; }
    .micro-bar { width:100%; border-radius:2px; background:rgba(99,102,241,0.4); transition:height 0.4s; min-height:3px; position:relative; cursor:pointer; }
    .micro-bar.micro-peak { background:#6366f1; }
    .micro-bar:hover .micro-tip { display:block; }
    .micro-tip { display:none; position:absolute; bottom:105%; left:50%; transform:translateX(-50%); background:#1e293b; color:white; font-size:0.65rem; padding:0.2rem 0.4rem; border-radius:4px; white-space:nowrap; z-index:10; }
    .micro-label { font-size:0.55rem; color:#475569; margin-top:2px; }

    @media (max-width: 1350px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .adv-grid-2 { grid-template-columns: 1fr; }
    }
    @media (max-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .adv-grid-3 { grid-template-columns: 1fr; }
    }
  `]
})
export class EventAnalyticsPage implements OnInit {
  private analyticsService = inject(EventAnalyticsService);

  loading = signal(true);
  data = signal<any>(null);
  today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  sortedEvents = computed(() => {
    if (!this.data()) return [];
    return [...this.data().eventStats].sort((a, b) => b.score - a.score);
  });

  top5 = computed(() => {
    if (!this.data()) return [];
    return [...this.data().eventStats]
      .sort((a, b) => b.attended - a.attended)
      .slice(0, 5);
  });

  highCancellation = computed(() => {
    if (!this.data()) return [];
    return this.data().eventStats.filter((e: any) => e.cancellationRate > 30);
  });

  lowScore = computed(() => {
    if (!this.data()) return [];
    return this.data().eventStats.filter((e: any) => e.score < 2.0 && e.total > 0);
  });

  noActivities = computed(() => {
    if (!this.data()) return [];
    return this.data().activityStats.filter((a: any) => a.nbActivities === 0).slice(0, 5);
  });

  maxAttended = computed(() => {
    if (!this.data() || this.data().monthlyPeaks.length === 0) return 1;
    return Math.max(...this.data().monthlyPeaks.map((m: any) => m.attended), 1);
  });

  maxDow = computed(() => {
    if (!this.data() || !this.data().byDayOfWeek?.length) return 1;
    return Math.max(...this.data().byDayOfWeek.map((d: any) => d.total), 1);
  });

  maxHour = computed(() => {
    if (!this.data() || !this.data().byHour?.length) return 1;
    return Math.max(...this.data().byHour.map((h: any) => h.total), 1);
  });

  maxDuration = computed(() => {
    if (!this.data() || !this.data().eventDurations?.length) return 1;
    return Math.max(...this.data().eventDurations.map((d: any) => d.durationH), 1);
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.analyticsService.getEventAnalytics().subscribe({
      next: (res: any) => {
        this.data.set(res?.data || null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  barHeight(attended: number): number {
    return Math.max((attended / this.maxAttended()) * 100, 5);
  }

  isPeak(attended: number): boolean {
    return attended === this.maxAttended();
  }

  hbarWidth(val: number, max: number): number {
    return Math.max((val / max) * 100, 3);
  }

  durWidth(h: number): number {
    return Math.max((h / this.maxDuration()) * 100, 3);
  }

  funnelWidth(val: number, total: number): string {
    if (!total) return '8px';
    return Math.max((val / total) * 100, 5) + '%';
  }

  donutDash(rate: number): number {
    return Math.round((rate / 100) * 238);
  }

  initials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
