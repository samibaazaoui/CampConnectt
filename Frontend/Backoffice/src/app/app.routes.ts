import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { AdminLayoutComponent } from './layouts/admin';
import { FrontLayoutComponent } from './layouts/front';
import { adminGuard } from './guards/admin-guard';

import { FrontHomePage } from './pages/front-home/front-home';
import { FrontEventsPage } from './pages/front-events/front-events';
import { FrontForumPage } from './pages/front-forum/front-forum';
import { FrontEquipmentPage } from './pages/front-equipment/front-equipment';
import { FrontChatPage } from './pages/front-chat/front-chat';
import { FrontProfilePage } from './pages/front-profile/front-profile';

import { DashboardComponent } from './pages/dashboard/dashboard';
import { CampsitesComponent } from './pages/campsites/campsites';
import { ReservationsComponent } from './pages/reservations/reservations';
import { EquipmentComponent } from './pages/equipment/equipment';
import { UsersComponent } from './pages/users/users';
import { EventsComponent } from './pages/events/events';
import { ActivitiesComponent } from './pages/activities/activities';
import { OrdersComponent } from './pages/orders/orders';
import { CustomersComponenet } from './customers/customers';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: FrontLayoutComponent,
    children: [
      { path: '', component: FrontHomePage },
      { path: 'explore-events', component: FrontEventsPage },
      { path: 'forum', component: FrontForumPage },
      { path: 'shop', component: FrontEquipmentPage },
      { path: 'chat', component: FrontChatPage },
      { path: 'profile', component: FrontProfilePage }
    ]
  },
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'campsites', component: CampsitesComponent },
      { path: 'reservations', component: ReservationsComponent },
      { path: 'equipment', component: EquipmentComponent },
      { path: 'users', component: UsersComponent },
      {path: 'customers',component:CustomersComponenet},
      { path: 'events', component: EventsComponent },
      { path: 'activities', component: ActivitiesComponent },
      { path: 'orders', component: OrdersComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
