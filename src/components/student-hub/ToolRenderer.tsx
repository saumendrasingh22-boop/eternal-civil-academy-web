"use client";

import React from "react";
import {
  CutOffCalculatorTool,
  ExamMarksCalculatorTool,
  AgeEligibilityCalculatorTool,
  AllIndiaRankPredictorTool,
  SalaryCalculatorTool,
  GovernmentJobFinderTool,
} from "./CalculatorTools";
import {
  AutomaticRevisionSystemTool,
  PersonalStudyPlannerTool,
  PyqTrendAnalyzerTool,
  MyStudyLibraryTool,
} from "./StudyAndRevisionTools";
import {
  OmrSheetTool,
  QuizBattleTool,
  ScoreCardGeneratorTool,
  DailyCurrentAffairsQuizTool,
} from "./PracticeAndBattleTools";

export default function ToolRenderer({ slug }: { slug: string }) {
  switch (slug) {
    case "cut-off-calculator":
      return <CutOffCalculatorTool />;
    case "exam-marks-calculator":
      return <ExamMarksCalculatorTool />;
    case "age-eligibility-calculator":
      return <AgeEligibilityCalculatorTool />;
    case "all-india-rank-predictor":
      return <AllIndiaRankPredictorTool />;
    case "salary-calculator":
      return <SalaryCalculatorTool />;
    case "government-job-finder":
      return <GovernmentJobFinderTool />;
    case "automatic-revision-system":
      return <AutomaticRevisionSystemTool />;
    case "personal-study-planner":
      return <PersonalStudyPlannerTool />;
    case "pyq-trend-analyzer":
      return <PyqTrendAnalyzerTool />;
    case "my-study-library":
      return <MyStudyLibraryTool />;
    case "omr-sheet-generator-checker":
      return <OmrSheetTool />;
    case "quiz-battle":
      return <QuizBattleTool />;
    case "score-card-generator":
      return <ScoreCardGeneratorTool />;
    case "daily-current-affairs-quiz":
      return <DailyCurrentAffairsQuizTool />;
    default:
      return <CutOffCalculatorTool />;
  }
}
