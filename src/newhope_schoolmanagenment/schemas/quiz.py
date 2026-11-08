from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

QuestionKind = Literal["multiple_choice", "short_answer"]

MAX_QUESTIONS = 100
MAX_OPTIONS = 6
MIN_OPTIONS = 2


class QuizOptionInput(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    is_correct: bool = False


class QuizQuestionInput(BaseModel):
    prompt: str = Field(min_length=1)
    kind: QuestionKind = "multiple_choice"
    points: Decimal = Field(default=Decimal(1), gt=0, le=1000)
    correct_answer: str | None = Field(default=None, max_length=2000)
    options: list[QuizOptionInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_question(self) -> QuizQuestionInput:
        if self.kind == "multiple_choice":
            if not MIN_OPTIONS <= len(self.options) <= MAX_OPTIONS:
                raise ValueError(
                    "Multiple-choice questions need 2 to 6 options"
                )
            if sum(1 for option in self.options if option.is_correct) != 1:
                raise ValueError("Mark exactly one correct option")
        else:
            if not (self.correct_answer and self.correct_answer.strip()):
                raise ValueError(
                    "Short-answer questions need a correct answer"
                )
            if self.options:
                raise ValueError(
                    "Short-answer questions cannot have options"
                )
        return self


class QuizPayload(BaseModel):
    questions: list[QuizQuestionInput] = Field(
        min_length=1, max_length=MAX_QUESTIONS
    )


class QuizOptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: int
    text: str


class QuizOptionTeacherRead(QuizOptionRead):
    is_correct: bool


class QuizQuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: int
    prompt: str
    kind: str
    points: Decimal
    options: list[QuizOptionRead] = Field(default_factory=list)


class QuizQuestionTeacherRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: int
    prompt: str
    kind: str
    points: Decimal
    correct_answer: str | None = None
    options: list[QuizOptionTeacherRead] = Field(default_factory=list)


class QuizRead(BaseModel):
    assignment_id: int
    questions: list[QuizQuestionRead] = Field(default_factory=list)


class QuizTeacherRead(BaseModel):
    assignment_id: int
    questions: list[QuizQuestionTeacherRead] = Field(default_factory=list)


class QuizAnswerInput(BaseModel):
    question_id: int
    selected_option_id: int | None = None
    answer_text: str | None = Field(default=None, max_length=2000)


class QuizAttemptInput(BaseModel):
    answers: list[QuizAnswerInput] = Field(default_factory=list)


class QuizAnswerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int
    selected_option_id: int | None
    answer_text: str | None
    is_correct: bool
    points_awarded: Decimal


class QuizAttemptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student_id: int
    submission_id: int | None
    score: Decimal
    max_score: Decimal
    submitted_at: datetime
    answers: list[QuizAnswerRead] = Field(default_factory=list)
