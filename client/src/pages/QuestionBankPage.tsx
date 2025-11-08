import { Outlet } from "react-router-dom";
import QuestionBankForm from "../components/questionBank/QuestionBankForm";

export default function QuestionBankPage() {
  return (
    <div className="p-6">
      <QuestionBankForm />
      <Outlet />
    </div>
  );
}
