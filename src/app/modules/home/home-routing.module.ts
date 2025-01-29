import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Roles } from 'src/app/enums/role.enum';
import { RoleGuard } from 'src/app/guards/role/role.guard';
import { AdministrationComponent } from './administration/administration.component';
import { HomeComponent } from './home.component';


const routes: Routes = [{
  path: '',
  component: HomeComponent,
  children: [{
    path: 'candidates',
    loadChildren: () => import('./candidates/candidates.module').then(m => m.CandidatesModule),
  }, {
    path: 'candidate-repository',
    loadChildren: () => import('./candidate-repository/candidate-repository.module').then(m => m.CandidateRepositoryModule),
  }, {
    path: 'groups',
    loadChildren: () => import('./group/group.module').then(m => m.GroupModule),
  }, {
    path: 'users',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
  }, {
    path: 'client',
    loadChildren: () => import('./clients/clients.module').then(m => m.ClientsModule),
  }, {
    path: 'interviewers',
    loadChildren: () => import('./interviewers/interviewers.module').then(m => m.InterviewersModule),
  }, {
    path: 'job-descriptions',
    loadChildren: () => import('./job-descriptions/job-descriptions.module').then(m => m.JobDescriptionsModule),
  }, {
    path: 'reports',
    loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule),
  },

  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
  },

  {
    path: 'vendors',
    loadChildren: () => import('./vendors/vendors.module').then(m => m.VendorsModule),
  }, {
    path: 'campaign',
    loadChildren: () => import('./campaign/campaign.module').then(m => m.CampaignModule),
  }, {
    path: 'interviews',
    loadChildren: () => import('./interviews/interviews.module').then(m => m.InterviewsModule),
  },
  {
    path: 'administration',
    component: AdministrationComponent,
    //loadChildren: () => import('././../../home/vendor/email-template/email-template.module').then(m => m.EmailTemplateModule),
  }, {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  }]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
