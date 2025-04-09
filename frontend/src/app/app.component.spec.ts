import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { RouterLinkWithHref, provideRouter } from '@angular/router';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        NoopAnimationsModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('devrait créer l\'application', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('devrait avoir l\'année courante dans le composant', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const currentYear = new Date().getFullYear();
    expect(app.currentYear).toEqual(currentYear);
  });

  it('devrait afficher le titre "Score Board" dans la barre d\'outils', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo')?.textContent).toContain('Score Board');
  });

  it('devrait afficher l\'année courante dans le footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const currentYear = new Date().getFullYear();
    expect(compiled.querySelector('footer p')?.textContent).toContain(`${currentYear}`);
  });

  it('devrait avoir deux liens de navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const links = fixture.debugElement.queryAll(By.css('.nav-links a'));
    expect(links.length).toBe(2);
  });

  it('devrait avoir un lien vers la page de classement', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const links = fixture.debugElement.queryAll(By.directive(RouterLinkWithHref));
    const classementLink = links.find(link => link.attributes['routerLink'] === '/players');
    expect(classementLink).toBeTruthy();
    expect(classementLink?.nativeElement.textContent).toContain('Classement');
  });

  it('devrait avoir un lien vers le simulateur', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const links = fixture.debugElement.queryAll(By.directive(RouterLinkWithHref));
    const simulatorLink = links.find(link => link.attributes['routerLink'] === '/simulator');
    expect(simulatorLink).toBeTruthy();
    expect(simulatorLink?.nativeElement.textContent).toContain('Simulateur');
  });

  it('devrait contenir un router-outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
