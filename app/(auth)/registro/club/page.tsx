import type { Metadata } from "next"
import Link from "next/link"
import { GalleryVerticalEndIcon } from "lucide-react"

import { ClubOnboardingWizard } from "@/components/club-onboarding-wizard"

export const metadata: Metadata = {
  title: "Registra tu club",
  description:
    "Crea tu cuenta de propietario para administrar tu club, ligas y torneos.",
}

export default function RegistroClubPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Bracketpad
        </Link>
        <ClubOnboardingWizard />
      </div>
    </div>
  )
}
