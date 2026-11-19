/**
 * Authentic Super Mario World 1-1 Layout Builder
 * Studio: B2.st
 */

import { TileMap, TileType } from './TileMap.js';

export class Level1 {
    /**
     * Build the iconic Super Mario Bros World 1-1 map
     * @returns {{tileMap: TileMap, enemySpawns: Array, marioSpawn: Object}}
     */
    static create() {
        const cols = 220;
        const rows = 15;
        const map = new TileMap(cols, rows, 16);

        // Ground baseline across entire level with pits
        for (let c = 0; c < cols; c++) {
            // Pits at columns 69-71 and 86-88
            const isPit = (c >= 69 && c <= 71) || (c >= 86 && c <= 89) || (c >= 153 && c <= 155);
            if (!isPit) {
                map.setTile(c, 13, TileType.GROUND);
                map.setTile(c, 14, TileType.GROUND);
            }
        }

        // Helper to place pipes
        const placePipe = (col, height) => {
            const topRow = 13 - height;
            map.setTile(col, topRow, TileType.PIPE_TOP_LEFT);
            map.setTile(col + 1, topRow, TileType.PIPE_TOP_RIGHT);
            for (let r = topRow + 1; r < 13; r++) {
                map.setTile(col, r, TileType.PIPE_BODY_LEFT);
                map.setTile(col + 1, r, TileType.PIPE_BODY_RIGHT);
            }
        };

        // Helper to build stairs
        const placeStairs = (startCol, height, direction = 1) => {
            for (let h = 1; h <= height; h++) {
                const c = direction === 1 ? startCol + (h - 1) : startCol + (height - h);
                for (let r = 13 - h; r < 13; r++) {
                    map.setTile(c, r, TileType.BLOCK_HARD);
                }
            }
        };

        // 1. Initial Question Block & Bricks
        map.setTile(16, 9, TileType.QUESTION);
        map.setTile(20, 9, TileType.BRICK);
        map.setTile(21, 9, TileType.QUESTION);
        map.setTile(22, 9, TileType.BRICK);
        map.setTile(23, 9, TileType.QUESTION);
        map.setTile(24, 9, TileType.BRICK);
        map.setTile(22, 5, TileType.QUESTION); // High mushroom question block

        // 2. Pipes
        placePipe(28, 2);
        placePipe(38, 3);
        placePipe(46, 4);
        placePipe(57, 4);

        // 3. Middle brick clusters
        map.setTile(64, 9, TileType.QUESTION);
        map.setTile(77, 9, TileType.BRICK);
        map.setTile(78, 9, TileType.QUESTION);
        map.setTile(79, 9, TileType.BRICK);

        for (let i = 80; i <= 87; i++) {
            map.setTile(i, 5, TileType.BRICK);
        }

        map.setTile(91, 5, TileType.BRICK);
        map.setTile(92, 5, TileType.QUESTION);
        map.setTile(93, 5, TileType.QUESTION);
        map.setTile(94, 5, TileType.BRICK);

        // 4. End Stairs & Flagpole Castle
        placeStairs(134, 4, 1);
        placeStairs(140, 4, -1);

        placeStairs(148, 8, 1);
        placeStairs(158, 8, -1);

        // Flagpole Base
        map.setTile(198, 12, TileType.BLOCK_HARD);
        for (let r = 3; r <= 11; r++) {
            map.setTile(198, r, TileType.FLAG_POLE);
        }

        // Enemy Spawn Registry
        const enemySpawns = [
            { type: 'goomba', x: 22 * 16, y: 12 * 16 },
            { type: 'goomba', x: 40 * 16, y: 12 * 16 },
            { type: 'goomba', x: 51 * 16, y: 12 * 16 },
            { type: 'goomba', x: 53 * 16, y: 12 * 16 },
            { type: 'koopa',  x: 95 * 16, y: 12 * 16 },
            { type: 'goomba', x: 105 * 16, y: 12 * 16 },
            { type: 'goomba', x: 107 * 16, y: 12 * 16 },
            { type: 'goomba', x: 124 * 16, y: 12 * 16 }
        ];

        return {
            tileMap: map,
            enemySpawns,
            marioSpawn: { x: 40, y: 190 }
        };
    }
}