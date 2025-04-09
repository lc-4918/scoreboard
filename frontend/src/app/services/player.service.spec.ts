import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PlayerService } from './player.service';
import { Player } from '../interfaces/player';
import { PlayerRequest } from '../interfaces/player-request';

describe('PlayerService', () => {
  let service: PlayerService;
  let httpMock: HttpTestingController;

  const mockPlayers: Player[] = [
    { id: '1', username: 'Joueur1', points: 100, ranking: 1, avatar: 'avatar1.png' },
    { id: '2', username: 'Joueur2', points: 90, ranking: 2, avatar: 'avatar2.png' },
    { id: '3', username: 'Joueur3', points: 80, ranking: 3, avatar: 'avatar3.png' }
  ];

  const mockPlayer: Player = { 
    id: '1', 
    username: 'Joueur1', 
    points: 100, 
    ranking: 1, 
    avatar: 'avatar1.png' 
  };

  const newPlayerRequest: PlayerRequest = {
    username: 'NouveauJoueur',
    points: 75,
    avatar: 'nouvel-avatar.png'
  };

  const apiUrl = '/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlayerService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(PlayerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Vérifier qu'il n'y a pas de requêtes http en attente après chaque test
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllPlayers', () => {
    it('devrait récupérer tous les joueurs via GET', () => {
      service.getAllPlayers().subscribe(players => {
        expect(players).toEqual(mockPlayers);
        expect(players.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiUrl}/players`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlayers);
    });
  });

  describe('getPlayerById', () => {
    it('devrait récupérer un joueur spécifique via GET avec son ID', () => {
      const playerId = '1';

      service.getPlayerById(playerId).subscribe(player => {
        expect(player).toEqual(mockPlayer);
      });

      const req = httpMock.expectOne(`${apiUrl}/player/${playerId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlayer);
    });
  });

  describe('addPlayer', () => {
    it('devrait ajouter un joueur via POST', () => {
      service.addPlayer(newPlayerRequest).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/player`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newPlayerRequest);
      req.flush({ success: true });
    });
  });

  describe('updatePlayerPoints', () => {
    it('devrait mettre à jour les points d\'un joueur via PATCH', () => {
      const playerId = '1';
      const points = 110;

      service.updatePlayerPoints(playerId, points).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/player/${playerId}?points=${points}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush({ success: true });
    });
  });

  describe('deletePlayer', () => {
    it('devrait supprimer un joueur via DELETE', () => {
      const playerId = '1';

      service.deletePlayer(playerId).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/player/${playerId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('simulateMatch', () => {
    it('devrait simuler un match entre deux joueurs via POST', () => {
      const player1Id = '1';
      const player2Id = '2';
      const updatedPlayers = [...mockPlayers];
      updatedPlayers[0].points = 101; // Le joueur 1 gagne un point

      service.simulateMatch(player1Id, player2Id).subscribe(players => {
        expect(players).toEqual(updatedPlayers);
        expect(players[0].points).toBe(101);
      });

      const req = httpMock.expectOne(`${apiUrl}/players/match?player1Id=${player1Id}&player2Id=${player2Id}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(updatedPlayers);
    });
  });
});
