declare interface Renderer {
  render(): void;
  mount(el: string | HTMLElement): void;
}
