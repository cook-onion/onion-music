
declare module 'colorthief' {
  class ColorThief {
    getColor(sourceImage: HTMLImageElement, quality?: number): [number, number, number];
    getPalette(sourceImage: HTMLImageElement, colorCount?: number, quality?: number): Array&lt;[number, number, number];
  }
  
  export = ColorThief;
}
