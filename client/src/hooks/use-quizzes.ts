import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

export function useQuizzes(courseId: number) {
  return useQuery({
    queryKey: ["quizzes", courseId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/courses/${courseId}/quizzes`);
      return res.data;
    },
    enabled: !!courseId,
  });
}

export function useQuiz(quizId: number) {
  return useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/quizzes/${quizId}`);
      return res.data;
    },
    enabled: !!quizId,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, title, description, timeLimit }: { courseId: number, title: string, description: string, timeLimit?: number }) => {
      const res = await apiClient.post(`/api/courses/${courseId}/quizzes`, { title, description, timeLimit });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", variables.courseId] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, courseId }: { quizId: number; courseId: number }) => {
      const res = await apiClient.delete(`/api/quizzes/${quizId}`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", variables.courseId] });
    },
  });
}

export function useQuizQuestions(quizId: number) {
  return useQuery({
    queryKey: ["quizQuestions", quizId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/quizzes/${quizId}/questions`);
      return res.data;
    },
    enabled: !!quizId,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, questionText, options, correctOptionIndex }: { quizId: number, questionText: string, options: string[], correctOptionIndex: number }) => {
      const res = await apiClient.post(`/api/quizzes/${quizId}/questions`, { questionText, options, correctOptionIndex });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quizQuestions", variables.quizId] });
    },
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ quizId, answers, courseId }: { quizId: number, answers: Record<string, number>, courseId: number }) => {
      const res = await apiClient.post(`/api/quizzes/${quizId}/submit`, { answers });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] });
    },
  });
}
