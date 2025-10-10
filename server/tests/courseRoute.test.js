import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import courseRoute from "../src/routers/courseRoute.js";

// 🧠 Mock the model used by the controller
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
  // POST /api/course
  // ------------------------
  it("POST /api/course should create a course successfully", async () => {
    const newCourse = { name: "Test Course", description: "Some description" };
    const created = { id: 1, ...newCourse };

    courseModel.create.mockResolvedValue(created);

    const res = await request(app).post("/api/course").send(newCourse);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(created);
    expect(courseModel.create).toHaveBeenCalledWith(newCourse);
  });

  it("POST /api/course should return 400 if fields are missing", async () => {
    const res = await request(app).post("/api/course").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Name and description are required" });
    expect(courseModel.create).not.toHaveBeenCalled();
  });

  // ------------------------
  // DELETE /api/course/:id
  // ------------------------
  it("DELETE /api/course/:id should delete a course successfully", async () => {
    const deleted = { id: 1, name: "Deleted Course" };
    courseModel.delete.mockResolvedValue(deleted);

    const res = await request(app).delete("/api/course/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(deleted);
    expect(courseModel.delete).toHaveBeenCalledWith(1);
  });

  it("DELETE /api/course/:id should return 404 if not found", async () => {
    courseModel.delete.mockResolvedValue(null);

    const res = await request(app).delete("/api/course/999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "Course not found" });
  });

  it("DELETE /api/course/:id should handle errors gracefully", async () => {
    courseModel.delete.mockRejectedValue(new Error("DB error"));
    const res = await request(app).delete("/api/course/1");
    expect(res.statusCode).toBe(500);
  });

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
