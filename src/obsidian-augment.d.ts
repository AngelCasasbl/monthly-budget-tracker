// Obsidian augments HTMLElement at runtime with createEl, createDiv, setText, etc.
// This declaration file makes TypeScript aware of these extensions.
interface HTMLElement {
  createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    o?: { text?: string; cls?: string; value?: string; type?: string; title?: string; attr?: Record<string, string> },
    callback?: (el: HTMLElementTagNameMap[K]) => void
  ): HTMLElementTagNameMap[K];
  createDiv(cls?: string): HTMLDivElement;
  appendText(text: string): void;
  setText(text: string): void;
  addClass(...classes: string[]): void;
  removeClass(...classes: string[]): void;
  toggleClass(cls: string, value?: boolean): void;
  empty(): void;
}
