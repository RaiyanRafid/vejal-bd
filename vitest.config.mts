import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = { "@": path.resolve(import.meta.dirname, "src") };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/lib/**/*.test.{ts,tsx}"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          name: "int",
          include: ["tests/int/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/int/global-setup.ts"],
          fileParallelism: false,
        },
      },
    ],
  },
});
