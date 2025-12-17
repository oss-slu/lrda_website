import { useQuery } from "@tanstack/react-query";
import ApiService from "../../utils/api_service";
import { UserData } from "@/app/types";

// Query key factory for users
export const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
};

/**
 * Hook for fetching user data by ID
 */
export function useUserData(userId: string | null) {
  return useQuery({
    queryKey: userKeys.detail(userId ?? ""),
    queryFn: async (): Promise<UserData | null> => {
      if (!userId) return null;
      return await ApiService.fetchUserData(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Hook for fetching creator name by ID
 */
export function useCreatorName(creatorId: string | null) {
  return useQuery({
    queryKey: [...userKeys.detail(creatorId ?? ""), "name"],
    queryFn: async (): Promise<string> => {
      if (!creatorId) return "Unknown";
      return await ApiService.fetchCreatorName(creatorId);
    },
    enabled: !!creatorId,
  });
}
