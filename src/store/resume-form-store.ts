import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resume, WorkHistory, Skill, Education, Language, JobCategory } from '@/types/database';

// =====================================================
// Resume Form Store
// Manages form state with auto-save to localStorage
// =====================================================

export interface ResumeFormState {
  // Current step
  currentStep: number;
  totalSteps: number;

  // Basic Info (Step 1)
  fullName: string;
  fullNameKana: string;
  birthDate: string;
  gender: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;

  // Education
  education: Education[];

  // Desired Position (Step 2)
  desiredJobCategory: JobCategory | '';
  desiredIndustries: string[];
  desiredPositions: string[];
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  desiredWorkLocations: string[];

  // Work Histories (Step 3)
  workHistories: Omit<WorkHistory, 'id' | 'resume_id' | 'user_id' | 'created_at' | 'updated_at'>[];

  // Skills (Step 4)
  skills: Omit<Skill, 'id' | 'resume_id' | 'user_id' | 'created_at' | 'updated_at'>[];

  // Languages & Certifications
  languages: Language[];
  certifications: string[];

  // Additional Notes (Step 5)
  additionalNotes: string;

  // Photo
  photoUrl: string | null;
  photoProcessedUrl: string | null;

  // Generated Content
  aiSummary: string | null;
  aiSelfPR: string | null;
  aiCareerObjective: string | null;

  // Meta
  resumeId: string | null;
  isDirty: boolean;
  lastSavedAt: string | null;
}

interface ResumeFormActions {
  // Navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Basic Info
  setBasicInfo: (info: Partial<Pick<ResumeFormState,
    'fullName' | 'fullNameKana' | 'birthDate' | 'gender' |
    'postalCode' | 'address' | 'phone' | 'email'
  >>) => void;

  // Education
  addEducation: (education: Education) => void;
  updateEducation: (index: number, education: Education) => void;
  removeEducation: (index: number) => void;

  // Desired Position
  setDesiredPosition: (info: Partial<Pick<ResumeFormState,
    'desiredJobCategory' | 'desiredIndustries' | 'desiredPositions' |
    'desiredSalaryMin' | 'desiredSalaryMax' | 'desiredWorkLocations'
  >>) => void;

  // Work Histories
  addWorkHistory: (workHistory: ResumeFormState['workHistories'][0]) => void;
  updateWorkHistory: (index: number, workHistory: ResumeFormState['workHistories'][0]) => void;
  removeWorkHistory: (index: number) => void;

  // Skills
  addSkill: (skill: ResumeFormState['skills'][0]) => void;
  updateSkill: (index: number, skill: ResumeFormState['skills'][0]) => void;
  removeSkill: (index: number) => void;

  // Languages & Certifications
  setLanguages: (languages: Language[]) => void;
  setCertifications: (certifications: string[]) => void;

  // Additional Notes
  setAdditionalNotes: (notes: string) => void;

  // Photo
  setPhoto: (url: string | null, processedUrl?: string | null) => void;

  // AI Generated Content
  setAIContent: (content: Partial<Pick<ResumeFormState,
    'aiSummary' | 'aiSelfPR' | 'aiCareerObjective'
  >>) => void;

  // Meta
  setResumeId: (id: string) => void;
  markSaved: () => void;

  // Load from existing resume
  loadResume: (resume: Resume, workHistories: WorkHistory[], skills: Skill[]) => void;

  // Reset
  reset: () => void;
}

const initialState: ResumeFormState = {
  currentStep: 1,
  totalSteps: 5,
  fullName: '',
  fullNameKana: '',
  birthDate: '',
  gender: '',
  postalCode: '',
  address: '',
  phone: '',
  email: '',
  education: [],
  desiredJobCategory: '',
  desiredIndustries: [],
  desiredPositions: [],
  desiredSalaryMin: null,
  desiredSalaryMax: null,
  desiredWorkLocations: [],
  workHistories: [],
  skills: [],
  languages: [],
  certifications: [],
  additionalNotes: '',
  photoUrl: null,
  photoProcessedUrl: null,
  aiSummary: null,
  aiSelfPR: null,
  aiCareerObjective: null,
  resumeId: null,
  isDirty: false,
  lastSavedAt: null,
};

export const useResumeFormStore = create<ResumeFormState & ResumeFormActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps) {
          set({ currentStep: currentStep + 1 });
        }
      },
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      setBasicInfo: (info) => set({ ...info, isDirty: true }),

      addEducation: (education) => set((state) => ({
        education: [...state.education, education],
        isDirty: true,
      })),
      updateEducation: (index, education) => set((state) => ({
        education: state.education.map((e, i) => i === index ? education : e),
        isDirty: true,
      })),
      removeEducation: (index) => set((state) => ({
        education: state.education.filter((_, i) => i !== index),
        isDirty: true,
      })),

      setDesiredPosition: (info) => set({ ...info, isDirty: true }),

      addWorkHistory: (workHistory) => set((state) => ({
        workHistories: [...state.workHistories, workHistory],
        isDirty: true,
      })),
      updateWorkHistory: (index, workHistory) => set((state) => ({
        workHistories: state.workHistories.map((w, i) => i === index ? workHistory : w),
        isDirty: true,
      })),
      removeWorkHistory: (index) => set((state) => ({
        workHistories: state.workHistories.filter((_, i) => i !== index),
        isDirty: true,
      })),

      addSkill: (skill) => set((state) => ({
        skills: [...state.skills, skill],
        isDirty: true,
      })),
      updateSkill: (index, skill) => set((state) => ({
        skills: state.skills.map((s, i) => i === index ? skill : s),
        isDirty: true,
      })),
      removeSkill: (index) => set((state) => ({
        skills: state.skills.filter((_, i) => i !== index),
        isDirty: true,
      })),

      setLanguages: (languages) => set({ languages, isDirty: true }),
      setCertifications: (certifications) => set({ certifications, isDirty: true }),

      setAdditionalNotes: (notes) => set({ additionalNotes: notes, isDirty: true }),

      setPhoto: (url, processedUrl) => set({
        photoUrl: url,
        photoProcessedUrl: processedUrl || null,
        isDirty: true,
      }),

      setAIContent: (content) => set({ ...content, isDirty: true }),

      setResumeId: (id) => set({ resumeId: id }),
      markSaved: () => set({ isDirty: false, lastSavedAt: new Date().toISOString() }),

      loadResume: (resume, workHistories, skills) => set({
        resumeId: resume.id,
        fullName: resume.full_name || '',
        fullNameKana: resume.full_name_kana || '',
        birthDate: resume.birth_date || '',
        gender: resume.gender || '',
        postalCode: resume.postal_code || '',
        address: resume.address || '',
        phone: resume.phone || '',
        email: resume.email || '',
        education: resume.education || [],
        desiredJobCategory: resume.desired_job_category || '',
        desiredIndustries: resume.desired_industries || [],
        desiredPositions: resume.desired_positions || [],
        desiredSalaryMin: resume.desired_salary_min,
        desiredSalaryMax: resume.desired_salary_max,
        desiredWorkLocations: resume.desired_work_locations || [],
        languages: resume.languages || [],
        certifications: resume.certifications || [],
        photoUrl: resume.photo_url,
        photoProcessedUrl: resume.photo_processed_url,
        aiSummary: resume.ai_summary,
        aiSelfPR: resume.ai_self_pr,
        aiCareerObjective: resume.ai_career_objective,
        workHistories: workHistories.map((wh) => ({
          company_name: wh.company_name,
          company_name_hidden: wh.company_name_hidden,
          industry: wh.industry,
          employee_count: wh.employee_count,
          position: wh.position,
          department: wh.department,
          job_category: wh.job_category,
          employment_type: wh.employment_type,
          start_date: wh.start_date,
          end_date: wh.end_date,
          is_current: wh.is_current,
          description: wh.description,
          achievements: wh.achievements,
          ai_description: wh.ai_description,
          ai_achievements: wh.ai_achievements,
          display_order: wh.display_order,
        })),
        skills: skills.map((s) => ({
          skill_name: s.skill_name,
          skill_type: s.skill_type,
          proficiency_level: s.proficiency_level,
          years_of_experience: s.years_of_experience,
        })),
        isDirty: false,
        lastSavedAt: resume.updated_at,
      }),

      reset: () => set(initialState),
    }),
    {
      name: 'resume-form-storage',
      partialize: (state) => ({
        // Only persist form data, not meta
        fullName: state.fullName,
        fullNameKana: state.fullNameKana,
        birthDate: state.birthDate,
        gender: state.gender,
        postalCode: state.postalCode,
        address: state.address,
        phone: state.phone,
        email: state.email,
        education: state.education,
        desiredJobCategory: state.desiredJobCategory,
        desiredIndustries: state.desiredIndustries,
        desiredPositions: state.desiredPositions,
        desiredSalaryMin: state.desiredSalaryMin,
        desiredSalaryMax: state.desiredSalaryMax,
        desiredWorkLocations: state.desiredWorkLocations,
        workHistories: state.workHistories,
        skills: state.skills,
        languages: state.languages,
        certifications: state.certifications,
        additionalNotes: state.additionalNotes,
        currentStep: state.currentStep,
      }),
    }
  )
);
