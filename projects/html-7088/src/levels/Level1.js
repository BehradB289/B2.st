/**
 * World 1-1 Layout definition matrix & entities spawn metadata
 */
export function createLevel1() {
  const ROWS = 15;
  const COLS = 120;
  const matrix = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  // Floor setup (Ground rows 13 and 14)
  for (let c = 0; c < COLS; c++) {
    // Ground pit gaps
    if (c >= 42 && c <= 44) continue;
    if (c >= 62 && c <= 65) continue;

    matrix[13][c] = 1;
    matrix[14][c] = 1;
  }

  // Mystery blocks & Bricks
  matrix[9][16] = 3; // Coin box
  matrix[9][20] = 2; // Brick
  matrix[9][21] = 3; // Coin box
  matrix[9][22] = 2; // Brick
  matrix[9][23] = 3; // Coin box
  matrix[9][24] = 2; // Brick
  matrix[5][22] = 3; // High coin box

  // Pipes
  // Pipe 1 (height 2)
  matrix[11][28] = 5; matrix[11][29] = 6;
  matrix[12][28] = 7; matrix[12][29] = 8;

  // Pipe 2 (height 3)
  matrix[10][38] = 5; matrix[10][39] = 6;
  matrix[11][38] = 7; matrix[11][39] = 8;
  matrix[12][38] = 7; matrix[12][39] = 8;

  // Pipe 3 (height 4)
  matrix[9][52] = 5; matrix[9][53] = 6;
  matrix[10][52] = 7; matrix[10][53] = 8;
  matrix[11][52] = 7; matrix[11][53] = 8;
  matrix[12][52] = 7; matrix[12][53] = 8;

  // Elevated brick platform
  for (let c = 72; c <= 78; c++) {
    matrix[9][c] = 2;
  }
  matrix[9][75] = 3;

  // Pyramid staircase before flagpole
  for (let step = 1; step <= 5; step++) {
    const col = 95 + step;
    for (let r = 13 - step; r < 13; r++) {
      matrix[r][col] = 1;
    }
  }

  // Flagpole at col 110
  for (let r = 3; r <= 12; r++) {
    matrix[r][110] = 9;
  }
  matrix[2][110] = 10; // Sphere top

  return {
    matrix,
    width: COLS * 16,
    height: ROWS * 16,
    spawnMario: { x: 40, y: 160 },
    spawns: [
      { type: 'goomba', x: 220, y: 190 },
      { type: 'goomba', x: 420, y: 190 },
      { type: 'goomba', x: 580, y: 190 },
      { type: 'coin', x: 260, y: 160 },
      { type: 'coin', x: 280, y: 160 },
      { type: 'coin', x: 740, y: 120 }
    ]
  };
}