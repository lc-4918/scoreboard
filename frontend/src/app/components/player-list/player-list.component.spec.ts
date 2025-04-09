import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PlayerListComponent } from './player-list.component';
import { PlayerService } from '../../services/player.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ChangeDetectorRef, Component, DestroyRef } from '@angular/core';

describe('PlayerListComponent', () => {
  let component: PlayerListComponent;
  let fixture: ComponentFixture<PlayerListComponent>;
  let playerServiceSpy: jasmine.SpyObj<PlayerService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let loader: HarnessLoader;
  let destroyRefStub: Partial<DestroyRef>;

  const mockPlayers = [
    { id: '1', username: 'Joueur1', points: 100, ranking: 1, avatar: 'avatar1.png' },
    { id: '2', username: 'Joueur2', points: 90, ranking: 2, avatar: 'avatar2.png' },
    { id: '3', username: 'Joueur3', points: 80, ranking: 3, avatar: 'avatar3.png' }
  ];

  beforeEach(async () => {
    playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getAllPlayers', 'addPlayer', 'deletePlayer']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    destroyRefStub = {
      onDestroy: jasmine.createSpy('onDestroy')
    };

    await TestBed.configureTestingModule({
      imports: [PlayerListComponent, ReactiveFormsModule, NoopAnimationsModule, MatCardModule,
        MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTableModule,
        MatSnackBarModule],
      providers: []
    })
    .overrideComponent(PlayerListComponent, {
      set: {
        providers: [
          { provide: PlayerService, useValue: playerServiceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: DestroyRef, useValue: destroyRefStub }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerListComponent);
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
    fixture = TestBed.createComponent(PlayerListComponent);
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

  it('devrait initialiser le formulaire avec des valeurs par défaut', () => {
    expect(component.playerForm.get('username')?.value).toBe('');
    expect(component.playerForm.get('points')?.value).toBe(0);
    expect(component.playerForm.get('avatar')?.value).toBe('');
  });

  it('devrait mettre à jour l\'aperçu de l\'avatar lorsque la valeur change', () => {
    const testUrl = 'https://test-avatar.com/image.png';
    component.playerForm.get('avatar')?.setValue(testUrl);
    expect(component.avatarPreview).toBe(testUrl);
  });

  it('devrait valider que le nom d\'utilisateur est requis', () => {
    const usernameControl = component.playerForm.get('username');
    usernameControl?.setValue('');
    expect(usernameControl?.valid).toBeFalse();
    expect(usernameControl?.hasError('required')).toBeTrue();
    
    usernameControl?.setValue('TestUser');
    expect(usernameControl?.valid).toBeTrue();
  });

  it('devrait ajouter un joueur avec succès', fakeAsync(() => {
    const newPlayer = { username: 'NouveauJoueur', points: 75, avatar: 'nouvel-avatar.png' };
    playerServiceSpy.addPlayer.and.returnValue(of({}));
    playerServiceSpy.getAllPlayers.calls.reset();
    
    // Configurer le formulaire avec les détails du nouveau joueur
    component.playerForm.setValue(newPlayer);
    component.addPlayer();
    tick(); // Attendre que les observables se complètent
    
    // Vérifications
    expect(playerServiceSpy.addPlayer).toHaveBeenCalledWith(newPlayer);
    expect(playerServiceSpy.getAllPlayers).toHaveBeenCalled();
    expect(component.playerForm.get('username')?.value).toBe(null);
    expect(component.playerForm.get('points')?.value).toBe(0);
    expect(component.playerForm.get('avatar')?.value).toBe('');
    expect(component.avatarPreview).toBe('');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Joueur ajouté avec succès', 
      'Fermer', 
      { duration: 3000 }
    );
  }));

  it('ne devrait pas ajouter un joueur si le formulaire est invalide', () => {
    component.playerForm.get('username')?.setValue('');
    component.addPlayer();
    expect(playerServiceSpy.addPlayer).not.toHaveBeenCalled();
  });

  it('devrait afficher une erreur si l\'ajout du joueur échoue', fakeAsync(() => {
    playerServiceSpy.addPlayer.and.returnValue(throwError(() => new Error('Erreur d\'ajout')));
    
    // Réinitialiser les appels précédents au spy getAllPlayers
    playerServiceSpy.getAllPlayers.calls.reset();
    
    // Configurer le formulaire avec un joueur valide
    component.playerForm.setValue({ username: 'TestUser', points: 50, avatar: '' });
    component.addPlayer();
    tick(); // Attendre que les observables se complètent
    
    expect(playerServiceSpy.addPlayer).toHaveBeenCalled();
    expect(playerServiceSpy.getAllPlayers).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Erreur lors de l\'ajout du joueur', 
      'Fermer', 
      { duration: 3000 }
    );
  }));

  it('devrait supprimer un joueur avec succès', fakeAsync(() => {
    const playerId = '2';
    playerServiceSpy.deletePlayer.and.returnValue(of({}));
    playerServiceSpy.getAllPlayers.calls.reset();
    
    component.deletePlayer(playerId);
    tick(); // Attendre que les observables se complètent
    
    expect(playerServiceSpy.deletePlayer).toHaveBeenCalledWith(playerId);
    expect(playerServiceSpy.getAllPlayers).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Joueur supprimé avec succès', 
      'Fermer', 
      { duration: 3000 }
    );
  }));

  it('devrait afficher une erreur si la suppression du joueur échoue', fakeAsync(() => {
    const playerId = '2';
    playerServiceSpy.deletePlayer.and.returnValue(throwError(() => new Error('Erreur de suppression')));
    
    // Réinitialiser les appels précédents au spy getAllPlayers
    playerServiceSpy.getAllPlayers.calls.reset();
    
    component.deletePlayer(playerId);
    tick(); // Attendre que les observables se complètent
    
    expect(playerServiceSpy.deletePlayer).toHaveBeenCalledWith(playerId);
    expect(playerServiceSpy.getAllPlayers).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Erreur lors de la suppression du joueur', 
      'Fermer', 
      { duration: 3000 }
    );
  }));

  describe('Tests d\'intégration avec les harness', () => {
    it('devrait afficher la liste des joueurs dans le tableau', async () => {
      const table = await loader.getHarness(MatTableHarness);
      const rows = await table.getRows();
      
      expect(rows.length).toBe(3);
      
      // Vérifier le contenu de la première ligne
      const cellTexts = await rows[0].getCellTextByIndex();
      expect(cellTexts[0]).toBe('1'); // Ranking
      expect(cellTexts[1]).toBe('Joueur1'); // Username
      expect(cellTexts[2]).toBe('100'); // Points
    });

    it('devrait désactiver le bouton d\'ajout lorsque le formulaire est invalide', async () => {
      // Trouver le bouton d'ajout
      const addButton = await loader.getHarness(MatButtonHarness.with({text: /Ajouter/}));
      
      // Vérifier l'état initial (désactivé car username est vide)
      expect(await addButton.isDisabled()).toBeTrue();
      
      // Remplir le champ username
      const usernameInput = await loader.getHarness(MatInputHarness.with({selector: 'input[formControlName="username"]'}));
      await usernameInput.setValue('TestUser');
      
      // Le bouton devrait maintenant être activé
      expect(await addButton.isDisabled()).toBeFalse();
      
      // Vider le champ username
      await usernameInput.setValue('');
      
      // Le bouton devrait à nouveau être désactivé
      expect(await addButton.isDisabled()).toBeTrue();
    });

    it('devrait pouvoir ajouter un joueur via le formulaire', async () => {
      playerServiceSpy.addPlayer.and.returnValue(of({}));
      
      // Remplir le formulaire
      const usernameInput = await loader.getHarness(MatInputHarness.with({selector: 'input[formControlName="username"]'}));
      await usernameInput.setValue('TestUser');
      
      const pointsInput = await loader.getHarness(MatInputHarness.with({selector: 'input[formControlName="points"]'}));
      await pointsInput.setValue('50');
      
      // Cliquer sur le bouton d'ajout
      const addButton = await loader.getHarness(MatButtonHarness.with({text: /Ajouter/}));
      await addButton.click();
      
      // Vérifier que le service a été appelé avec les bonnes valeurs
      expect(playerServiceSpy.addPlayer).toHaveBeenCalledWith({
        username: 'TestUser',
        points: 50,
        avatar: ''
      });
    });
  });
});
