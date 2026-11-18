/**
 * 2D TileMap Renderer and Physics Query Engine
 */
export class TileMap {
  constructor(matrix, tileSize = 16) {
    this.matrix = matrix;
    this.tileSize = tileSize;
    this.height = matrix.length;
    this.width = matrix[0].length;
    this.bumpedTiles = new Map(); // Key: x,y -> animation delta
  }

  isSolid(col, row) {
    if (col < 0 || col >= this.width || row >= this.height) {
      return false;
    }
    if (row < 0) return false;
    const tile = this.matrix[row][col];
    // 0: Air, 1: Ground, 2: Brick, 3: Mystery, 4: Empty Mystery, 5: PipeTL, 6: PipeTR, 7: PipeBL, 8: PipeBR, 9: Pole
    return tile === 1 || tile === 2 || tile === 3 || tile === 4 || (tile >= 5 && tile <= 8);
  }

  getTile(col, row) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return 0;
    return this.matrix[row][col];
  }

  setTile(col, row, type) {
    if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
      this.matrix[row][col] = type;
    }
  }

  onTileHitFromBelow(col, row, entity) {
    const tile = this.getTile(col, row);
    if (tile === 3) {
      // Question block turns into empty block and spawns coin
      this.setTile(col, row, 4);
      this.bumpedTiles.set(`${col},${row}`, { time: 0.15, offset: -6 });
      entity.gameContext?.spawnPoppedCoin(col * this.tileSize + 3, (row - 1) * this.tileSize);
      entity.gameContext?.addScore(200);
      entity.gameContext?.addCoin();
    } else if (tile === 2) {
      // Brick block bump
      this.bumpedTiles.set(`${col},${row}`, { time: 0.12, offset: -4 });
      entity.gameContext?.soundEngine?.playBump();
    }
  }

  update(dt) {
    for (const [key, bump] of this.bumpedTiles.entries()) {
      bump.time -= dt;
      if (bump.time <= 0) {
        this.bumpedTiles.delete(key);
      }
    }
  }

  render(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.width, Math.ceil((camera.x + camera.width) / this.tileSize) + 1);

    for (let r = 0; r < this.height; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = this.matrix[r][c];
        if (tile === 0) continue;

        let bumpOffset = 0;
        const bumpKey = `${c},${r}`;
        if (this.bumpedTiles.has(bumpKey)) {
          bumpOffset = this.bumpedTiles.get(bumpKey).offset;
        }

        const screen = camera.worldToScreen(c * this.tileSize, r * this.tileSize + bumpOffset);
        this._drawTile(ctx, tile, screen.x, screen.y);
      }
    }
  }

  _drawTile(ctx, tile, x, y) {
    const ts = this.tileSize;

    switch (tile) {
      case 1: // Ground block
        ctx.fillStyle = '#d85800';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#000000';
        ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
        ctx.fillStyle = '#fcb078';
        ctx.fillRect(x + 2, y + 2, 4, 4);
        break;

      case 2: // Brick block
        ctx.fillStyle = '#b84418';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y + 7, ts, 1);
        ctx.fillRect(x + 8, y, 1, 7);
        ctx.fillRect(x + 4, y + 8, 1, 8);
        ctx.fillRect(x + 12, y + 8, 1, 8);
        break;

      case 3: // Mystery question box
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#000000';
        ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
        // Question mark symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 6, y + 3, 4, 2);
        ctx.fillRect(x + 8, y + 5, 2, 2);
        ctx.fillRect(x + 6, y + 7, 3, 2);
        ctx.fillRect(x + 6, y + 11, 2, 2);
        break;

      case 4: // Empty used block
        ctx.fillStyle = '#946038';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#442000';
        ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
        break;

      case 5: // Pipe Top-Left
      case 6: // Pipe Top-Right
      case 7: // Pipe Body-Left
      case 8: // Pipe Body-Right
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = '#80d010';
        ctx.fillRect(x + (tile % 2 === 1 ? 2 : 0), y, 3, ts);
        ctx.fillStyle = '#005000';
        ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
        break;

      case 9: // Flag Pole
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x + 7, y, 2, ts);
        break;

      case 10: // Flag Top sphere
        ctx.fillStyle = '#00d000';
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }
}