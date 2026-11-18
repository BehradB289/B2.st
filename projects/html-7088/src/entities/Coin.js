import { Entity } from './Entity.js';

export class Coin extends Entity {
  constructor(x = 0, y = 0) {
    super(x, y, 14, 14);
    this.type = 'coin';
    this.isDynamic = false;
    this.collected = false;
  }

  collect() {
    this.collected = true;
    this.isAlive = false;
  }
}