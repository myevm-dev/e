declare module 'ethereum-blockies' {
    interface BlockieOptions {
      seed: string; // A unique identifier for generating the icon
      size?: number; // Number of pixels square (default: 8)
      scale?: number; // Width/height of each block (default: 4)
      color?: string; // Foreground color
      bgcolor?: string; // Background color
      spotcolor?: string; // Color of spots
    }
  
    interface Blockie {
      toDataURL(): string;
    }
  
    // Directly export the create function
    export function create(options: BlockieOptions): Blockie;
  }
  