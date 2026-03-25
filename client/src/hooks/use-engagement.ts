import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { fetchApi } from "@/lib/api-client";
import { z } from "zod";

export function useStudentEngagement(studentId: number, range: string = '7') {
  return useQuery({
    queryKey: [api.engagement.student.path, studentId, range],
    queryFn: async () => {
      let url = buildUrl(api.engagement.student.path, { id: studentId });
      url += `?range=${range}`;
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
