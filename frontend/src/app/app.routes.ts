import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { DashboardLayout } from './components/dashboard-layout/dashboard-layout';
import { Pedidos } from './pages/pedidos/pedidos';
import { Lotes } from './pages/lotes/lotes';
import { Resumen } from './pages/resumen/resumen';
import { Catalogo } from './pages/catalogo/catalogo';
import { CalculadoraComponent } from './pages/calculadora/calculadora';
import { Stock } from './pages/stock/stock';
import { MaquinasComponent } from './pages/maquinas/maquinas';
import { Finanzas } from './pages/finanzas/finanzas';
import { Clientes } from './pages/clientes/clientes';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'pedidos', pathMatch: 'full' },
      { path: 'pedidos', component: Pedidos },
      { path: 'lotes', component: Lotes },
      { path: 'resumen', component: Resumen },
      { path: 'catalogo', component: Catalogo },
      { path: 'calculadora', component: CalculadoraComponent },
      { path: 'stock', component: Stock },
      { path: 'maquinas', component: MaquinasComponent },
      { path: 'finanzas', component: Finanzas },
      { path: 'clientes', component: Clientes }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
