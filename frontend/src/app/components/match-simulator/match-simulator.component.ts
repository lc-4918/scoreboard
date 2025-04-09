import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors,
  ValidatorFn } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { PlayerService } from '../../services/player.service';
import { Player } from '../../interfaces/player';


@Component({
  selector: 'app-match-simulator',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatTableModule, MatDividerModule, MatSnackBarModule,
    MatBadgeModule],
  templateUrl: './match-simulator.component.html',
  styleUrls: ['./match-simulator.component.scss']
})
export class MatchSimulatorComponent implements OnInit {
  players: Player[] = [];
  matchForm: FormGroup;
  simulationResult: Player[] = [];
  simulationCompleted: boolean = false;
  displayedColumns: string[] = ['ranking', 'username', 'points'];

  // Propriétés pour stocker les informations sur les joueurs sélectionnés
  selectedPlayer1: Player | null = null;
  selectedPlayer2: Player | null = null;
  winner: Player | null = null;

  private readonly playerService = inject(PlayerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.matchForm = this.fb.nonNullable.group({
      player1Id: ['', Validators.required],
      player2Id: ['', Validators.required]
    }, { validators: this.differentPlayersValidator() });

    // Écouter les changements de sélection des joueurs
    this.matchForm.get('player1Id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
        this.selectedPlayer1 = this.players.find(p => p.id === id) || null;
    });

    this.matchForm.get('player2Id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
        this.selectedPlayer2 = this.players.find(p => p.id === id) || null;
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

  simulateMatch(): void {
    if (this.matchForm.valid) {
      const player1Id = this.matchForm.get('player1Id')?.value;
      const player2Id = this.matchForm.get('player2Id')?.value;

      this.playerService.simulateMatch(player1Id, player2Id)
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (data) => {
            this.simulationResult = data;
            this.simulationCompleted = true;

            // Déterminer le gagnant (celui qui a gagné des points)
            const player1After = data.find(p => p.id === player1Id);
            const player2After = data.find(p => p.id === player2Id);

            if (player1After && player2After) {
              const player1Before = this.players.find(p => p.id === player1Id);
              const player2Before = this.players.find(p => p.id === player2Id);

              if (player1Before && player2Before) {
                if (player1After.points > player1Before.points) {
                  this.winner = player1After;
                } else if (player2After.points > player2Before.points) {
                  this.winner = player2After;
                }
              }
            }

            // Mettre à jour la liste des joueurs
            this.players = data;
            this.snackBar.open('Match simulé avec succès', 'Fermer', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Error simulating match', error);
            this.snackBar.open('Erreur lors de la simulation du match', 'Fermer', {
              duration: 3000
            });
          }
        });
    } else {
      if (this.matchForm.hasError('samePlayer')) {
        this.snackBar.open('Veuillez sélectionner deux joueurs différents', 'Fermer', {
          duration: 3000
        });
      } else {
        this.snackBar.open('Veuillez sélectionner deux joueurs', 'Fermer', {
          duration: 3000
        });
      }
    }
  }

  resetSimulation(): void {
    this.simulationCompleted = false;
    this.matchForm.reset();
    this.winner = null;
  }

  getErrorMessage(): string {
    if (this.matchForm.hasError('samePlayer')) {
      return 'Veuillez sélectionner deux joueurs différents';
    }
    return 'Veuillez sélectionner deux joueurs';
  }

  /**
   * Validateur personnalisé pour vérifier que les deux joueurs sont différents
   * @returns erreur 'samePlayer' si les deux joueurs sélectionnés sont identiques, sinon null
   */
  differentPlayersValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      if (!formGroup.get('player1Id') || !formGroup.get('player2Id')) {
        return null;
      }

      const player1Id = formGroup.get('player1Id')?.value;
      const player2Id = formGroup.get('player2Id')?.value;

      if (player1Id && player2Id && player1Id === player2Id) {
        return { samePlayer: true };
      }

      return null;
    };
  }
}

