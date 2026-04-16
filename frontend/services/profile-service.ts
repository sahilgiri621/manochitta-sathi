import { api } from "@/lib/api"
import type { Profile } from "@/lib/types"

export const profileService = {
  getMyProfile(): Promise<Profile> {
    return api.getProfile()
  },
  updateMyProfile(payload: Partial<Profile>): Promise<Profile> {
    return api.updateProfile(payload)
  },
}
