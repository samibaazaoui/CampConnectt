import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../services/forum';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-front-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hero-section">
      <h1 class="hero-title">Community Basecamp.</h1>
      <p class="hero-subtitle">Connect with other explorers, share your camping experiences, and ask questions before your next excursion.</p>
    </div>

    <section class="section-block">
      <!-- Create Post Header -->
      <div class="forum-header">
        <div>
          <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 0.5rem;"><i class="fa-solid fa-comments"></i> Discussion Board</h2>
          <p style="color: #64748b; font-size: 0.95rem;">Join the conversation with fellow adventurers.</p>
        </div>
        <button class="btn-action" (click)="toggleNewPostForm()">
           <span *ngIf="!showNewPostForm()"><i class="fa-solid fa-pen"></i> New Topic</span>
           <span *ngIf="showNewPostForm()"><i class="fa-solid fa-xmark"></i> Cancel</span>
        </button>
      </div>

      <!-- New Post Form Area -->
      <div class="new-post-container animate-slide-up" *ngIf="showNewPostForm()">
        <input type="text" [(ngModel)]="newPostTitle" placeholder="Thread Title (e.g. Tips for Majestic Forest?)" class="input-base title-input">
        <div class="emoji-bar">
          <span *ngFor="let e of commonEmojis" (click)="newPostContent += e" class="emoji-btn">{{ e }}</span>
        </div>
        <textarea [(ngModel)]="newPostContent" placeholder="Write your post content here..." class="input-base content-input" rows="4"></textarea>
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <button class="btn-action" style="max-width: 150px; background: #6366f1;" (click)="submitPost()" [disabled]="!newPostTitle || !newPostContent">Publish Topic</button>
        </div>
      </div>

      <!-- Main Posts Board -->
      <div class="posts-board" *ngIf="!activePost()">
        <div class="post-card animate-fade-in" *ngFor="let post of posts()" (click)="openPost(post)">
           <div class="post-stats">
             <div class="stat-box"><i class="fa-solid fa-message"></i></div>
           </div>
           <div class="post-summary">
             <h3 class="post-title">{{ post.title }}</h3>
             <p class="post-preview">{{ post.content | slice:0:120 }}...</p>
             <div class="post-meta">
                <span class="author"><i class="fa-regular fa-user"></i> {{ post.authorName }}</span>
                <span class="date"><i class="fa-regular fa-clock"></i> {{ post.createdAt | date:'medium' }}</span>
             </div>
           </div>
        </div>
        
        <div *ngIf="posts().length === 0" style="text-align:center; padding: 4rem; color: #94a3b8; background: white; border-radius: 1rem; border: 1px dashed #cbd5e1;">
          <i class="fa-solid fa-wind fa-3x" style="color: #e2e8f0; margin-bottom: 1rem;"></i>
          <p>The basecamp is quiet. Be the first to start a conversation!</p>
        </div>
      </div>

      <!-- Active Post & Comments View -->
      <div class="active-post-view animate-fade-in" *ngIf="activePost()">
         <button class="btn-back" (click)="activePost.set(null)"><i class="fa-solid fa-arrow-left"></i> Back to Board</button>
         
         <div class="original-post">
           <h2 class="op-title">{{ activePost()?.title }}</h2>
           <div class="post-meta" style="margin-bottom: 1.5rem;">
                <span class="author"><i class="fa-solid fa-user-astronaut"></i> {{ activePost()?.authorName }}</span>
                <span class="date">{{ activePost()?.createdAt | date:'long' }}</span>
           </div>
           <p class="op-content">{{ activePost()?.content }}</p>
         </div>

         <div class="comments-section">
           <h4 class="comments-header"><i class="fa-regular fa-comments"></i> Responses</h4>
           
           <div class="comment-thread">
             <div class="comment-card" *ngFor="let c of comments()">
                <div class="comment-meta">
                   <strong>{{ c.authorName }}</strong>
                   <span style="color: #94a3b8; font-size: 0.8rem;">{{ c.createdAt | date:'short' }}</span>
                </div>
                <p class="comment-text">{{ c.content }}</p>
             </div>
             <p *ngIf="comments().length === 0" style="color: #94a3b8; font-style: italic; padding: 1rem;">No replies yet.</p>
           </div>

           <div class="reply-box">
             <div class="emoji-bar" style="margin-bottom: 0.25rem;">
               <span *ngFor="let e of commonEmojis" (click)="newCommentContent += e" class="emoji-btn">{{ e }}</span>
             </div>
             <textarea [(ngModel)]="newCommentContent" placeholder="Write a response..." class="input-base content-input" rows="3" style="margin-bottom: 0.5rem;"></textarea>
             <button class="btn-action" style="max-width: 120px;" (click)="submitComment()" [disabled]="!newCommentContent">Reply</button>
           </div>
         </div>
      </div>

    </section>
  `,
  styles: [`
    .hero-section { text-align: center; padding: 4rem 2rem; }
    .hero-title { font-size: 3.5rem; font-weight: 900; color: #0f172a; margin-bottom: 1rem; letter-spacing: -0.05em;}
    .hero-subtitle { font-size: 1.25rem; color: #64748b; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    .section-block { max-width: 960px; margin: 0 auto 5rem; }
    
    .forum-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #f1f5f9; }
    .btn-action { padding: 0.75rem 1.5rem; background: #0f172a; color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-action:hover:not(:disabled) { background: #334155; transform: translateY(-2px); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .new-post-container { background: white; padding: 1.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; margin-bottom: 2rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .input-base { width: 100%; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 1rem; font-family: inherit; font-size: 1rem; outline: none; transition: 0.2s; }
    .input-base:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
    .title-input { font-weight: 700; margin-bottom: 1rem; }
    .content-input { resize: vertical; }

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

    /* Active Post */
    .btn-back { background: transparent; border: none; color: #64748b; font-weight: 600; cursor: pointer; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
    .btn-back:hover { color: #0f172a; }
    .original-post { background: white; padding: 2.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; margin-bottom: 2rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .op-title { font-size: 2rem; font-weight: 900; margin-bottom: 0.75rem; color: #0f172a; letter-spacing: -0.02em;}
    .op-content { color: #334155; line-height: 1.8; font-size: 1.1rem; white-space: pre-wrap; }
    
    .comments-section { background: #f8fafc; border-radius: 1rem; padding: 2rem; border: 1px solid #e2e8f0; }
    .comments-header { margin: 0 0 1.5rem; color: #0f172a; font-size: 1.25rem; font-weight: 800; }
    .comment-thread { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
    .comment-card { background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; }
    .comment-meta { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .comment-text { margin: 0; color: #475569; line-height: 1.6; }
    
    .reply-box { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; width: 100%; }
    
    .emoji-bar { display: flex; gap: 0.5rem; padding: 0.5rem 0; flex-wrap: wrap; width: 100%; }
    .emoji-btn { cursor: pointer; font-size: 1.25rem; transition: transform 0.2s; padding: 0.25rem; border-radius: 0.25rem; }
    .emoji-btn:hover { background: rgba(99,102,241,0.1); transform: scale(1.2); }
  `]
})
export class FrontForumPage implements OnInit {
  private forumService = inject(ForumService);
  private authService = inject(AuthService);
  private router = inject(Router);

  posts = signal<any[]>([]);
  showNewPostForm = signal<boolean>(false);
  activePost = signal<any | null>(null);
  comments = signal<any[]>([]);

  newPostTitle = '';
  newPostContent = '';
  newCommentContent = '';
  
  commonEmojis = ['😀', '😂', '😍', '🙌', '🔥', '✨', '⛺', '🌲', '🏔️', '🎒', '🪵', '🔦', '🥘', '🗺️'];

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.forumService.findAllPosts().subscribe((res: any) => {
      this.posts.set(res?.data || []);
    });
  }

  toggleNewPostForm() {
    if (!this.authService.isLoggedIn()) {
      alert("You must be logged in to create a topic.");
      this.router.navigate(['/login']);
      return;
    }
    this.showNewPostForm.set(!this.showNewPostForm());
  }

  submitPost() {
    const userStr = localStorage.getItem('camp_user');
    if (!userStr || !this.newPostTitle || !this.newPostContent) return;
    
    const userId = JSON.parse(userStr).id;
    const payload = {
      authorId: userId,
      title: this.newPostTitle,
      content: this.newPostContent
    };

    this.forumService.createPost(payload).subscribe({
      next: () => {
        this.newPostTitle = '';
        this.newPostContent = '';
        this.showNewPostForm.set(false);
        this.loadPosts();
      },
      error: (err) => console.error(err)
    });
  }

  openPost(post: any) {
    this.activePost.set(post);
    this.loadComments(post.id);
  }

  loadComments(postId: number) {
    this.forumService.getCommentsByPostId(postId).subscribe((res: any) => {
      this.comments.set(res?.data || []);
    });
  }

  submitComment() {
    const userStr = localStorage.getItem('camp_user');
    if (!userStr || !this.newCommentContent) {
      alert("You must be logged in to reply.");
      this.router.navigate(['/login']);
      return;
    }

    const userId = JSON.parse(userStr).id;
    const activeId = this.activePost()?.id;
    
    const payload = {
      postId: activeId,
      authorId: userId,
      content: this.newCommentContent
    };

    this.forumService.addComment(payload).subscribe({
      next: () => {
        this.newCommentContent = '';
        this.loadComments(activeId);
      },
      error: (err) => console.error(err)
    });
  }
}
