import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientTableComponent } from './client-table/client-table.component';
import { ClientsComponent } from './clients.component';


const routes: Routes = [{
    path: '',
    component: ClientsComponent
},
{
    path: 'map-fields',
    component: ClientTableComponent
},

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ClientsRoutingModule { }
