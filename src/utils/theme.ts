export type Theme = 'light' | 'dark';
const THEME_KEY = 'gestion-sytec-theme';
export const nextTheme = (current: Theme): Theme => current === 'dark' ? 'light' : 'dark';

export function getInitialTheme(storage: Pick<Storage, 'getItem'> = localStorage): Theme {
  return storage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function persistTheme(theme: Theme, root: HTMLElement = document.documentElement, storage: Pick<Storage, 'setItem'> = localStorage) {
  root.dataset.theme = theme;
  storage.setItem(THEME_KEY, theme);
}
