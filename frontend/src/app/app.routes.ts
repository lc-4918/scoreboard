import { Routes } from '@angular/router';
import { PlayerListComponent } from './components/player-list/player-list.component';
import { MatchSimulatorComponent } from './components/match-simulator/match-simulator.component';

export const routes: Routes = [
  { path: '', redirectTo: '/players', pathMatch: 'full' },
  { path: 'players', component: PlayerListComponent },
  { path: 'simulator', component: MatchSimulatorComponent },
  { path: '**', redirectTo: '/players' } // Route de secours
];
