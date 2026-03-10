import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { fetchApi } from "@/lib/api-client";
import { z } from "zod";

export function useCourses() {
  return useQuery({
    queryKey: [api.courses.list.path],
    queryFn: async () => {
      const data = await fetchApi(api.courses.list.path);
      return data; // using z.custom<any>() in schema
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseData: { title: string; description: string }) => {
      const data = await fetchApi(api.courses.create.path, {
        method: "POST",
        body: JSON.stringify(courseData),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
    },
  });
}
