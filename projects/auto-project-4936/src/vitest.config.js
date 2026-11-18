```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    env: {
      DB_PATH: './data/test-linkbox.db',
      JWT_SECRET: 'test-secret-key-for-vitest',
      PORT: '0', // random port for tests
    },
  },
});
```