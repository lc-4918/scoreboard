import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { PlayerService } from '../../services/player.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Player } from '../../interfaces/player';
import { PlayerRequest } from '../../interfaces/player-request';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-player-list',
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatInputModule,
    MatFormFieldModule, MatCardModule, MatIconModule, MatSnackBarModule],
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent implements OnInit {
  players: Player[] = [];
  playerForm: FormGroup;
  displayedColumns: string[] = ['ranking', 'username', 'points', 'actions'];
  avatarPreview: string = '';

  private readonly playerService = inject(PlayerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.playerForm = this.fb.group({
      username: ['', Validators.required],
      points: [0],
      avatar: ['']
    });
    
    // Écouter les changements de l'avatar pour mettre à jour l'aperçu
    this.playerForm.get('avatar')?.valueChanges.subscribe(url => {
      this.avatarPreview = url;
    });
  }

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.playerService.getAllPlayers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.players = data;
      },
      error: (error) => {
        console.error('Error fetching players', error);
        this.snackBar.open('Erreur lors du chargement des joueurs', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  addPlayer(): void {
    if (this.playerForm.valid) {
      const newPlayer: PlayerRequest = this.playerForm.value;
      this.playerService.addPlayer(newPlayer).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.loadPlayers();
          this.playerForm.reset({ points: 0, avatar: '' });
          this.avatarPreview = '';
          this.snackBar.open('Joueur ajouté avec succès', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error adding player', error);
          this.snackBar.open('Erreur lors de l\'ajout du joueur', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  deletePlayer(id: string): void {
    this.playerService.deletePlayer(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadPlayers();
        this.snackBar.open('Joueur supprimé avec succès', 'Fermer', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error deleting player', error);
        this.snackBar.open('Erreur lors de la suppression du joueur', 'Fermer', {
          duration: 3000
        });
      }
    });
  }
}
