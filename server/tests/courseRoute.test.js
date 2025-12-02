import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import courseRoute from "../src/routers/public/courseRoute.js";

vi.mock("../src/models/course/index.js", () => ({
  default: {
    create: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
  },
}));

import courseModel from "../src/models/course/index.js";

const app = express();
app.use(express.json());
app.use("/api/course", courseRoute);

describe("Course Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ------------------------
  // Note: POST and DELETE operations are tested in manage/courseRoute tests
  // This test file focuses on public GET endpoints

  // ------------------------
  // GET /api/course
  // ------------------------
  it("GET /api/course should return a list of courses", async () => {
    const courses = [
      { id: 1, name: "Course 1", description: "Desc 1" },
      { id: 2, name: "Course 2", description: "Desc 2" },
    ];
    courseModel.getAll.mockResolvedValue(courses);
    const res = await request(app).get("/api/course");
    expect(res.statusCode).toBe(200);
    expect(courseModel.getAll).toHaveBeenCalled();
  });

  it("GET /api/course should handle DB errors", async () => {
    courseModel.getAll.mockRejectedValue(new Error("DB error"));
    const res = await request(app).get("/api/course");
    expect(res.statusCode).toBe(500);
  });

  // ------------------------
  // GET /api/course/:id
  // ------------------------
  it("GET /api/course/:id should return a specific course", async () => {
    const course = { id: 1, name: "Math 101", description: "Basic math" };
    courseModel.get.mockResolvedValue(course);

    const res = await request(app).get("/api/course/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(course);
    expect(courseModel.get).toHaveBeenCalledWith(1);
  });

  it("GET /api/course/:id should return 404 if not found", async () => {
    courseModel.get.mockResolvedValue(null);

    const res = await request(app).get("/api/course/999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "Course not found" });
  });

  it("GET /api/course/:id should handle errors gracefully", async () => {
    courseModel.get.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/course/1");
    expect(res.statusCode).toBe(500);
  });
});
