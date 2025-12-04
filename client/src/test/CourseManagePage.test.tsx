import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseManagePage from '../pages/mentor/CourseManagePage';
import { courseManagementApi } from '../api/courseManagement';
import type { UiCourseStructure, UiModule, UiLesson, UiExam } from '../types/manage';
import type { ExamQuestion } from '../types/exam';

vi.mock('../api/courseManagement');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  };
});

vi.mock('../components/manage/lesson/LessonUploadForm', () => ({
  default: ({ onSuccess }: { onSuccess: (data: { Id: number; Title: string; Content: string; VideoUrl: string | null; DocUrl: string | null }) => void; onError?: (_error: Error) => void }) => (
    <form data-testid="lesson-form" onSubmit={(e) => {
      e.preventDefault();
      onSuccess({
        Id: 100,
        Title: 'New Lesson',
        Content: 'Lesson content',
        VideoUrl: null,
        DocUrl: null,
      });
    }}>
      <button type="submit" data-testid="lesson-submit">Upload Lesson</button>
    </form>
  ),
}));

describe('CourseManagePage - Mentor Course Management', () => {
  const mockExamQuestions: ExamQuestion[] = [
    {
      ExamQuestionId: '1',
      QuestionBankId: '1',
      Type: 'MCQ',
      QuestionText: 'What is React?',
      Answers: [
        { Id: '1', AnswerText: 'A library' },
        { Id: '2', AnswerText: 'A framework' },
      ],
    },
  ];

  const mockExam: UiExam = {
    id: 1,
    title: 'Midterm Exam',
    order: 20,
    questions: mockExamQuestions,
  };

  const mockLessons: UiLesson[] = [
    {
      id: 1,
      title: 'Introduction to React',
      description: 'Learn React basics',
      order: 10,
      resources: [
        { id: 1, name: 'video', url: 'https://example.com/video.mp4' },
      ],
    },
    {
      id: 2,
      title: 'React Hooks',
      description: 'Learn about React Hooks',
      order: 20,
      resources: [],
    },
  ];

  const mockModules: UiModule[] = [
    {
      id: 1,
      title: 'Module 1: Basics',
      order: 10,
      lessons: mockLessons,
      exams: [mockExam],
    },
    {
      id: 2,
      title: 'Module 2: Advanced',
      order: 20,
      lessons: [],
      exams: [],
    },
  ];

  const mockCourseStructure: UiCourseStructure = {
    course: {
      Id: 1,
      Name: 'React Course',
      Description: 'Learn React',
    },
    modules: mockModules,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.prompt = vi.fn(() => 'New Module Title');
  });

  describe('Happy Path - Load Course Data', () => {
    it('should render page with course title', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/Manage Course Content/)).toBeInTheDocument();
      });
    });

    it('should load course structure on mount', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(courseManagementApi.getStructure).toHaveBeenCalledWith(1);
      });
    });

    it('should display all modules', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 1: Basics/)).not.toHaveLength(0);
        expect(screen.getAllByText(/Module 2: Advanced/)).not.toHaveLength(0);
      });
    });

    it('should display module lessons', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
        expect(screen.getByText('React Hooks')).toBeInTheDocument();
      });
    });

    it('should display module exam if present', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });
    });

    it('should display exam questions count', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        const elements = screen.getAllByText(/Number of questions: 1/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display lesson resources', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('video')).toBeInTheDocument();
      });
    });
  });

  describe('Module Management - Create Module', () => {
    it('should add new module when + Module button clicked', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      const newModule: UiModule = {
        id: 3,
        title: 'New Module Title',
        order: 30,
        lessons: [],
      };
      vi.mocked(courseManagementApi.createModule).mockResolvedValue(newModule);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 1: Basics/)).not.toHaveLength(0);
      });

      const addModuleBtn = screen.getAllByText('+ Module')[0];
      await userEvent.click(addModuleBtn);

      await waitFor(() => {
        expect(global.prompt).toHaveBeenCalled();
        expect(courseManagementApi.createModule).toHaveBeenCalledWith(1, 'New Module Title');
      });
    });

    it('should display new module in list after creation', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      const newModule: UiModule = {
        id: 3,
        title: 'New Module Title',
        order: 30,
        lessons: [],
      };
      vi.mocked(courseManagementApi.createModule).mockResolvedValue(newModule);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 1: Basics/)).not.toHaveLength(0);
      });

      const addModuleBtn = screen.getAllByText('+ Module')[0];
      await userEvent.click(addModuleBtn);

      await waitFor(() => {
        expect(screen.getAllByText(/New Module Title/)).not.toHaveLength(0);
      });
    });

    it('should not create module when prompt cancelled', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      global.prompt = vi.fn(() => null);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 1: Basics/)).not.toHaveLength(0);
      });

      const addModuleBtn = screen.getAllByText('+ Module')[0];
      await userEvent.click(addModuleBtn);

      expect(courseManagementApi.createModule).not.toHaveBeenCalled();
    });

    it('should trim module title before creating', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      const newModule: UiModule = {
        id: 3,
        title: 'Trimmed',
        order: 30,
        lessons: [],
      };
      vi.mocked(courseManagementApi.createModule).mockResolvedValue(newModule);
      global.prompt = vi.fn(() => '  Trimmed  ');

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 1: Basics/)).not.toHaveLength(0);
      });

      const addModuleBtn = screen.getAllByText('+ Module')[0];
      await userEvent.click(addModuleBtn);

      await waitFor(() => {
        expect(courseManagementApi.createModule).toHaveBeenCalledWith(1, 'Trimmed');
      });
    });
  });

  describe('Lesson Management - Add Lesson', () => {
    it('should open lesson upload form when + Lesson clicked', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      const lessonBtns = screen.getAllByText('+ Lesson');
      await userEvent.click(lessonBtns[0]);

      await waitFor(() => {
        expect(screen.getByTestId('lesson-form')).toBeInTheDocument();
      });
    });

    it('should add lesson to module after upload', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      const lessonBtns = screen.getAllByText('+ Lesson');
      await userEvent.click(lessonBtns[0]);

      await waitFor(() => {
        expect(screen.getByTestId('lesson-form')).toBeInTheDocument();
      });

      const submitBtn = screen.getByTestId('lesson-submit');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getAllByText(/New Lesson/)).not.toHaveLength(0);
      });
    });

    it('should close lesson form after successful upload', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      const lessonBtns = screen.getAllByText('+ Lesson');
      await userEvent.click(lessonBtns[0]);

      await waitFor(() => {
        expect(screen.getByTestId('lesson-form')).toBeInTheDocument();
      });

      const submitBtn = screen.getByTestId('lesson-submit');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('lesson-form')).not.toBeInTheDocument();
      });
    });

    it('should close lesson form when Close button clicked', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      const lessonBtns = screen.getAllByText('+ Lesson');
      await userEvent.click(lessonBtns[0]);

      await waitFor(() => {
        expect(screen.getByTestId('lesson-form')).toBeInTheDocument();
      });

      const closeBtns = screen.getAllByText('Close');
      await userEvent.click(closeBtns[0]);

      expect(screen.queryByTestId('lesson-form')).not.toBeInTheDocument();
    });
  });

  describe('Exam Management - Create Exam', () => {
    it('should show + Exam button for module without exam', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 2: Advanced/)).not.toHaveLength(0);
      });

      const buttons = screen.getAllByText('+ Exam');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should open exam creation form when + Exam clicked', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 2: Advanced/)).not.toHaveLength(0);
      });

      const examBtns = screen.getAllByText('+ Exam');
      await userEvent.click(examBtns[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Exam title')).toBeInTheDocument();
      });
    });

    it('should create exam with provided title', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      const newExam: UiExam = {
        id: 2,
        title: 'Final Exam',
        order: 30,
        questions: [],
      };
      vi.mocked(courseManagementApi.createExam).mockResolvedValue(newExam);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 2: Advanced/)).not.toHaveLength(0);
      });

      const examBtns = screen.getAllByText('+ Exam');
      await userEvent.click(examBtns[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Exam title')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Exam title') as HTMLInputElement;
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Final Exam');

      const createBtns = screen.getAllByText('Create');
      await userEvent.click(createBtns[0]);

      await waitFor(() => {
        expect(courseManagementApi.createExam).toHaveBeenCalledWith(2, 'Final Exam');
      });
    });

    it('should show + Exam question button after exam created', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 1: Basics/)).not.toHaveLength(0);
      });

      const buttons = screen.getAllByText('+ Exam question');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should close exam form after creation', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      const newExam: UiExam = {
        id: 2,
        title: 'Final Exam',
        order: 30,
        questions: [],
      };
      vi.mocked(courseManagementApi.createExam).mockResolvedValue(newExam);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 2: Advanced/)).not.toHaveLength(0);
      });

      const examBtns = screen.getAllByText('+ Exam');
      await userEvent.click(examBtns[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Exam title')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Exam title') as HTMLInputElement;
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Final Exam');

      const createBtns = screen.getAllByText('Create');
      await userEvent.click(createBtns[0]);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Exam title')).not.toBeInTheDocument();
      });
    });
  });

  describe('Question Management - Create New Question', () => {
    it('should open add question modal when + Exam question clicked', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('From QuestionBank')).toBeInTheDocument();
        expect(screen.getByText('Create new')).toBeInTheDocument();
      });
    });

    it('should switch to new question tab', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Create new')).toBeInTheDocument();
      });

      const createNewBtn = screen.getByText('Create new');
      await userEvent.click(createNewBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Question text')).toBeInTheDocument();
      });
    });

    it('should create MCQ question', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      const updatedExam: UiExam = {
        ...mockExam,
        questions: [
          ...mockExam.questions,
          {
            ExamQuestionId: '2',
            QuestionBankId: '2',
            Type: 'MCQ',
            QuestionText: 'New MCQ',
            Answers: [
              { Id: '3', AnswerText: 'Option 1' },
              { Id: '4', AnswerText: 'Option 2' },
            ],
          },
        ],
      };
      vi.mocked(courseManagementApi.createQuestionAndAttach).mockResolvedValue({
        exam: updatedExam,
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Create new')).toBeInTheDocument();
      });

      const createNewBtn = screen.getByText('Create new');
      await userEvent.click(createNewBtn);

      const questionInput = screen.getByPlaceholderText('Question text') as HTMLTextAreaElement;
      await userEvent.type(questionInput, 'New MCQ');

      const optionInputs = screen.getAllByPlaceholderText(/Option \d/);
      await userEvent.type(optionInputs[0], 'Option 1');
      await userEvent.type(optionInputs[1], 'Option 2');

      const createBtn = screen.getByText('Create & Attach');
      await userEvent.click(createBtn);

      await waitFor(() => {
        expect(courseManagementApi.createQuestionAndAttach).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            type: 'MCQ',
            text: 'New MCQ',
          })
        );
      });
    });

    it('should create text question', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      const updatedExam: UiExam = {
        ...mockExam,
        questions: [
          ...mockExam.questions,
          {
            ExamQuestionId: '2',
            QuestionBankId: '2',
            Type: 'Essay',
            QuestionText: 'New Essay',
            Answers: [],
          },
        ],
      };
      vi.mocked(courseManagementApi.createQuestionAndAttach).mockResolvedValue({
        exam: updatedExam,
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Create new')).toBeInTheDocument();
      });

      const createNewBtn = screen.getByText('Create new');
      await userEvent.click(createNewBtn);

      const typeSelect = screen.getByDisplayValue('Multiple Choice');
      await userEvent.selectOptions(typeSelect, 'Text');

      const questionInput = screen.getByPlaceholderText('Question text') as HTMLTextAreaElement;
      await userEvent.type(questionInput, 'New Essay');

      const createBtn = screen.getByText('Create & Attach');
      await userEvent.click(createBtn);

      await waitFor(() => {
        expect(courseManagementApi.createQuestionAndAttach).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            type: 'Essay',
            text: 'New Essay',
          })
        );
      });
    });

    it('should not create question with empty text', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Create new')).toBeInTheDocument();
      });

      const createNewBtn = screen.getByText('Create new');
      await userEvent.click(createNewBtn);

      const createBtn = screen.getByText('Create & Attach');
      await userEvent.click(createBtn);

      expect(courseManagementApi.createQuestionAndAttach).not.toHaveBeenCalled();
    });
  });

  describe('Question Management - From Question Bank', () => {
    it('should search questions in bank', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      vi.mocked(courseManagementApi.searchQuestions).mockResolvedValue({
        items: [
          { id: '1', text: 'Found Question', type: 'MCQ' },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('From QuestionBank')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Tìm câu hỏi/);
      await userEvent.type(searchInput, 'test', { delay: 10 });

      await waitFor(() => {
        expect(screen.getByText('Found Question')).toBeInTheDocument();
      });
    });

    it('should add question from bank to exam', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      vi.mocked(courseManagementApi.searchQuestions).mockResolvedValue({
        items: [
          { id: '1', text: 'Bank Question', type: 'MCQ' },
        ],
      });
      const updatedExam: UiExam = {
        ...mockExam,
        questions: [
          ...mockExam.questions,
          {
            ExamQuestionId: '2',
            QuestionBankId: '2',
            Type: 'MCQ',
            QuestionText: 'Bank Question',
            Answers: [],
          },
        ],
      };
      vi.mocked(courseManagementApi.addExistingQuestion).mockResolvedValue(updatedExam);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('From QuestionBank')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Tìm câu hỏi/);
      await userEvent.type(searchInput, 'test', { delay: 10 });

      await waitFor(() => {
        expect(screen.getByText('Bank Question')).toBeInTheDocument();
      });

      const addBtn = screen.getByText('Add to Exam');
      await userEvent.click(addBtn);

      await waitFor(() => {
        expect(courseManagementApi.addExistingQuestion).toHaveBeenCalledWith(1, '1', 1);
      });
    });

    it('should debounce question search', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      vi.mocked(courseManagementApi.searchQuestions).mockResolvedValue({
        items: [],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('From QuestionBank')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Tìm câu hỏi/);
      await userEvent.type(searchInput, 'a', { delay: 10 });
      await userEvent.type(searchInput, 'b', { delay: 10 });
      await userEvent.type(searchInput, 'c', { delay: 10 });

      await new Promise(resolve => setTimeout(resolve, 400));

      expect(courseManagementApi.searchQuestions).toHaveBeenCalledTimes(1);
    });

    it('should clear results when search empty', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('From QuestionBank')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Tìm câu hỏi/) as HTMLInputElement;
      await userEvent.type(searchInput, 'query', { delay: 10 });

      await new Promise(resolve => setTimeout(resolve, 400));

      await userEvent.clear(searchInput);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByText(/Không có câu hỏi/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Empty States', () => {
    it('should show message when no modules exist', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/No modules yet/)).toBeInTheDocument();
      });
    });

    it('should show message when module has no lessons', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [
          {
            id: 1,
            title: 'Empty Module',
            order: 10,
            lessons: [],
          },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/No lessons yet/)).toBeInTheDocument();
      });
    });

    it('should show message when no exams exist', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [
          {
            id: 1,
            title: 'Module',
            order: 10,
            lessons: [],
          },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/No exams yet/)).toBeInTheDocument();
      });
    });

    it('should show message when exam has no questions', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [
          {
            id: 1,
            title: 'Module',
            order: 10,
            lessons: [],
            exams: [{
              id: 1,
              title: 'Empty Exam',
              order: 10,
              questions: [],
            }],
          },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/No questions yet/)).toBeInTheDocument();
      });
    });

    it('should handle course with no course module data', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        course: mockCourseStructure.course,
        modules: [],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/Manage Course Content/)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases - Special Data', () => {
    it('should handle module with many lessons', async () => {
      const manyLessons: UiLesson[] = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        title: `Lesson ${i + 1}`,
        order: i * 10,
        resources: [],
      }));

      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [
          {
            id: 1,
            title: 'Large Module',
            order: 10,
            lessons: manyLessons,
          },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
        expect(screen.getByText('Lesson 10')).toBeInTheDocument();
      });
    });

    it('should handle exam with many questions', async () => {
      const manyQuestions: ExamQuestion[] = Array.from({ length: 20 }, (_, i) => ({
        ExamQuestionId: String(i),
        QuestionBankId: String(i),
        Type: i % 2 === 0 ? 'MCQ' : 'Essay',
        QuestionText: `Question ${i + 1}`,
        Answers: [],
      }));

      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [
          {
            id: 1,
            title: 'Module',
            order: 10,
            lessons: [],
            exams: [{
              id: 1,
              title: 'Large Exam',
              order: 10,
              questions: manyQuestions,
            }],
          },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/Number of questions: 20/)).toBeInTheDocument();
      });
    });

    it('should handle module with multiple resources per lesson', async () => {
      const lessonsWithResources: UiLesson[] = [
        {
          id: 1,
          title: 'Lesson with Resources',
          order: 10,
          resources: [
            { id: 1, name: 'video', url: 'https://example.com/video.mp4' },
            { id: 2, name: 'document', url: 'https://example.com/doc.pdf' },
            { id: 3, name: 'presentation', url: 'https://example.com/slides.pptx' },
          ],
        },
      ];

      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [
          {
            id: 1,
            title: 'Module',
            order: 10,
            lessons: lessonsWithResources,
          },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('video')).toBeInTheDocument();
        expect(screen.getByText('document')).toBeInTheDocument();
        expect(screen.getByText('presentation')).toBeInTheDocument();
      });
    });

    it('should handle long module and exam titles', async () => {
      const longTitle = 'This is a very long module title that contains a lot of text and describes complex concepts in detail';
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [
          {
            id: 1,
            title: longTitle,
            order: 10,
            lessons: [],
            exams: [{
              id: 1,
              title: 'A very long exam title that describes the comprehensive assessment of all topics covered in the module',
              order: 10,
              questions: [],
            }],
          },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(new RegExp(longTitle.substring(0, 30)))).not.toHaveLength(0);
      });
    });
  });

  describe('Exception Handling', () => {
    it('should handle error when loading course structure', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(courseManagementApi.getStructure).mockRejectedValue(new Error('API Error'));

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/Manage Course Content/)).toBeInTheDocument();
      });
    });

    it('should handle error when creating module', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(courseManagementApi.createModule).mockRejectedValue(new Error('Create error'));

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 1: Basics/)).not.toHaveLength(0);
      });

      const addModuleBtn = screen.getAllByText('+ Module')[0];
      await userEvent.click(addModuleBtn);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should handle error when creating exam', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(courseManagementApi.createExam).mockRejectedValue(new Error('Create error'));

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Module 2: Advanced/)).not.toHaveLength(0);
      });

      const examBtns = screen.getAllByText('+ Exam');
      await userEvent.click(examBtns[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Exam title')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Exam title') as HTMLInputElement;
      await userEvent.type(titleInput, 'Test');

      const createBtn = screen.getByText('Create');
      await userEvent.click(createBtn);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should handle error when searching questions', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(courseManagementApi.searchQuestions).mockRejectedValue(new Error('Search error'));

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('From QuestionBank')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Tìm câu hỏi/);
      await userEvent.type(searchInput, 'test', { delay: 10 });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('UI State Management', () => {
    it('should maintain module state after adding lesson', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      const lessonBtns = screen.getAllByText('+ Lesson');
      await userEvent.click(lessonBtns[0]);

      await waitFor(() => {
        expect(screen.getByTestId('lesson-form')).toBeInTheDocument();
      });

      const submitBtn = screen.getByTestId('lesson-submit');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
        expect(screen.getByText('React Hooks')).toBeInTheDocument();
      });
    });

    it('should maintain exam state after adding question', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue(mockCourseStructure);
      const updatedExam: UiExam = {
        ...mockExam,
        questions: [
          ...mockExam.questions,
          {
            ExamQuestionId: '2',
            QuestionBankId: '2',
            Type: 'MCQ',
            QuestionText: 'New Q',
            Answers: [],
          },
        ],
      };
      vi.mocked(courseManagementApi.createQuestionAndAttach).mockResolvedValue({
        exam: updatedExam,
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getAllByText('Midterm Exam')).not.toHaveLength(0);
      });

      const questionBtns = screen.getAllByText('+ Exam question');
      await userEvent.click(questionBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Create new')).toBeInTheDocument();
      });

      const createNewBtn = screen.getByText('Create new');
      await userEvent.click(createNewBtn);

      const questionInput = screen.getByPlaceholderText('Question text') as HTMLTextAreaElement;
      await userEvent.type(questionInput, 'New Q');

      const createBtn = screen.getByText('Create & Attach');
      await userEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText(/Number of questions: 2/)).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete course creation workflow', async () => {
      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        course: mockCourseStructure.course,
        modules: [],
      });

      const newModule: UiModule = {
        id: 1,
        title: 'New Module',
        order: 10,
        lessons: [],
      };
      vi.mocked(courseManagementApi.createModule).mockResolvedValue(newModule);

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText(/Manage Course Content/)).toBeInTheDocument();
      });

      const addModuleBtn = screen.getAllByText('+ Module')[0];
      await userEvent.click(addModuleBtn);

      await waitFor(() => {
        expect(screen.getAllByText(/New Module/)).not.toHaveLength(0);
      });
    });

    it('should sort modules by order', async () => {
      const unsortedModules: UiModule[] = [
        { id: 3, title: 'Module 3', order: 30, lessons: [] },
        { id: 1, title: 'Module 1', order: 10, lessons: [] },
        { id: 2, title: 'Module 2', order: 20, lessons: [] },
      ];

      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: unsortedModules,
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        const moduleTexts = screen.getAllByText(/Module \d/);
        expect(moduleTexts[0]).toHaveTextContent('Module 1');
        expect(moduleTexts[1]).toHaveTextContent('Module 2');
        expect(moduleTexts[2]).toHaveTextContent('Module 3');
      });
    });

    it('should sort lessons by order within module', async () => {
      const unsortedLessons: UiLesson[] = [
        { id: 3, title: 'Lesson 3', order: 30, resources: [] },
        { id: 1, title: 'Lesson 1', order: 10, resources: [] },
        { id: 2, title: 'Lesson 2', order: 20, resources: [] },
      ];

      vi.mocked(courseManagementApi.getStructure).mockResolvedValue({
        ...mockCourseStructure,
        modules: [
          {
            id: 1,
            title: 'Module',
            order: 10,
            lessons: unsortedLessons,
          },
        ],
      });

      render(<CourseManagePage />);

      await waitFor(() => {
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
        expect(screen.getByText('Lesson 2')).toBeInTheDocument();
        expect(screen.getByText('Lesson 3')).toBeInTheDocument();
      });
    });
  });
});
