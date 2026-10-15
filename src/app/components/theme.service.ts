import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'mf-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private theme: BehaviorSubject<Theme> = new BehaviorSubject<Theme>(this.initialTheme());
  theme$ = this.theme.asObservable();

  constructor() {
    this.apply(this.theme.value);
  }

  get current(): Theme {
    return this.theme.value;
  }

  toggle() {
    this.setTheme(this.theme.value === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { }
    this.apply(theme);
    this.theme.next(theme);
  }

  private apply(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private initialTheme(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
