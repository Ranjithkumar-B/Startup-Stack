import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { fetchApi } from "@/lib/api-client";
import { z } from "zod";

export function useStudentEngagement(studentId: number) {
  return useQuery({
    queryKey: [api.engagement.student.path, studentId],
    queryFn: async () => {
      const url = buildUrl(api.engagement.student.path, { id: studentId });
      const data = await fetchApi(url);
      return data;
    },
    enabled: !!studentId,
  });
}

export function useLogEngagement() {
  return useMutation({
    mutationFn: async (event: z.infer<typeof api.engagement.log.input>) => {
      const data = await fetchApi(api.engagement.log.path, {
        method: "POST",
        body: JSON.stringify(event),
      });
      return data;
    },
  });
}
