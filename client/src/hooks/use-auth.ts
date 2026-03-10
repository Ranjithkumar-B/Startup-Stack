import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { fetchApi, setAuthToken, clearAuthToken } from "@/lib/api-client";
import { z } from "zod";

export function useAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      try {
        const data = await fetchApi(api.auth.me.path);
        return api.auth.me.responses[200].parse(data);
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const data = await fetchApi(api.auth.login.path, {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      const parsed = api.auth.login.responses[200].parse(data);
      setAuthToken(parsed.token);
      return parsed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.register.input>) => {
      const data = await fetchApi(api.auth.register.path, {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      const parsed = api.auth.register.responses[201].parse(data);
      setAuthToken(parsed.token);
      return parsed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });

  const logout = () => {
    clearAuthToken();
    queryClient.setQueryData([api.auth.me.path], null);
    queryClient.clear();
    window.location.href = "/login";
  };

  return {
    user: meQuery.data,
    isLoading: meQuery.isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
