import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player } from '../interfaces/player';
import { PlayerRequest } from '../interfaces/player-request';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getAllPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.apiUrl}/players`);
  }

  getPlayerById(id: string): Observable<Player> {
    return this.http.get<Player>(`${this.apiUrl}/player/${id}`);
  }

  addPlayer(player: PlayerRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/player`, player);
  }

  updatePlayerPoints(id: string, points: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/player/${id}?points=${points}`, {});
  }

  deletePlayer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/player/${id}`);
  }

  simulateMatch(player1Id: string, player2Id: string): Observable<Player[]> {
    return this.http.post<Player[]>(`${this.apiUrl}/players/match?player1Id=${player1Id}&player2Id=${player2Id}`, {});
  }
}
