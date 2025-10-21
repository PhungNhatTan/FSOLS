import request from "supertest";
import { describe, it, expect, beforeAll, vi } from "vitest";


// Mock the models
vi.mock("../src/middleware/auth.js", () => ({
    default: (req, res, next) => next(),
}));

vi.mock("../src/middleware/role.js", () => ({
    authorize: () => (req, res, next) => next(),
}));

vi.mock("../src/models/exam/index.js", () => ({
    default: {
        create: vi.fn(),
        getExamDetail: vi.fn(),
        getForExam: vi.fn(),
    },
}));

vi.mock("../src/models/examSubmission/index.js", () => ({
    default: {
        getExamResult: vi.fn(),
    },
}));

import app from "../src/app.js";
import examModel from "../src/models/exam/index.js";
import examSubmission from "../src/models/examSubmission/index.js";

describe("Exam Routes", () => {
    const fakeExam = { id: 1, name: "Final Exam", description: "Test exam" };

    beforeAll(() => {
        console.log("Mock check:", examModel);
        // optional setup code
    });

    // ------------------------------------------------------
    // POST /api/exam
    // ------------------------------------------------------
    it("should create a new exam", async () => {
        examModel.create.mockResolvedValue(fakeExam);

        const res = await request(app)
            .post("/api/exam")
            .send({ name: "Final Exam", description: "Test exam" });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(fakeExam);
        expect(examModel.create).toHaveBeenCalledWith({
            name: "Final Exam",
            description: "Test exam",
        });
    });

    it("should handle errors in create exam", async () => {
        examModel.create.mockRejectedValue(new Error("DB Error"));

        const res = await request(app)
            .post("/api/exam")
            .send({ name: "Broken Exam" });

        expect(res.status).toBe(500);
    });

    // ------------------------------------------------------
    // GET /api/exam/:id
    // ------------------------------------------------------
    it("should get exam detail with result if user logged in", async () => {
        examModel.getExamDetail.mockResolvedValue(fakeExam);
        examSubmission.getExamResult.mockResolvedValue({ score: 95 });

        // mock middleware to inject user
        app.request.user = { id: 10 };

        const res = await request(app).get("/api/exam/1");

        expect(res.status).toBe(200);
        expect(res.body.exam).toEqual(fakeExam);
        expect(res.body.result).toEqual({ score: 95 });
    });

    it("should return 400 if id is missing", async () => {
        const res = await request(app).get("/api/exam/");
        expect([400, 404]).toContain(res.status); // depends on express match
    });

    it("should return 400 if id is invalid", async () => {
        const res = await request(app).get("/api/exam/abc");
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid exam ID");
    });

    it("should return 404 if exam not found", async () => {
        examModel.getExamDetail.mockResolvedValue(null);

        const res = await request(app).get("/api/exam/999");

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Exam not found");
    });

    it("should handle errors gracefully in get exam", async () => {
        examModel.getExamDetail.mockRejectedValue(new Error("DB fail"));

        const res = await request(app).get("/api/exam/1");
        expect(res.status).toBe(500);
    });

    // ------------------------------------------------------
    // GET /api/exam/takingExam/:id
    // ------------------------------------------------------
    it("should get data for taking exam", async () => {
        const qb = { questions: [{ id: 1, text: "Q1" }] };
        examModel.getForExam.mockResolvedValue(qb);

        const res = await request(app).get("/api/exam/takingExam/1");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(qb);
    });

    it("should return 404 if taking exam not found", async () => {
        examModel.getForExam.mockResolvedValue(null);

        const res = await request(app).get("/api/exam/takingExam/999");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Exam not found");
    });

    it("should handle error in taking exam", async () => {
        examModel.getForExam.mockRejectedValue(new Error("DB fail"));

        const res = await request(app).get("/api/exam/takingExam/1");
        expect(res.status).toBe(500);
    });
});
