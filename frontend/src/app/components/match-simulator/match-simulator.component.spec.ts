import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatchSimulatorComponent } from './match-simulator.component';
import { PlayerService } from '../../services/player.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { DestroyRef } from '@angular/core';

describe('MatchSimulatorComponent', () => {
  let component: MatchSimulatorComponent;
  let fixture: ComponentFixture<MatchSimulatorComponent>;
  let playerServiceSpy: jasmine.SpyObj<PlayerService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let loader: HarnessLoader;
  let destroyRefStub: Partial<DestroyRef>;

  const mockPlayers = [
    { id: '1', username: 'Joueur1', points: 100, ranking: 1, avatar: 'avatar1.png' },
    { id: '2', username: 'Joueur2', points: 90, ranking: 2, avatar: 'avatar2.png' },
    { id: '3', username: 'Joueur3', points: 80, ranking: 3, avatar: 'avatar3.png' }
  ];

  const mockUpdatedPlayers = [
    { id: '1', username: 'Joueur1', points: 101, ranking: 1, avatar: 'avatar1.png' },
    { id: '2', username: 'Joueur2', points: 90, ranking: 2, avatar: 'avatar2.png' },
    { id: '3', username: 'Joueur3', points: 80, ranking: 3, avatar: 'avatar3.png' }
  ];

  beforeEach(async () => {
    playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getAllPlayers', 'simulateMatch']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    destroyRefStub = {
      onDestroy: jasmine.createSpy('onDestroy')
    };

    await TestBed.configureTestingModule({
      imports: [
        MatchSimulatorComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTableModule,
        MatDividerModule,
        MatSnackBarModule,
        MatBadgeModule
      ],
      providers: []
    })
    .overrideComponent(MatchSimulatorComponent, {
      set: {
        providers: [
          { provide: PlayerService, useValue: playerServiceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: DestroyRef, useValue: destroyRefStub }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchSimulatorComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    
    // Configuration par défaut des espions
    playerServiceSpy.getAllPlayers.and.returnValue(of(mockPlayers));
    
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les joueurs au démarrage', () => {
    expect(playerServiceSpy.getAllPlayers).toHaveBeenCalled();
    expect(component.players.length).toBe(3);
    expect(component.players).toEqual(mockPlayers);
  });

  it('devrait afficher un message d\'erreur si le chargement des joueurs échoue', fakeAsync(() => {
    // Réinitialiser le composant
    fixture = TestBed.createComponent(MatchSimulatorComponent);
    component = fixture.componentInstance;
    
    // Simuler une erreur lors du chargement des joueurs
    playerServiceSpy.getAllPlayers.and.returnValue(throwError(() => new Error('Erreur de chargement')));
    
    // Appeler loadPlayers directement
    component.loadPlayers();
    tick(); // Attendre que les observables se complètent
    
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Erreur lors du chargement des joueurs', 
      'Fermer', 
      { duration: 3000 }
    );
  }));

  it('devrait initialiser le formulaire avec des contrôles vides et requis', () => {
    expect(component.matchForm.get('player1Id')?.value).toBe('');
    expect(component.matchForm.get('player2Id')?.value).toBe('');
    expect(component.matchForm.valid).toBeFalse();
  });

  it('devrait mettre à jour selectedPlayer1 lorsque player1Id change', () => {
    component.matchForm.get('player1Id')?.setValue('1');
    expect(component.selectedPlayer1?.username).toBe('Joueur1');
  });

  it('devrait mettre à jour selectedPlayer2 lorsque player2Id change', () => {
    component.matchForm.get('player2Id')?.setValue('2');
    expect(component.selectedPlayer2?.username).toBe('Joueur2');
  });

  it('ne devrait pas être valide si les deux joueurs sont identiques', () => {
    component.matchForm.get('player1Id')?.setValue('1');
    component.matchForm.get('player2Id')?.setValue('1');
    expect(component.matchForm.valid).toBeFalse();
    expect(component.matchForm.hasError('samePlayer')).toBeTrue();
  });

  it('devrait être valide si deux joueurs différents sont sélectionnés', () => {
    component.matchForm.get('player1Id')?.setValue('1');
    component.matchForm.get('player2Id')?.setValue('2');
    expect(component.matchForm.valid).toBeTrue();
  });

  it('devrait retourner le message d\'erreur approprié avec getErrorMessage()', () => {
    component.matchForm.get('player1Id')?.setValue('1');
    component.matchForm.get('player2Id')?.setValue('1');
    expect(component.getErrorMessage()).toBe('Veuillez sélectionner deux joueurs différents');
    
    component.matchForm.get('player1Id')?.setValue('');
    component.matchForm.get('player2Id')?.setValue('');
    expect(component.getErrorMessage()).toBe('Veuillez sélectionner deux joueurs');
  });

  it('devrait simuler un match avec succès et mettre à jour les résultats', fakeAsync(() => {
    // Configuration du test
    playerServiceSpy.simulateMatch.and.returnValue(of(mockUpdatedPlayers));
    
    // Remplir le formulaire
    component.matchForm.get('player1Id')?.setValue('1');
    component.matchForm.get('player2Id')?.setValue('2');
    
    // Simuler le match
    component.simulateMatch();
    tick(); // Attendre que les observables se complètent
    
    // Vérifications
    expect(playerServiceSpy.simulateMatch).toHaveBeenCalledWith('1', '2');
    expect(component.simulationCompleted).toBeTrue();
    expect(component.simulationResult).toEqual(mockUpdatedPlayers);
    expect(component.winner?.id).toBe('1');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Match simulé avec succès', 
      'Fermer', 
      { duration: 3000 }
    );
  }));

  it('devrait afficher une erreur si la simulation échoue', fakeAsync(() => {
    // Configuration du test
    playerServiceSpy.simulateMatch.and.returnValue(throwError(() => new Error('Erreur de simulation')));
    
    // Remplir le formulaire
    component.matchForm.get('player1Id')?.setValue('1');
    component.matchForm.get('player2Id')?.setValue('2');
    
    // Simuler le match
    component.simulateMatch();
    tick(); // Attendre que les observables se complètent
    
    // Vérifications
    expect(playerServiceSpy.simulateMatch).toHaveBeenCalledWith('1', '2');
    expect(component.simulationCompleted).toBeFalse();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Erreur lors de la simulation du match', 
      'Fermer', 
      { duration: 3000 }
    );
  }));

  it('devrait afficher un message d\'erreur si le formulaire est invalide lors de la simulation', fakeAsync(() => {
    // Cas où les joueurs sont identiques
    component.matchForm.get('player1Id')?.setValue('1');
    component.matchForm.get('player2Id')?.setValue('1');
    
    // Réinitialiser les appels précédents au spy
    snackBarSpy.open.calls.reset();
    
    component.simulateMatch();
    tick(); // Attendre que les observables se complètent
    
    expect(playerServiceSpy.simulateMatch).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Veuillez sélectionner deux joueurs différents', 
      'Fermer', 
      { duration: 3000 }
    );
    
    // Cas où aucun joueur n'est sélectionné
    component.matchForm.reset();
    
    // Réinitialiser les appels précédents au spy
    snackBarSpy.open.calls.reset();
    
    component.simulateMatch();
    tick(); // Attendre que les observables se complètent
    
    expect(playerServiceSpy.simulateMatch).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Veuillez sélectionner deux joueurs', 
      'Fermer', 
      { duration: 3000 }
    );
  }));

  it('devrait réinitialiser la simulation avec resetSimulation()', () => {
    // Configurer l'état initial pour simuler une simulation terminée
    component.simulationCompleted = true;
    component.winner = mockUpdatedPlayers[0];
    component.matchForm.get('player1Id')?.setValue('1');
    component.matchForm.get('player2Id')?.setValue('2');
    
    // Appel de la méthode à tester
    component.resetSimulation();
    
    // Vérifications
    expect(component.simulationCompleted).toBeFalse();
    expect(component.winner).toBeNull();
    // Adapter les assertions à ce que fait réellement la méthode de réinitialisation
    // Certains formulaires Angular peuvent réinitialiser à '' plutôt qu'à null
    expect(component.matchForm.get('player1Id')?.value).toEqual('');
    expect(component.matchForm.get('player2Id')?.value).toEqual('');
  });

  describe('Tests d\'intégration avec les harness', () => {
    it('devrait désactiver le bouton de simulation si le formulaire est invalide', async () => {
      const buttons = await loader.getAllHarnesses(MatButtonHarness.with({text: /Simuler le Match/}));
      expect(buttons.length).toBe(1);
      
      const simulateButton = buttons[0];
      expect(await simulateButton.isDisabled()).toBeTrue();
      
      // Remplir le formulaire avec des valeurs valides
      component.matchForm.get('player1Id')?.setValue('1');
      component.matchForm.get('player2Id')?.setValue('2');
      fixture.detectChanges();
      
      expect(await simulateButton.isDisabled()).toBeFalse();
    });

    it('devrait afficher la carte de résultat après une simulation réussie', async () => {
      playerServiceSpy.simulateMatch.and.returnValue(of(mockUpdatedPlayers));
      
      // Simuler une sélection valide
      component.matchForm.get('player1Id')?.setValue('1');
      component.matchForm.get('player2Id')?.setValue('2');
      
      component.simulateMatch();
      fixture.detectChanges();
      
      const resetButtons = await loader.getAllHarnesses(MatButtonHarness.with({text: /Simuler un autre match/}));
      expect(resetButtons.length).toBe(1);
    });
  });
});
