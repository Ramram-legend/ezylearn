/**
 * Types partages entre les routes API, correspondant au schema Supabase
 * defini dans supabase/schema.sql.
 */

export type AgeGroup = 'enfant' | 'college_lycee' | 'etudiant_adulte';

export type Plan = 'gratuit' | 'plus' | 'famille' | 'etablissement';

export interface Profile {
  id: string;
  display_name: string | null;
  age: number;
  age_group: AgeGroup;
  interests: string[];
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export interface InterestCatalogItem {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

/** Version envoyee au client : ne contient jamais la reponse correcte. */
export type PublicQuizQuestion = Omit<QuizQuestion, 'correct_index'>;

export interface InteractiveVisualization {
  type: 'svg' | 'threejs' | null;
  code: string;
  caption: string;
  controls: string[];
}

export interface LessonSection {
  heading: string;
  body_markdown: string;
  visualization: InteractiveVisualization | null;
}

export interface LessonVisualStep {
  title: string;
  text: string;
}

export interface LessonWebPhoto {
  url: string;
  caption?: string;
  source?: string;
}

export interface AnimationElement {
  id: string;
  type: 'circle' | 'rect' | 'arrow' | 'label' | 'particle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  glowColor?: string;
  label?: string;
  spin?: boolean;
  pulse?: boolean;
  float?: boolean;
  connectTo?: string[];
  visibleInSteps?: string[];
}

export interface AnimationStep {
  id: string;
  label: string;
  description: string;
  color?: string;
  highlights?: string[];
  challenge?: 
    | {
        type?: 'quiz'; // Backward compatibility
        question: string;
        options: string[];
        correct: number;
      }
    | {
        type: 'drag-drop';
        instruction: string;
        draggables: string[];
        dropZones: { id: string; label: string; expectedDraggable: string }[];
      };
}

export interface AnimationData {
  title: string;
  theme?: 'space' | 'biology' | 'chemistry' | 'physics' | 'tech' | 'default';
  elements: AnimationElement[];
  steps: AnimationStep[];
  finalQuiz?: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

export interface LessonContent {
  title: string;
  svg: string;
  animation_data?: AnimationData;
  explanation: string;
  fun_fact: string;
  web_photo?: LessonWebPhoto;
  illustrative_photos?: LessonWebPhoto[];
  visual_steps?: LessonVisualStep[];
  sections?: LessonSection[];
  chapter_index?: number;
  total_chapters?: number;
  previous_summary?: string;
  is_completed?: boolean;
  parent_lesson_id?: string;
}

export interface Lesson {
  id: string;
  user_id: string;
  topic: string;
  subject: string;
  level: string;
  content: LessonContent;
  quiz: QuizQuestion[];
  created_at: string;
  parent_lesson_id?: string;
}

export interface UserStats {
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  lessons_completed: number;
  quizzes_completed: number;
  updated_at: string;
}

export interface Badge {
  id: string;
  code: string;
  label: string;
  icon: string;
  description: string;
  condition_type: 'lessons_count' | 'perfect_score' | 'streak';
  condition_value: number;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
}

/** Corps de requete accepte par POST /api/profile */
export interface ProfileInput {
  display_name?: string;
  age: number;
  interests: string[];
}

/** Corps de requete accepte par POST /api/lessons/generate */
export interface GenerateLessonInput {
  topic: string;
  subject?: string;
  level?: string;
  age?: number;
  interests?: string[];
}

/** Corps de requete accepte par POST /api/lessons/continue */
export interface ContinueLessonInput {
  lessonId: string;
  age?: number;
  interests?: string[];
}

/** Corps de requete accepte par POST /api/quiz/submit */
export interface SubmitQuizInput {
  lessonId: string;
  answers: number[];
}
