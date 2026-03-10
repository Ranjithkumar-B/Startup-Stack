import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { fetchApi } from "@/lib/api-client";

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: [api.analytics.dashboard.path],
    queryFn: async () => {
      const data = await fetchApi(api.analytics.dashboard.path);
      return data;
    },
  });
}

export function useCourseAnalytics(courseId: number) {
  return useQuery({
    queryKey: [api.analytics.course.path, courseId],
    queryFn: async () => {
      const url = buildUrl(api.analytics.course.path, { id: courseId });
      const data = await fetchApi(url);
      return data;
    },
    enabled: !!courseId,
  });
}
