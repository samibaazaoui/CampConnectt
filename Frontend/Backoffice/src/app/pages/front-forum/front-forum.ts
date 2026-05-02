// src/app/pages/front-forum/front-forum.page.ts
import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService, ForumPost, ForumComment, UserForumStats } from '../../services/forum';
import { MlService, MlPrediction } from '../../services/ml.service';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { catchError, map, of, shareReplay, timer, Subscription } from 'rxjs';

// ✅ Interfaces avec types PLAINS
interface Contributor {
  id: number;
  fullName: string;
  karma: number;
  rank: number;
  previousRank: number;
  avatar?: string;
  joinDate?: string;
  postCount?: number;
}

interface Recommendation extends ForumPost {
  score: number;
  reason?: string;
  userFeedback?: 'like' | 'dislike' | null;
}

@Component({
  selector: 'app-front-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Hero Section -->
    <div class="hero-section">
      <h1 class="hero-title">Community Basecamp.</h1>
      <p class="hero-subtitle">Connect with other explorers, share your camping experiences, and ask questions before your next excursion.</p>
      <div class="ml-status" [class.healthy]="mlHealthy()" [class.unhealthy]="!mlHealthy()">
        <i class="fa-solid" [class.fa-circle-check]="mlHealthy()" [class.fa-circle-exclamation]="!mlHealthy()"></i>
        {{ mlHealthy() ? 'AI Protection Active' : 'AI Service Offline' }}
      </div>
    </div>

    <section class="section-block">
      <div class="forum-layout">
        <div class="main-content">
          
          <!-- Header -->
          <div class="forum-header">
            <div>
              <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 0.5rem;">
                <i class="fa-solid fa-comments"></i> Discussion Board
              </h2>
              <p style="color: #64748b; font-size: 0.95rem;">Join the conversation with fellow adventurers.</p>
            </div>
            <div style="display: flex; gap: 1rem;">
              <button class="btn-refresh" (click)="loadPosts()" title="Refresh Feed">
                <i class="fa-solid fa-rotate"></i>
              </button>
              <button class="btn-action" (click)="toggleNewPostForm()">
                <span *ngIf="!showNewPostForm()"><i class="fa-solid fa-pen"></i> New Topic</span>
                <span *ngIf="showNewPostForm()"><i class="fa-solid fa-xmark"></i> Cancel</span>
              </button>
            </div>
          </div>

          <!-- 🔥 Advanced Filters Bar -->
          <div class="filters-bar animate-fade-in" *ngIf="!activePost()">
            <div class="filter-group">
              <label class="filter-label">Search Experts</label>
              <div class="search-wrapper">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" [(ngModel)]="searchKeyword" (keyup.enter)="searchExpertPosts()" 
                       placeholder="Search by experts..." class="search-input">
              </div>
              <select [(ngModel)]="searchMinKarma" class="filter-select">
                <option [value]="0">Any karma</option>
                <option [value]="10">10+ karma</option>
                <option [value]="20">20+ karma</option>
                <option [value]="50">50+ karma (Expert)</option>
                <option [value]="100">100+ karma (Master)</option>
              </select>
              <button class="btn-filter" (click)="searchExpertPosts()">
                <i class="fa-solid fa-filter"></i> Filter
              </button>
            </div>

            <div class="filter-group">
              <label class="filter-label">Posts by Role</label>
              <select [(ngModel)]="filterRole" class="filter-select">
                <option value="">All roles</option>
                <option value="ADMIN">Admins</option>
                <option value="GUIDE">Guides</option>
                <option value="CAMPSITE_OWNER">Campsite Owners</option>
                <option value="EQUIPMENT_OWNER">Equipment Owners</option>
              </select>
              <input type="date" [(ngModel)]="filterSince" class="filter-date">
              <button class="btn-filter" (click)="filterByRoleAndDate()">
                <i class="fa-solid fa-user-tag"></i> Apply
              </button>
            </div>

            <div class="filter-group">
              <label class="filter-label">Expert Comments</label>
              <button class="btn-toggle" [class.active]="showExpertComments()" (click)="toggleExpertComments()">
                <i class="fa-solid" [class.fa-comments]="!showExpertComments()" [class.fa-check]="showExpertComments()"></i>
                {{ showExpertComments() ? 'Hide Expert Comments' : 'Show Expert Comments' }}
              </button>
            </div>
          </div>

          <!-- Expert Comments Section -->
          <div class="expert-comments-section" *ngIf="showExpertComments()">
            <h3 class="section-title">
              <i class="fa-solid fa-medal" style="color: #fbbf24;"></i>
              Expert Comments (Karma {{ expertCommentsMinKarma }}+ | Last 30 Days)
            </h3>
            <div *ngIf="expertComments().length === 0" class="loading-placeholder">
              <i class="fa-solid fa-spinner fa-spin"></i> Loading expert insights...
            </div>
            <div class="comments-grid" *ngIf="expertComments().length > 0">
              <div class="comment-card" *ngFor="let comment of expertComments()">
                <div class="comment-header">
                  <span class="comment-author" [class.expert]="(comment.authorKarma ?? 0) >= 50">
                    {{ comment.authorName }}
                    <span *ngIf="comment.authorKarma" class="karma-pill">⭐ {{ comment.authorKarma }}</span>
                  </span>
                  <span class="comment-date">{{ comment.createdAt | date:'short' }}</span>
                </div>
                <p class="comment-content">{{ comment.content }}</p>
                <button class="btn-view-post" (click)="openPostById(comment.postId)">View Post →</button>
              </div>
            </div>
          </div>

          <!-- New Post Form with ML Check -->
          <div class="new-post-container animate-slide-up" *ngIf="showNewPostForm()">
            <input type="text" [(ngModel)]="newPostTitle" placeholder="Thread Title..." 
                   class="input-base title-input" (input)="onContentChange()">
            <div class="emoji-bar">
              <span *ngFor="let e of commonEmojis" (click)="newPostContent += e" class="emoji-btn">{{ e }}</span>
            </div>
            <textarea [(ngModel)]="newPostContent" placeholder="Write your post content here..." 
                      class="input-base content-input" rows="4" (input)="onContentChange()"></textarea>
            <div class="ml-preview" *ngIf="mlAnalysis()">
              <div class="ml-badge" [class.safe]="!mlAnalysis()?.is_spam" [class.danger]="mlAnalysis()?.is_spam">
                <i class="fa-solid" 
                   [class.fa-shield-check]="!mlAnalysis()?.is_spam" 
                   [class.fa-triangle-exclamation]="mlAnalysis()?.is_spam"></i>
                {{ getMlStatusMessage() }}
              </div>
              <small style="color: #64748b;" *ngIf="mlAnalysis()?.has_bad_words">
                ⚠️ Contains words that may not be appropriate for our community
              </small>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 1rem; gap: 0.5rem;">
              <button class="btn-secondary" (click)="toggleNewPostForm()">Cancel</button>
              <button class="btn-action" style="background: #6366f1;" 
                      (click)="submitPost()" 
                      [disabled]="!canSubmitPost()"
                      [class.loading]="isCheckingMl()">
                <i class="fa-solid" [class.fa-spinner]="isCheckingMl()" [class.fa-spin]="isCheckingMl()"></i>
                {{ isCheckingMl() ? 'Checking...' : 'Publish Topic' }}
              </button>
            </div>
          </div>

          <!-- ✅ RECOMMENDATIONS SECTION - CORRIGÉ -->
          <div class="recommendations-section" *ngIf="!activePost()">
            <h3 class="section-title">
              <i class="fa-solid fa-sparkles" style="color: #fbbf24;"></i>
              Recommended for You
            </h3>

            <!-- Loading State -->
            <div *ngIf="loadingRecommendations()" class="loading-placeholder">
              <i class="fa-solid fa-spinner fa-spin"></i> Loading recommendations...
            </div>

            <!-- Recommendations Grid -->
            <div class="recommendations-grid" *ngIf="!loadingRecommendations() && recommendations().length > 0">
              <div class="recommendation-card" 
                   *ngFor="let rec of recommendations()"
                   [class.has-feedback]="rec.userFeedback"
                   [class.feedback-like]="rec.userFeedback === 'like'"
                   [class.feedback-dislike]="rec.userFeedback === 'dislike'"
                   (click)="openPost(rec)">
                
                <!-- Header -->
                <div class="rec-header">
                  <div class="rec-score" [class.high]="rec.score > 0.8" [class.medium]="rec.score > 0.5 && rec.score <= 0.8">
                    <i class="fa-solid fa-star"></i>
                    {{ rec.score | number:'1.1-1' }}
                  </div>
                  <div class="rec-reason" *ngIf="rec.reason">
                    {{ rec.reason }}
                  </div>
                </div>

                <!-- Content -->
                <h4 class="rec-title">{{ rec.title }}</h4>
                <p class="rec-preview">{{ rec.content | slice:0:100 }}...</p>

                <!-- Footer -->
                <div class="rec-footer">
                  <div class="rec-meta">
                    <span class="rec-author">
                      <i class="fa-regular fa-user"></i> {{ rec.authorName }}
                    </span>
                    <span class="rec-date">
                      <i class="fa-regular fa-clock"></i> {{ rec.createdAt | date:'MMM d' }}
                    </span>
                  </div>

                  <!-- Feedback Buttons -->
                  <div class="rec-actions" (click)="$event.stopPropagation()">
                    <button class="feedback-btn like-btn" 
                            [class.active]="rec.userFeedback === 'like'"
                            (click)="onRecommendationFeedback(rec, 'like')"
                            title="I like this">
                      <i class="fa-solid fa-thumbs-up"></i>
                    </button>
                    <button class="feedback-btn dislike-btn" 
                            [class.active]="rec.userFeedback === 'dislike'"
                            (click)="onRecommendationFeedback(rec, 'dislike')"
                            title="Not interested">
                      <i class="fa-solid fa-thumbs-down"></i>
                    </button>
                  </div>
                </div>

                <!-- Feedback Indicator -->
                <div class="feedback-indicator" *ngIf="rec.userFeedback">
                  <i class="fa-solid" 
                     [class.fa-check]="rec.userFeedback === 'like'"
                     [class.fa-times]="rec.userFeedback === 'dislike'"></i>
                  <span>{{ rec.userFeedback === 'like' ? 'Thanks for feedback!' : 'We\'ll show less of this' }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div class="empty-state" *ngIf="!loadingRecommendations() && recommendations().length === 0">
              <i class="fa-regular fa-lightbulb"></i>
              <p>No recommendations yet. Browse posts to get personalized suggestions!</p>
              <button class="btn-action" (click)="loadPosts()" style="margin-top: 1rem;">
                Browse Posts
              </button>
            </div>
          </div>

          <!-- Posts Board with Pagination -->
          <div class="posts-board" *ngIf="!activePost()">
            <div class="post-card animate-fade-in" *ngFor="let post of paginatedPosts()" (click)="openPost(post)">
              <div class="post-stats">
                <div class="stat-box"><i class="fa-solid fa-message"></i></div>
              </div>
              <div class="post-summary">
                <h3 class="post-title">
                  {{ post.title }}
                  <span *ngIf="post.authorRole && post.authorRole !== 'USER'" 
                        class="role-badge" 
                        [class.admin]="post.authorRole === 'ADMIN'"
                        [class.guide]="post.authorRole === 'GUIDE'">
                    {{ post.authorRole === 'ADMIN' ? '🛡️' : '🧭' }}
                  </span>
                </h3>
                <p class="post-preview">{{ post.content | slice:0:120 }}...</p>
                <div class="post-meta">
                  <span class="author" [class.expert]="(post.authorKarma ?? 0) >= 50">
                    <i class="fa-regular fa-user"></i> {{ post.authorName }}
                    <span *ngIf="post.authorKarma" class="karma-mini">⭐ {{ post.authorKarma }}</span>
                  </span>
                  <span class="date"><i class="fa-regular fa-clock"></i> {{ post.createdAt | date:'medium' }}</span>
                  <!-- ✅ Bouton de suppression comme avant -->
                  <button *ngIf="isAuthor(post.authorId)" class="btn-delete" (click)="deletePost(post.id, $event)" title="Delete Post">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Pagination Controls -->
            <div class="pagination" *ngIf="shouldShowPagination()">
              <div class="pagination-info">
                Showing {{ getStartIndex() }}-{{ getEndIndex() }} of {{ allPosts().length }} posts
              </div>
              <div class="pagination-buttons">
                <button class="page-btn" [disabled]="currentPage() === 1" (click)="goToPage(1)" title="First page">
                  <i class="fa-solid fa-angles-left"></i>
                </button>
                <button class="page-btn" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)" title="Previous page">
                  <i class="fa-solid fa-angle-left"></i>
                </button>
                
                <span class="page-indicator">
                  Page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages }}</strong>
                </span>
                
                <button class="page-btn" [disabled]="currentPage() === totalPages" (click)="goToPage(currentPage() + 1)" title="Next page">
                  <i class="fa-solid fa-angle-right"></i>
                </button>
                <button class="page-btn" [disabled]="currentPage() === totalPages" (click)="goToPage(totalPages)" title="Last page">
                  <i class="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </div>

            <div *ngIf="paginatedPosts().length === 0" class="empty-state">
              <i class="fa-solid fa-wind fa-3x"></i>
              <p>The basecamp is quiet. Be the first to start a conversation!</p>
            </div>
          </div>

          <!-- Active Post View -->
          <div class="active-post-view animate-fade-in" *ngIf="activePost()">
            <button class="btn-back" (click)="activePost.set(null)">
              <i class="fa-solid fa-arrow-left"></i> Back to Board
            </button>
            <div class="original-post">
              <h2 class="op-title">{{ activePost()?.title }}</h2>
              <div class="post-meta" style="margin-bottom: 1.5rem;">
                <span class="author" [class.expert]="(activePost()?.authorKarma ?? 0) >= 50">
                  <i class="fa-solid fa-user-astronaut"></i> {{ activePost()?.authorName }}
                  <span *ngIf="activePost()?.authorKarma" class="karma-pill">⭐ {{ activePost()?.authorKarma }}</span>
                </span>
                <span class="date">{{ activePost()?.createdAt | date:'long' }}</span>
              </div>
              <p class="op-content">{{ activePost()?.content }}</p>
            </div>
            <div class="comments-section">
              <h4 class="comments-header"><i class="fa-regular fa-comments"></i> Responses</h4>
              <div class="comment-thread">
                <div class="comment-card" *ngFor="let c of comments()">
                  <div class="comment-meta">
                    <strong class="comment-author" [class.expert]="(c.authorKarma ?? 0) >= 50">
                      {{ c.authorName }}
                      <span *ngIf="c.authorKarma" class="karma-mini">⭐ {{ c.authorKarma }}</span>
                    </strong>
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                      <span style="color: #94a3b8; font-size: 0.8rem;">{{ c.createdAt | date:'short' }}</span>
                      <button *ngIf="isAuthor(c.authorId)" class="btn-delete-small" (click)="deleteComment(c.id)" title="Delete Comment">
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </div>
                  <p class="comment-text">{{ c.content }}</p>
                </div>
                <p *ngIf="comments().length === 0" class="no-comments">No replies yet.</p>
              </div>
              <div class="reply-box">
                <div class="emoji-bar" style="margin-bottom: 0.25rem;">
                  <span *ngFor="let e of commonEmojis" (click)="newCommentContent += e" class="emoji-btn">{{ e }}</span>
                </div>
                <textarea [(ngModel)]="newCommentContent" placeholder="Write a response..." 
                          class="input-base content-input" rows="3" style="margin-bottom: 0.5rem;" (input)="onCommentChange()"></textarea>
                <div class="ml-preview-small" *ngIf="commentMlAnalysis()">
                  <small [class.text-green]="!commentMlAnalysis()?.is_spam" [class.text-red]="commentMlAnalysis()?.is_spam">
                    <i class="fa-solid" 
                       [class.fa-check]="!commentMlAnalysis()?.is_spam" 
                       [class.fa-warning]="commentMlAnalysis()?.is_spam"></i>
                    {{ getCommentMlStatusMessage() }}
                  </small>
                </div>
                <button class="btn-action" style="max-width: 120px;" 
                        (click)="submitComment()" 
                        [disabled]="!canSubmitComment()"
                        [class.loading]="isCheckingCommentMl()">
                  {{ isCheckingCommentMl() ? 'Checking...' : 'Reply' }}
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Sidebar -->
        <div class="sidebar" *ngIf="!activePost()">
          <!-- User Stats Card -->
          <div class="user-stats-card" *ngIf="userStats()">
            <h3 class="sidebar-title"><i class="fa-solid fa-chart-simple"></i> Your Activity</h3>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-value">{{ userStats()?.postCount }}</span>
                <span class="stat-label">Posts</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">{{ userStats()?.commentCount }}</span>
                <span class="stat-label">Comments</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">{{ userStats()?.totalInteractions }}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>
          </div>

          <!-- ✅ TOP CONTRIBUTORS - CORRIGÉ -->
          <div class="top-contributors-card" 
               [class.live-updating]="isLiveUpdating()"
               (mouseenter)="showHoverInfo.set(true)"
               (mouseleave)="showHoverInfo.set(false)">
            
            <!-- Header with Live Indicator -->
            <div class="card-header">
              <h3 class="card-title">
                <i class="fa-solid fa-crown" style="color: #fbbf24;"></i>
                Top Contributors
              </h3>
              <div class="live-indicator" *ngIf="isLiveUpdating()">
                <span class="pulse-dot"></span>
                <span class="live-text">Live</span>
              </div>
            </div>

            <!-- Loading Skeleton -->
            <div class="skeleton-container" *ngIf="loadingContributors()">
              <div class="skeleton-item" *ngFor="let _ of [1,2,3,4,5]">
                <div class="skeleton-rank"></div>
                <div class="skeleton-avatar"></div>
                <div class="skeleton-info">
                  <div class="skeleton-name"></div>
                  <div class="skeleton-karma"></div>
                </div>
              </div>
            </div>

            <!-- Contributors List -->
            <div class="contributors-list" *ngIf="!loadingContributors()">
              <div class="contributor-item" 
                   *ngFor="let contributor of contributors(); let i = index"
                   [class.rank-up]="contributor.previousRank < contributor.rank"
                   [class.rank-down]="contributor.previousRank > contributor.rank">
                
                <!-- Rank Number -->
                <div class="rank-number" 
                     [class.top-1]="i === 0"
                     [class.top-2]="i === 1"
                     [class.top-3]="i === 2">
                  {{ contributor.rank }}
                  <span class="rank-change" *ngIf="contributor.previousRank !== contributor.rank">
                    <i class="fa-solid" 
                       [class.fa-arrow-up]="contributor.previousRank < contributor.rank"
                       [class.fa-arrow-down]="contributor.previousRank > contributor.rank"></i>
                  </span>
                </div>

                <!-- Avatar -->
                <div class="contributor-avatar">
                  <img [src]="getAvatar(contributor)" [alt]="contributor.fullName">
                  <div class="avatar-badge" *ngIf="i < 3">
                    <i class="fa-solid fa-star"></i>
                  </div>
                </div>

                <!-- Info -->
                <div class="contributor-info" 
                     [class.hover-active]="showHoverInfo() && hoveredContributor() === contributor.id"
                     (mouseenter)="hoveredContributor.set(contributor.id)"
                     (mouseleave)="hoveredContributor.set(null)">
                  <div class="contributor-name">{{ contributor.fullName }}</div>
                  <div class="contributor-karma">
                    <i class="fa-solid fa-star"></i>
                    <span class="karma-value">{{ contributor.karma }}</span>
                    <span class="karma-label">Karma</span>
                  </div>
                  
                  <!-- Hover Card -->
                  <div class="hover-card" *ngIf="showHoverInfo() && hoveredContributor() === contributor.id">
                    <div class="hover-stat">
                      <span class="stat-label">Posts</span>
                      <span class="stat-value">{{ getContributorPostCount(contributor.id) }}</span>
                    </div>
                    <div class="hover-stat">
                      <span class="stat-label">Member since</span>
                      <span class="stat-value">{{ contributor.joinDate | date:'MMM yyyy' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div class="empty-state" *ngIf="!loadingContributors() && contributors().length === 0">
              <i class="fa-solid fa-users-slash"></i>
              <p>No contributors yet</p>
            </div>

            <!-- Last Update -->
            <div class="last-update" *ngIf="lastUpdateTime()">
              <i class="fa-regular fa-clock"></i>
              Updated {{ lastUpdateTime() | date:'HH:mm:ss' }}
            </div>
          </div>

          <!-- Trending Posts -->
          <div class="trending-card" *ngIf="trendingPosts().length > 0">
            <h3 class="sidebar-title"><i class="fa-solid fa-fire" style="color: #ef4444;"></i> Trending Now</h3>
            <div class="trending-list">
              <div class="trending-item" *ngFor="let post of trendingPosts()" (click)="openPost(post)">
                <span class="trending-badge">🔥</span>
                <span class="trending-title">{{ post.title | slice:0:40 }}{{ post.title.length > 40 ? '...' : '' }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ✅ COOLDOWN MODAL -->
    <div class="modal-overlay" *ngIf="showCooldownModal()" (click)="closeCooldownModal()">
      <div class="modal-content cooldown-modal" (click)="$event.stopPropagation()">
        <div class="modal-icon cooldown-icon">
          <i class="fa-solid fa-clock"></i>
        </div>
        <h3>Slow Down, Explorer! ⏱️</h3>
        <p>{{ cooldownModalMessage() }}</p>
        <div class="cooldown-timer" *ngIf="cooldownSecondsLeft() > 0">
          <div class="timer-bar">
            <div class="timer-progress" [style.width.%]="getCooldownProgress()"></div>
          </div>
          <span class="timer-text">{{ cooldownSecondsLeft() }}s remaining</span>
        </div>
        <button class="btn-action" (click)="closeCooldownModal()" style="margin-top: 1rem;">
          Got it, I'll wait
        </button>
      </div>
    </div>

    <!-- ✅ BAD WORDS MODAL -->
    <div class="modal-overlay" *ngIf="showBadWordsModal()" (click)="closeBadWordsModal()">
      <div class="modal-content badwords-modal" (click)="$event.stopPropagation()">
        <div class="modal-icon badwords-icon">
          <i class="fa-solid fa-ban"></i>
        </div>
        <h3>Language Review Needed ⚠️</h3>
        <p class="modal-message">
          We detected words that may not be appropriate for our community. 
          Please review your content and remove any offensive language before posting.
        </p>
        <div class="modal-tips">
          <h4>💡 Tips for a positive post:</h4>
          <ul>
            <li>Be respectful and constructive</li>
            <li>Focus on your camping experience</li>
            <li>Ask questions or share tips</li>
          </ul>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="closeBadWordsModal()">I understand</button>
          <button class="btn-action" (click)="editPostAfterBadWords()">Edit My Post</button>
        </div>
      </div>
    </div>

    <!-- Spam Detection Modal -->
    <div class="modal-overlay" *ngIf="showSpamModal()" (click)="closeSpamModal()">
      <div class="modal-content spam-modal" (click)="$event.stopPropagation()">
        <div class="modal-icon spam-icon">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <h3>Content Review Needed</h3>
        <p>{{ spamModalMessage }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="closeSpamModal()">Got it</button>
          <button class="btn-action" (click)="editPostAfterSpam()">Edit My Post</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* CSS Animations */
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .animate-slide-up { animation: slideUp 0.3s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .skeleton-card, .skeleton-item {
      animation: shimmer 1.5s infinite;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
    }
    
    @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
    .pulse-dot { animation: pulse-dot 1.5s infinite; }
    
    .contributor-item.rank-up {
      background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%);
      border-left: 3px solid #10b981;
      transition: all 0.3s ease;
    }
    .contributor-item.rank-down {
      background: linear-gradient(135deg, #fef2f2 0%, #f8fafc 100%);
      border-left: 3px solid #ef4444;
      transition: all 0.3s ease;
    }
    
    .recommendation-card.feedback-like {
      background: #dcfce7;
      transform: scale(1.02);
      transition: all 0.3s ease;
    }
    .recommendation-card.feedback-dislike {
      background: #fef2f2;
      transform: scale(0.98);
      transition: all 0.3s ease;
    }
    
    @keyframes slideIn { from { opacity: 0; transform: translateY(-50%) translateX(-10px); } to { opacity: 1; transform: translateY(-50%) translateX(0); } }
    .hover-card { animation: slideIn 0.2s ease-out; }
    
    @keyframes slideUpFeedback { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .feedback-indicator { animation: slideUpFeedback 0.3s ease-out; }
    
    /* ... (tes autres styles existants - inchangés) ... */
    .hero-section { text-align: center; padding: 4rem 2rem; }
    .hero-title { font-size: 3.5rem; font-weight: 900; color: #0f172a; margin-bottom: 1rem; letter-spacing: -0.05em; }
    .hero-subtitle { font-size: 1.25rem; color: #64748b; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    .ml-status { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem; background: #f1f5f9; border-radius: 2rem; font-size: 0.8rem; font-weight: 600; margin-top: 1rem; }
    .ml-status.healthy { background: #dcfce7; color: #166534; }
    .ml-status.unhealthy { background: #fef2f2; color: #b91c1c; }
    .section-block { max-width: 960px; margin: 0 auto 5rem; }
    .forum-layout { display: flex; gap: 2rem; align-items: flex-start; }
    .main-content { flex: 1; }
    .sidebar { width: 300px; position: sticky; top: 2rem; }
    .forum-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #f1f5f9; }
    .btn-refresh { background: white; border: 1px solid #e2e8f0; color: #64748b; padding: 0.75rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: 0.2s; }
    .btn-refresh:hover { background: #f8fafc; color: #6366f1; }
    .btn-action { padding: 0.75rem 1.5rem; background: #0f172a; color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-action.loading { opacity: 0.7; cursor: wait; }
    .filters-bar { background: white; padding: 1rem; border-radius: 1rem; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; align-items: end; }
    .filter-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .filter-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .search-wrapper { position: relative; }
    .search-wrapper i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-input { width: 100%; padding: 0.6rem 0.75rem 0.6rem 2rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.9rem; outline: none; }
    .search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .filter-select, .filter-date { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.9rem; background: white; cursor: pointer; }
    .btn-filter { padding: 0.6rem 1rem; background: #6366f1; color: white; border: none; border-radius: 0.5rem; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: 0.2s; }
    .btn-filter:hover { background: #4f46e5; }
    .btn-toggle { padding: 0.6rem 1rem; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: 0.2s; }
    .btn-toggle.active { background: #10b981; color: white; border-color: #10b981; }
    .expert-comments-section { background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fcd34d; border-radius: 1rem; padding: 1.25rem; margin-bottom: 1.5rem; }
    .section-title { font-size: 1.1rem; font-weight: 700; color: #92400e; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .comments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
    .comment-card { background: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid #fcd34d; }
    .comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .comment-author { font-weight: 600; color: #0f172a; font-size: 0.9rem; }
    .comment-author.expert { color: #6366f1; }
    .comment-date { font-size: 0.75rem; color: #94a3b8; }
    .comment-content { font-size: 0.9rem; color: #475569; margin: 0 0 0.75rem; line-height: 1.4; }
    .btn-view-post { background: none; border: none; color: #6366f1; font-weight: 600; font-size: 0.8rem; cursor: pointer; padding: 0; }
    .btn-view-post:hover { text-decoration: underline; }
    .loading-placeholder { text-align: center; padding: 2rem; color: #64748b; }
    .new-post-container { background: white; padding: 1.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; margin-bottom: 2rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .input-base { width: 100%; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 1rem; font-family: inherit; font-size: 1rem; outline: none; transition: 0.2s; }
    .input-base:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .title-input { font-weight: 700; margin-bottom: 1rem; }
    .content-input { resize: vertical; }
    .emoji-bar { display: flex; gap: 0.5rem; padding: 0.5rem 0; flex-wrap: wrap; width: 100%; }
    .emoji-btn { cursor: pointer; font-size: 1.25rem; transition: transform 0.2s; padding: 0.25rem; border-radius: 0.25rem; }
    .emoji-btn:hover { background: rgba(99,102,241,0.1); transform: scale(1.2); }
    .ml-preview { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-top: 0.75rem; }
    .ml-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.6rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem; }
    .ml-badge.safe { background: #dcfce7; color: #166534; }
    .ml-badge.danger { background: #fef2f2; color: #b91c1c; }
    .ml-preview-small { margin-bottom: 0.5rem; }
    .text-green { color: #166534; }
    .text-red { color: #b91c1c; }
    .btn-secondary { padding: 0.75rem 1.5rem; background: #f1f5f9; color: #475569; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-secondary:hover { background: #e2e8f0; }
    .posts-board { display: flex; flex-direction: column; gap: 1rem; }
    .post-card { display: flex; gap: 1.5rem; background: white; padding: 1.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
    .post-card:hover { transform: translateX(5px); border-color: #6366f1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .post-stats { display: flex; align-items: center; }
    .stat-box { width: 50px; height: 50px; background: #f8fafc; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #64748b; font-size: 1.25rem; }
    .post-card:hover .stat-box { background: rgba(99,102,241,0.1); color: #6366f1; }
    .post-summary { flex: 1; }
    .post-title { margin: 0 0 0.25rem; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .post-preview { color: #64748b; margin: 0 0 1rem; font-size: 0.95rem; line-height: 1.5; }
    .post-meta { display: flex; gap: 1.5rem; font-size: 0.85rem; color: #94a3b8; }
    .post-meta span { display: flex; align-items: center; gap: 0.4rem; }
    .author { font-weight: 600; color: #475569; }
    .author.expert { color: #6366f1; font-weight: 600; }
    
    /* ✅ Bouton de suppression comme avant */
    .btn-delete { 
      background: transparent; 
      border: none; 
      color: #94a3b8; 
      cursor: pointer; 
      transition: 0.2s; 
      margin-left: auto;
      padding: 0.4rem;
      border-radius: 0.3rem;
    }
    .btn-delete:hover { 
      color: #ef4444; 
      transform: scale(1.1); 
      background: rgba(239, 68, 68, 0.1);
    }
    
    .empty-state { text-align: center; padding: 4rem; color: #94a3b8; background: white; border-radius: 1rem; border: 1px dashed #cbd5e1; }
    .empty-state i { color: #e2e8f0; margin-bottom: 1rem; }
    .pagination { display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 0.75rem; border: 1px solid #e2e8f0; }
    .pagination-info { font-size: 0.85rem; color: #64748b; font-weight: 500; }
    .pagination-buttons { display: flex; align-items: center; gap: 0.5rem; }
    .page-btn { padding: 0.6rem 0.9rem; background: white; border: 1px solid #cbd5e1; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; color: #475569; font-weight: 600; }
    .page-btn:hover:not(:disabled) { background: #6366f1; border-color: #6366f1; color: white; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(99,102,241,0.2); }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; background: #f1f5f9; }
    .page-indicator { font-size: 0.9rem; color: #475569; font-weight: 600; margin: 0 0.5rem; padding: 0.4rem 0.8rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0; }
    .page-indicator strong { color: #6366f1; }
    .btn-back { background: transparent; border: none; color: #64748b; font-weight: 600; cursor: pointer; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
    .btn-back:hover { color: #0f172a; }
    .original-post { background: white; padding: 2.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; margin-bottom: 2rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .op-title { font-size: 2rem; font-weight: 900; margin-bottom: 0.75rem; color: #0f172a; letter-spacing: -0.02em; }
    .op-content { color: #334155; line-height: 1.8; font-size: 1.1rem; white-space: pre-wrap; }
    .comments-section { background: #f8fafc; border-radius: 1rem; padding: 2rem; border: 1px solid #e2e8f0; }
    .comments-header { margin: 0 0 1.5rem; color: #0f172a; font-size: 1.25rem; font-weight: 800; }
    .comment-thread { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
    .comment-card { background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; }
    .comment-meta { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .comment-text { margin: 0; color: #475569; line-height: 1.6; }
    .btn-delete-small { background: transparent; border: none; color: #cbd5e1; cursor: pointer; font-size: 0.8rem; }
    .btn-delete-small:hover { color: #ef4444; }
    .reply-box { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; width: 100%; }
    .no-comments { color: #94a3b8; font-style: italic; padding: 1rem; text-align: center; }
    .top-contributors-card { background: white; border-radius: 1rem; border: 1px solid #e2e8f0; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.3s ease; margin-bottom: 1.5rem; }
    .top-contributors-card.live-updating { box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); border-color: #10b981; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #f1f5f9; }
    .card-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; margin: 0; }
    .live-indicator { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600; color: #10b981; }
    .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
    .skeleton-container { display: flex; flex-direction: column; gap: 1rem; }
    .skeleton-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.75rem; }
    .skeleton-rank { width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; }
    .skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; }
    .skeleton-info { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
    .skeleton-name { height: 14px; width: 60%; background: #e2e8f0; border-radius: 4px; }
    .skeleton-karma { height: 12px; width: 40%; background: #e2e8f0; border-radius: 4px; }
    .contributors-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .contributor-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.75rem; transition: all 0.3s ease; position: relative; }
    .contributor-item:hover { background: #f1f5f9; transform: translateX(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .rank-number { width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; color: #64748b; position: relative; }
    .rank-number.top-1 { background: linear-gradient(135deg, #fef3c7, #fbbf24); color: #92400e; box-shadow: 0 0 0 2px #fbbf24; }
    .rank-number.top-2 { background: linear-gradient(135deg, #f1f5f9, #cbd5e1); color: #475569; box-shadow: 0 0 0 2px #cbd5e1; }
    .rank-number.top-3 { background: linear-gradient(135deg, #fff7ed, #fdba74); color: #c2410c; box-shadow: 0 0 0 2px #fdba74; }
    .rank-change { position: absolute; top: -4px; right: -4px; font-size: 0.65rem; color: #10b981; }
    .rank-change .fa-arrow-down { color: #ef4444; }
    .contributor-avatar { position: relative; width: 40px; height: 40px; }
    .contributor-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .avatar-badge { position: absolute; bottom: -2px; right: -2px; width: 16px; height: 16px; background: #fbbf24; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: white; border: 2px solid white; }
    .contributor-info { flex: 1; position: relative; }
    .contributor-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 0.25rem; }
    .contributor-karma { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: #6366f1; font-weight: 600; }
    .karma-value { font-weight: 700; }
    .karma-label { color: #94a3b8; font-weight: 500; }
    .hover-card { position: absolute; left: 100%; top: 50%; transform: translateY(-50%); background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 10; min-width: 180px; margin-left: 0.5rem; }
    .hover-stat { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
    .hover-stat:last-child { margin-bottom: 0; }
    .stat-label { color: #64748b; font-size: 0.8rem; }
    .stat-value { color: #0f172a; font-weight: 600; font-size: 0.85rem; }
    .last-update { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
    .recommendations-section { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
    .recommendations-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .recommendation-card { background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1rem; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden; }
    .recommendation-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.08); border-color: #6366f1; }
    .recommendation-card.has-feedback { border-width: 2px; }
    .rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .rec-score { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 1rem; background: #f1f5f9; color: #64748b; }
    .rec-score.high { background: #dcfce7; color: #166534; }
    .rec-score.medium { background: #fef3c7; color: #92400e; }
    .rec-reason { font-size: 0.7rem; color: #94a3b8; font-style: italic; }
    .rec-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; line-height: 1.3; }
    .rec-preview { font-size: 0.85rem; color: #64748b; margin: 0 0 1rem; line-height: 1.4; }
    .rec-footer { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .rec-meta { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; color: #94a3b8; }
    .rec-author, .rec-date { display: flex; align-items: center; gap: 0.3rem; }
    .rec-actions { display: flex; gap: 0.5rem; }
    .feedback-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #e2e8f0; background: white; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
    .feedback-btn:hover { transform: scale(1.1); }
    .like-btn:hover, .like-btn.active { background: #10b981; border-color: #10b981; color: white; }
    .dislike-btn:hover, .dislike-btn.active { background: #ef4444; border-color: #ef4444; color: white; }
    .feedback-indicator { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.95); padding: 0.75rem; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600; color: #475569; }
    .feedback-indicator .fa-check { color: #10b981; }
    .feedback-indicator .fa-times { color: #ef4444; }
    .user-stats-card { background: white; padding: 1.25rem; border-radius: 1rem; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 0.75rem; }
    .stat-box { text-align: center; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; }
    .stat-value { display: block; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
    .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
    .trending-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; }
    .trending-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .trending-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; transition: 0.2s; }
    .trending-item:hover { background: #f8fafc; }
    .trending-badge { font-size: 1rem; }
    .trending-title { font-size: 0.85rem; color: #0f172a; font-weight: 500; }
    .role-badge { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; font-size: 0.7rem; margin-left: 0.3rem; vertical-align: middle; }
    .role-badge.admin { background: #ef4444; color: white; }
    .role-badge.guide { background: #10b981; color: white; }
    .karma-mini { font-size: 0.7rem; color: #fbbf24; font-weight: 600; margin-left: 0.3rem; }
    .karma-pill { background: #fbbf24; color: #78350f; font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 1rem; margin-left: 0.4rem; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn 0.3s; }
    .modal-content { background: white; padding: 2.5rem; border-radius: 1.5rem; text-align: center; max-width: 500px; width: 90%; animation: slideUp 0.3s; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .modal-icon { font-size: 3.5rem; margin-bottom: 1.5rem; }
    .spam-icon { color: #fbbf24; }
    .cooldown-icon { color: #6366f1; }
    .badwords-icon { color: #ef4444; }
    .spam-modal h3, .cooldown-modal h3, .badwords-modal h3 { margin: 0 0 1rem; color: #0f172a; font-size: 1.5rem; font-weight: 700; }
    .spam-modal p, .cooldown-modal p, .badwords-modal p { margin: 0 0 1.5rem; color: #64748b; font-size: 1rem; line-height: 1.6; }
    .spam-modal .modal-actions, .cooldown-modal .modal-actions, .badwords-modal .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .spam-modal .btn-secondary, .spam-modal .btn-action, .cooldown-modal .btn-secondary, .cooldown-modal .btn-action, .badwords-modal .btn-secondary, .badwords-modal .btn-action { flex: 1; }
    .spam-modal .btn-action, .cooldown-modal .btn-action, .badwords-modal .btn-action { background: #6366f1; }
    .badwords-modal .modal-message { font-size: 1.05rem; color: #475569; margin-bottom: 1.5rem; }
    .badwords-modal .modal-tips { background: #f8fafc; border-left: 4px solid #6366f1; padding: 1.25rem; border-radius: 0.5rem; text-align: left; margin: 1.5rem 0; }
    .badwords-modal .modal-tips h4 { margin: 0 0 0.75rem; color: #0f172a; font-size: 0.95rem; font-weight: 700; }
    .badwords-modal .modal-tips ul { margin: 0; padding-left: 1.25rem; color: #64748b; font-size: 0.9rem; line-height: 1.6; }
    .badwords-modal .modal-tips li { margin-bottom: 0.4rem; }
    .cooldown-timer { margin: 1.5rem 0; padding: 1rem; background: #f1f5f9; border-radius: 0.75rem; }
    .timer-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
    .timer-progress { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 1s linear; }
    .timer-text { font-size: 0.85rem; color: #475569; font-weight: 600; }
  `]
})
export class FrontForumPage implements OnInit, OnDestroy {
  private forumService = inject(ForumService);
  private mlService = inject(MlService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // ✅ Data signals - Posts
  allPosts = signal<ForumPost[]>([]);
  paginatedPosts = signal<ForumPost[]>([]);
  expertComments = signal<ForumComment[]>([]);
  trendingPosts = signal<ForumPost[]>([]);
  userStats = signal<UserForumStats | null>(null);
  
  // ✅ Data signals - Contributors
  contributors = signal<Contributor[]>([]);
  loadingContributors = signal(true);
  isLiveUpdating = signal(false);
  lastUpdateTime = signal<Date | null>(null);
  showHoverInfo = signal(false);
  hoveredContributor = signal<number | null>(null);
  
  // ✅ Data signals - Recommendations
  recommendations = signal<Recommendation[]>([]);
  loadingRecommendations = signal(true);
  
  // ✅ UI signals
  showNewPostForm = signal<boolean>(false);
  activePost = signal<ForumPost | null>(null);
  comments = signal<ForumComment[]>([]);
  mlHealthy = signal<boolean>(false);
  showExpertComments = signal<boolean>(false);
  showCooldownModal = signal<boolean>(false);
  showBadWordsModal = signal<boolean>(false);
  showSpamModal = signal<boolean>(false);
  
  // ✅ Cooldown state
  cooldownSecondsLeft = signal<number>(0);
  cooldownModalMessage = signal<string>('');
  private cooldownTimer: any;
  
  // ✅ Pagination state
  currentPage = signal(1);
  pageSize = 10;
  
  // ✅ Filter state (PRIMITIVES)
  searchKeyword = '';
  searchMinKarma = 20;
  expertCommentsMinKarma = 50;
  filterRole = '';
  filterSince: string = '';
  
  // ✅ Form state (PRIMITIVES)
  newPostTitle = '';
  newPostContent = '';
  newCommentContent = '';
  
  // ✅ ML state
  mlAnalysis = signal<MlPrediction | null>(null);
  commentMlAnalysis = signal<MlPrediction | null>(null);
  isCheckingMl = signal<boolean>(false);
  isCheckingCommentMl = signal<boolean>(false);
  
  // ✅ Spam modal state
  spamModalMessage = '';
  
  // ✅ Anti-spam cooldown
  private lastPostTime = 0;
  private lastCommentTime = 0;
  private readonly COOLDOWN_MS = 30000;
  
  // ✅ Debounce timers
  private mlCheckTimeout: any;
  private commentMlCheckTimeout: any;
  
  // ✅ RxJS subscriptions
  private subscriptions = new Subscription();
  
  // ✅ Cache keys
  private readonly CONTRIBUTORS_CACHE_KEY = 'top_contributors_cache';
  private readonly CONTRIBUTORS_CACHE_TIME_KEY = 'top_contributors_cache_time';
  private readonly RECS_FEEDBACK_KEY = 'recommendations_feedback';
  private readonly CACHE_DURATION = 30000;
  
  // ✅ Post counts cache (pour afficher dans hover)
  private postCountsCache = new Map<number, number>();
  
  commonEmojis = ['😀', '😂', '', '🙌', '🔥', '✨', '⛺', '🌲', '🏔️', '🎒', '🪵', '🔦', '', '🗺️'];

  ngOnInit() {
    this.checkMlHealth();
    this.loadPosts();
    this.loadContributors();
    this.loadUserStats();
    this.loadRecommendations();
    this.startLiveUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  // ==================== ML Service ====================
  private checkMlHealth(): void {
    this.mlService.isMlServiceHealthy().subscribe({
      next: (res) => { this.mlHealthy.set(res.model_loaded); },
      error: () => { this.mlHealthy.set(false); }
    });
  }

  getMlStatusMessage(): string {
    const analysis = this.mlAnalysis();
    if (!analysis) return '';
    if (analysis.is_spam) {
      return analysis.has_bad_words ? '⚠️ Contains inappropriate language' : '⚠️ Looks like spam - please review';
    }
    return '✅ Ready to publish';
  }

  getCommentMlStatusMessage(): string {
    const analysis = this.commentMlAnalysis();
    if (!analysis) return '';
    if (analysis.is_spam) {
      return analysis.has_bad_words ? 'Inappropriate language detected' : 'May be spam - please review';
    }
    return 'Looks good';
  }

  onContentChange(): void {
    if (this.mlCheckTimeout) clearTimeout(this.mlCheckTimeout);
    this.mlCheckTimeout = setTimeout(() => {
      const content = this.newPostContent.trim();
      if (content.length < 10) { this.mlAnalysis.set(null); return; }
      this.isCheckingMl.set(true);
      this.mlService.checkContent(content).subscribe({
        next: (result) => { this.mlAnalysis.set(result); this.isCheckingMl.set(false); },
        error: () => {
          const hasBad = /spam|fuck|shit|merde|putain/i.test(content);
          this.mlAnalysis.set({
            is_spam: hasBad, confidence: hasBad ? 0.8 : 0.2,
            reason: hasBad ? 'Potential inappropriate content' : 'Content looks good',
            method: 'Client-side fallback', bad_words_detected: hasBad ? ['filtered'] : [], has_bad_words: hasBad
          });
          this.isCheckingMl.set(false);
        }
      });
    }, 500);
  }

  onCommentChange(): void {
    if (this.commentMlCheckTimeout) clearTimeout(this.commentMlCheckTimeout);
    this.commentMlCheckTimeout = setTimeout(() => {
      const content = this.newCommentContent.trim();
      if (content.length < 5) { this.commentMlAnalysis.set(null); return; }
      this.isCheckingCommentMl.set(true);
      this.mlService.checkContent(content).subscribe({
        next: (result) => { this.commentMlAnalysis.set(result); this.isCheckingCommentMl.set(false); },
        error: () => {
          const hasBad = /spam|fuck|shit|merde|putain/i.test(content);
          this.commentMlAnalysis.set({
            is_spam: hasBad, confidence: hasBad ? 0.8 : 0.2,
            reason: hasBad ? 'Potential inappropriate content' : 'Content looks good',
            method: 'Client-side fallback', bad_words_detected: hasBad ? ['filtered'] : [], has_bad_words: hasBad
          });
          this.isCheckingCommentMl.set(false);
        }
      });
    }, 300);
  }

  canSubmitPost(): boolean {
    const content = this.newPostContent.trim();
    const title = this.newPostTitle.trim();
    if (!title || !content) return false;
    if (this.isCheckingMl()) return false;
    const analysis = this.mlAnalysis();
    if (analysis?.is_spam) return false;
    return true;
  }

  canSubmitComment(): boolean {
    const content = this.newCommentContent.trim();
    if (!content) return false;
    if (this.isCheckingCommentMl()) return false;
    const analysis = this.commentMlAnalysis();
    if (analysis?.is_spam) return false;
    return true;
  }

  // ==================== Pagination Logic ====================
  get totalPages(): number {
    return Math.ceil(this.allPosts().length / this.pageSize) || 1;
  }

  shouldShowPagination(): boolean {
    return this.allPosts().length > this.pageSize;
  }

  getStartIndex(): number {
    return ((this.currentPage() - 1) * this.pageSize) + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage() * this.pageSize;
    return Math.min(end, this.allPosts().length);
  }

  updatePaginatedPosts(): void {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedPosts.set(this.allPosts().slice(start, end));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage.set(page);
    this.updatePaginatedPosts();
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  // ==================== Advanced Filters ====================
  searchExpertPosts(): void {
    this.currentPage.set(1);
    if (!this.searchKeyword.trim() && this.searchMinKarma === 0) { this.loadPosts(); return; }
    this.forumService.searchHighQualityPosts(this.searchKeyword, this.searchMinKarma).subscribe({
      next: (res) => { 
        this.allPosts.set(res); 
        this.updatePaginatedPosts(); 
      },
      error: (err) => console.error('❌ Expert search failed:', err)
    });
  }

  filterByRoleAndDate(): void {
    this.currentPage.set(1);
    if (!this.filterRole && !this.filterSince) { this.loadPosts(); return; }
    const since = this.filterSince ? new Date(this.filterSince) : new Date('2020-01-01');
    this.forumService.getPostsByRoleAndDate(this.filterRole as any, since).subscribe({
      next: (res) => { 
        this.allPosts.set(res); 
        this.updatePaginatedPosts(); 
      },
      error: (err) => console.error('❌ Role+date filter failed:', err)
    });
  }

  toggleExpertComments(): void {
    const newState = !this.showExpertComments();
    this.showExpertComments.set(newState);
    
    if (newState && this.expertComments().length === 0) {
      const since = new Date();
      since.setMonth(since.getMonth() - 1);
      this.forumService.getExpertComments(this.expertCommentsMinKarma, since).subscribe({
        next: (res) => { this.expertComments.set(res); },
        error: (err) => {
          console.error('❌ Expert comments failed:', err);
          this.expertComments.set([]);
        }
      });
    }
  }

  // ==================== Cooldown Modal ====================
  showCooldownNotification(seconds: number): void {
    this.cooldownSecondsLeft.set(seconds);
    this.cooldownModalMessage.set(`Please wait ${seconds} seconds before posting again. Quality contributions take time!`);
    this.showCooldownModal.set(true);
    
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      const current = this.cooldownSecondsLeft();
      if (current > 0) {
        this.cooldownSecondsLeft.set(current - 1);
      } else {
        clearInterval(this.cooldownTimer);
      }
    }, 1000);
  }

  closeCooldownModal(): void {
    this.showCooldownModal.set(false);
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  getCooldownProgress(): number {
    const total = 30;
    const remaining = this.cooldownSecondsLeft();
    return ((total - remaining) / total) * 100;
  }

  // ==================== Bad Words Modal ====================
  showBadWordsNotification(): void {
    this.showBadWordsModal.set(true);
  }

  closeBadWordsModal(): void {
    this.showBadWordsModal.set(false);
  }

  editPostAfterBadWords(): void {
    this.closeBadWordsModal();
    this.showNewPostForm.set(true);
    setTimeout(() => {
      const textarea = document.querySelector('.content-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 150);
  }

  // ==================== ✅ ADVANCED TOP CONTRIBUTORS - CORRIGÉ ====================
  
  private updateInterval: Subscription | null = null;
  
  private loadContributors(): void {
    // Check cache first
    const cached = this.getCachedContributors();
    if (cached) {
      this.contributors.set(cached);
      this.lastUpdateTime.set(new Date(localStorage.getItem(this.CONTRIBUTORS_CACHE_TIME_KEY)!));
      this.loadingContributors.set(false);
      return;
    }

    const sub = this.forumService.getTopContributors(10).pipe(
      shareReplay({ bufferSize: 1, refCount: true, windowTime: this.CACHE_DURATION }),
      catchError(err => {
        console.error('Failed to load contributors:', err);
        return of([]);
      })
    ).subscribe(data => {
      const contributors: Contributor[] = data.map((user: any, index: number) => ({
        id: user.id,
        fullName: user.fullName,
        karma: user.karma,
        rank: index + 1,
        previousRank: this.getPreviousRank(user.id),
        avatar: user.avatar,
        joinDate: user.createdAt,
        postCount: user.postCount
      }));

      this.contributors.set(contributors);
      this.lastUpdateTime.set(new Date());
      this.cacheContributors(contributors);
      this.loadingContributors.set(false);
    });
    
    this.subscriptions.add(sub);
  }

  private startLiveUpdates(): void {
    this.updateInterval = timer(0, 45000).subscribe(() => {
      this.isLiveUpdating.set(true);
      setTimeout(() => {
        this.loadContributors();
        this.isLiveUpdating.set(false);
      }, 800);
    });
    this.subscriptions.add(this.updateInterval);
  }

  private getPreviousRank(userId: number): number {
    const cached = this.getCachedContributors();
    if (!cached) return 0;
    const existing = cached.find(c => c.id === userId);
    return existing ? existing.rank : 0;
  }

  // ✅ NOUVELLE MÉTHODE pour récupérer le post count
  getContributorPostCount(userId: number): number {
    // D'abord vérifier le cache
    if (this.postCountsCache.has(userId)) {
      return this.postCountsCache.get(userId)!;
    }
    
    // Sinon chercher dans les contributeurs
    const contributor = this.contributors().find(c => c.id === userId);
    if (contributor && contributor.postCount !== undefined) {
      this.postCountsCache.set(userId, contributor.postCount);
      return contributor.postCount;
    }
    
    // Par défaut 0
    return 0;
  }

  getAvatar(contributor: Contributor): string {
    return contributor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contributor.fullName)}&background=6366f1&color=fff`;
  }

  private getCachedContributors(): Contributor[] | null {
    const cached = localStorage.getItem(this.CONTRIBUTORS_CACHE_KEY);
    const cacheTime = localStorage.getItem(this.CONTRIBUTORS_CACHE_TIME_KEY);
    
    if (!cached || !cacheTime) return null;
    
    const age = Date.now() - parseInt(cacheTime);
    if (age > this.CACHE_DURATION) {
      localStorage.removeItem(this.CONTRIBUTORS_CACHE_KEY);
      localStorage.removeItem(this.CONTRIBUTORS_CACHE_TIME_KEY);
      return null;
    }
    
    return JSON.parse(cached);
  }

  private cacheContributors(contributors: Contributor[]): void {
    localStorage.setItem(this.CONTRIBUTORS_CACHE_KEY, JSON.stringify(contributors));
    localStorage.setItem(this.CONTRIBUTORS_CACHE_TIME_KEY, Date.now().toString());
  }

  // ==================== ✅ ADVANCED RECOMMENDATIONS - CORRIGÉ ====================
  
  private loadRecommendations(): void {
    const userStr = localStorage.getItem('camp_user');
    if (!userStr) {
      console.log('⚠️ No user logged in, skipping recommendations');
      this.loadingRecommendations.set(false);
      return;
    }
    
    const userId = JSON.parse(userStr).id;
    console.log('🔍 Loading recommendations for userId:', userId);
    
    // Essayer d'abord le service ML, fallback sur trending posts
    const sub = this.mlService.getRecommendations(userId).pipe(
      map(posts => {
        console.log('✅ ML recommendations received:', posts);
        // S'assurer que c'est un tableau
        if (!Array.isArray(posts)) {
          console.warn('⚠️ Recommendations is not an array:', posts);
          return [];
        }
        return posts;
      }),
      catchError(err => {
        console.warn('⚠️ ML recommendations failed, falling back to trending:', err);
        return this.forumService.getTrendingPosts();
      })
    ).subscribe(posts => {
      console.log('📊 Processing', posts.length, 'posts for recommendations');
      
      const enriched: Recommendation[] = posts.map((post: any) => ({
        ...post,
        score: this.calculateRelevanceScore(post),
        reason: this.getRecommendationReason(post),
        userFeedback: this.getStoredFeedback(post.id)
      }));

      const sorted = enriched.sort((a, b) => {
        if (a.userFeedback === 'dislike') return 1;
        if (b.userFeedback === 'dislike') return -1;
        if (a.userFeedback === 'like') return -1;
        if (b.userFeedback === 'like') return 1;
        return b.score - a.score;
      });

      console.log('✅ Recommendations loaded:', sorted.length);
      this.recommendations.set(sorted.slice(0, 6));
      this.loadingRecommendations.set(false);
    });
    
    this.subscriptions.add(sub);
  }

  private calculateRelevanceScore(post: any): number {
    const karmaWeight = 0.4;
    const recencyWeight = 0.3;
    const engagementWeight = 0.3;

    const karmaScore = Math.min(post.authorKarma || 0, 100) / 100;
    const daysOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysOld / 30);
    const engagementScore = Math.min((post.commentCount || 0) / 10, 1);

    return (karmaScore * karmaWeight) + (recencyScore * recencyWeight) + (engagementScore * engagementWeight);
  }

  private getRecommendationReason(post: any): string {
    const reasons: string[] = [];
    if ((post.authorKarma || 0) > 50) reasons.push('High karma author');
    if ((post.commentCount || 0) > 5) reasons.push('Popular discussion');
    const daysOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 1) reasons.push('Recent');
    return reasons.length > 0 ? reasons.join(' • ') : 'Trending';
  }

  onRecommendationFeedback(rec: Recommendation, type: 'like' | 'dislike'): void {
    const current = rec.userFeedback;
    rec.userFeedback = current === type ? null : type;
    
    this.recommendations.update(recs => {
      const index = recs.findIndex(r => r.id === rec.id);
      if (index !== -1) {
        recs[index] = { ...rec };
      }
      return [...recs];
    });

    this.storeFeedback(rec.id, rec.userFeedback);
    setTimeout(() => this.reorderRecommendations(), 500);
  }

  private reorderRecommendations(): void {
    const recs = this.recommendations();
    const sorted = [...recs].sort((a, b) => {
      if (a.userFeedback === 'dislike') return 1;
      if (b.userFeedback === 'dislike') return -1;
      if (a.userFeedback === 'like') return -1;
      if (b.userFeedback === 'like') return 1;
      return b.score - a.score;
    });
    this.recommendations.set(sorted);
  }

  private storeFeedback(postId: number, feedback: 'like' | 'dislike' | null): void {
    const allFeedback = this.getAllFeedback();
    if (feedback === null) {
      delete allFeedback[postId];
    } else {
      allFeedback[postId] = feedback;
    }
    localStorage.setItem(this.RECS_FEEDBACK_KEY, JSON.stringify(allFeedback));
  }

  private getStoredFeedback(postId: number): 'like' | 'dislike' | null {
    const allFeedback = this.getAllFeedback();
    return allFeedback[postId] || null;
  }

  private getAllFeedback(): Record<number, 'like' | 'dislike'> {
    const stored = localStorage.getItem(this.RECS_FEEDBACK_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  // ==================== Posts ====================
  loadPosts() {
    this.searchKeyword = '';
    this.searchMinKarma = 0;
    this.forumService.findAllPosts().subscribe({
      next: (res) => {
        console.log('✅ Posts loaded:', res);
        this.allPosts.set(res);
        this.currentPage.set(1);
        this.updatePaginatedPosts();
      },
      error: (err) => console.error('❌ Failed to load posts:', err)
    });
  }

  // ✅ isAuthor robuste avec try/catch
  isAuthor(authorId: number): boolean {
    try {
      const userStr = localStorage.getItem('camp_user');
      if (!userStr) return false;
      const user = JSON.parse(userStr);
      return user?.id === authorId;
    } catch {
      return false;
    }
  }

  // ✅ deletePost comme avant - robuste et fonctionnel
  deletePost(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('Delete this topic permanently?')) {
      this.forumService.deletePost(id).subscribe({
        next: () => {
          // Recharger les posts pour refléter la suppression
          this.loadPosts();
        },
        error: (err) => {
          console.error('❌ Failed to delete post:', err);
          // Gestion d'erreur robuste
          const errorMsg = err?.error?.message || err?.message || 'An unknown error occurred';
          alert('Failed to delete: ' + errorMsg);
        }
      });
    }
  }

  // ==================== User Stats ====================
  loadUserStats(): void {
    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;
    try {
      const userId = JSON.parse(userStr).id;
      this.forumService.getUserForumStats(userId).subscribe({
        next: (stats) => this.userStats.set(stats),
        error: (err) => console.warn('⚠️ Could not load user stats:', err)
      });
    } catch {
      console.warn('⚠️ Failed to parse user from localStorage');
    }
  }

  // ==================== Trending Posts ====================
  loadTrendingPosts() {
    this.forumService.getTrendingPosts().subscribe({
      next: (res) => this.trendingPosts.set(res),
      error: (err) => console.warn('⚠️ Trending posts unavailable')
    });
  }

  openPostById(postId: number) {
    this.forumService.getPostById(postId).subscribe({
      next: (res) => { if (res) { this.activePost.set(res); this.loadComments(res.id); } },
      error: (err) => alert('Failed to load post: ' + err.message)
    });
  }

  // ==================== New Post ====================
  toggleNewPostForm() {
    if (!this.authService.isLoggedIn()) {
      alert('You must be logged in to create a topic.');
      this.router.navigate(['/login']);
      return;
    }
    this.showNewPostForm.set(!this.showNewPostForm());
    if (!this.showNewPostForm()) {
      this.newPostTitle = '';
      this.newPostContent = '';
      this.mlAnalysis.set(null);
    }
  }

  submitPost() {
    const now = Date.now();
    const timeSinceLastPost = now - this.lastPostTime;
    
    if (timeSinceLastPost < this.COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((this.COOLDOWN_MS - timeSinceLastPost) / 1000);
      this.showCooldownNotification(remainingSeconds);
      return;
    }
    
    const analysis = this.mlAnalysis();
    if (analysis?.is_spam) {
      if (analysis.has_bad_words) {
        this.showBadWordsNotification();
      } else {
        this.showSpamModal.set(true);
        this.spamModalMessage = 'Our system detected that your post might be spam. Please make sure your content is relevant and helpful to the community.';
      }
      return;
    }
    if (!this.canSubmitPost()) return;
    
    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const payload = { authorId: Number(user.id), title: this.newPostTitle.trim(), content: this.newPostContent.trim() };
    
    this.forumService.createPost(payload).subscribe({
      next: () => {
        this.newPostTitle = '';
        this.newPostContent = '';
        this.mlAnalysis.set(null);
        this.showNewPostForm.set(false);
        this.lastPostTime = Date.now();
        this.loadPosts();
        this.loadUserStats();
      },
      error: (err: any) => {
        console.error('❌ Failed to create post:', err);
        
        if (err?.status === 400) {
          const errorMessage = err?.error?.message || err?.error || '';
          if (errorMessage.toLowerCase().includes('inappropriate language') || 
              errorMessage.toLowerCase().includes('bad words') ||
              errorMessage.toLowerCase().includes('offensive')) {
            this.showBadWordsNotification();
          } else {
            this.showSpamModal.set(true);
            this.spamModalMessage = errorMessage || 'Please review your content and try again.';
          }
        } else if (err?.status === 0) {
          alert('Cannot connect to server. Please check your internet connection.');
        } else {
          alert('Failed to create post. Please try again.');
        }
      }
    });
  }

  closeSpamModal(): void {
    this.showSpamModal.set(false);
    this.spamModalMessage = '';
  }

  editPostAfterSpam(): void {
    this.closeSpamModal();
    this.showNewPostForm.set(true);
    setTimeout(() => {
      const textarea = document.querySelector('.content-input') as HTMLTextAreaElement;
      if (textarea) { textarea.focus(); textarea.select(); }
    }, 150);
  }

  // ==================== Comments ====================
  openPost(post: ForumPost) {
    this.activePost.set(post);
    this.loadComments(post.id);
  }

  loadComments(postId: number) {
    this.forumService.getCommentsByPostId(postId).subscribe({
      next: (res) => this.comments.set(res),
      error: (err) => console.error('Failed to load comments:', err)
    });
  }

  deleteComment(id: number) {
    if (confirm('Remove this comment?')) {
      this.forumService.deleteComment(id).subscribe({
        next: () => { if (this.activePost()) { this.loadComments(this.activePost()!.id); } },
        error: (err) => alert('Failed to delete: ' + err.message)
      });
    }
  }

  submitComment() {
    const now = Date.now();
    if (now - this.lastCommentTime < this.COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((this.COOLDOWN_MS - (now - this.lastCommentTime)) / 1000);
      this.showCooldownNotification(remainingSeconds);
      return;
    }
    
    const analysis = this.commentMlAnalysis();
    if (analysis?.is_spam) {
      if (analysis.has_bad_words) {
        this.showBadWordsNotification();
      } else {
        this.showSpamModal.set(true);
        this.spamModalMessage = 'Our system detected that your comment might be spam. Please make sure your content is relevant.';
      }
      return;
    }
    if (!this.canSubmitComment()) return;
    
    const userStr = localStorage.getItem('camp_user');
    if (!userStr) { 
      alert('You must be logged in to reply.'); 
      this.router.navigate(['/login']); 
      return; 
    }
    
    const user = JSON.parse(userStr);
    const activeId = this.activePost()?.id;
    const payload = { postId: activeId, authorId: Number(user.id), content: this.newCommentContent.trim() };
    
    this.forumService.addComment(payload).subscribe({
      next: () => {
        this.newCommentContent = '';
        this.commentMlAnalysis.set(null);
        this.lastCommentTime = Date.now();
        this.loadComments(activeId!);
        this.loadUserStats();
      },
      error: (err: any) => {
        console.error('Failed to post comment:', err);
        
        if (err?.status === 400) {
          const errorMessage = err?.error?.message || '';
          if (errorMessage.toLowerCase().includes('inappropriate language') || 
              errorMessage.toLowerCase().includes('bad words')) {
            this.showBadWordsNotification();
          } else {
            alert(err?.error?.message || 'Please review your comment and try again.');
          }
        } else if (err?.status === 0) {
          alert('Cannot connect to server. Please check your connection.');
        } else {
          alert('Failed to post comment. Please try again.');
        }
      }
    });
  }
}