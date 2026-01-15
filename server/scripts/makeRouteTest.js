import fs from "fs";

const route = process.argv[2];
if (!route) {
    throw new Error("Usage: node makeRouteTest.js <routeName>");
}

const name = route.charAt(0).toUpperCase() + route.slice(1);
const template = `
import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import ${route}Route from "../src/routers/${route}Route.js";

vi.mock("../src/prismaClient.js", () => ({
  default: {
    ${route}: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "../src/prismaClient.js";

const app = express();
app.use(express.json());
app.use("/api/${route}", ${route}Route);

describe("${name} API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /api/${route} should return data", async () => {
    prisma.${route}.findMany.mockResolvedValue([{ Id: 1, Name: "${name}" }]);
    const res = await request(app).get("/api/${route}");
    expect(res.statusCode).toBe(200);
  });
});
`;

fs.writeFileSync(`tests/${route}Route.test.js`, template.trim());
