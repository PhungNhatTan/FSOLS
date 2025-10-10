import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import examSubmissionRoute from "../src/routers/examSubmissionRoute.js";

// ✅ mock EXACT paths used inside the controller
vi.mock("../src/models/examSubmission/index.js", () => ({
  default: {
    create: vi.fn(),
    createStudentAnswer: vi.fn(),
    updateScore: vi.fn(),
  },
}));

vi.mock("../src/models/questionBank/index.js", () => ({
  default: {
    get: vi.fn(),
  },
}));

// ✅ Import controller dependencies AFTER mocks are defined
import examSubmissionModel from "../src/models/examSubmission/index.js";
import questionBankModel from "../src/models/questionBank/index.js";

let app;
beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use("/api/examSubmission", examSubmissionRoute);
  vi.clearAllMocks();
});

describe("POST /api/examSubmission/submit", () => {
  it("should handle a valid MCQ submission and return score", async () => {
    examSubmissionModel.create.mockResolvedValue({ Id: "sub1" });
    questionBankModel.get.mockResolvedValue({
      Id: "q1",
      Type: "MCQ",
      ExamAnswer: [
        { Id: "a1", IsCorrect: true },
        { Id: "a2", IsCorrect: false },
      ],
    });
    examSubmissionModel.createStudentAnswer.mockResolvedValue({});
    examSubmissionModel.updateScore.mockResolvedValue({});

    const res = await request(app)
      .post("/api/examSubmission/submit")
      .send({
        examId: "exam1",
        accountId: "acc1",
        answers: [{ questionId: "q1", answerId: "a1" }],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Submission recorded");
    expect(res.body.score).toBe(1);
    expect(examSubmissionModel.updateScore).toHaveBeenCalledWith("sub1", 1);
  });

  it("should handle essay questions without scoring", async () => {
    examSubmissionModel.create.mockResolvedValue({ Id: "sub2" });
    questionBankModel.get.mockResolvedValue({
      Id: "q2",
      Type: "Essay",
      ExamAnswer: [],
    });
    examSubmissionModel.createStudentAnswer.mockResolvedValue({});
    examSubmissionModel.updateScore.mockResolvedValue({});

    const res = await request(app)
      .post("/api/examSubmission/submit")
      .send({
        examId: "exam2",
        accountId: "acc2",
        answers: [{ questionId: "q2", answer: "My essay" }],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Submission recorded");
    expect(res.body.score).toBe(0);
  });

  it("should handle errors gracefully", async () => {
    examSubmissionModel.create.mockRejectedValue(new Error("DB failure"));

    const res = await request(app)
      .post("/api/examSubmission/submit")
      .send({
        examId: "exam3",
        accountId: "acc3",
        answers: [],
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });
});
