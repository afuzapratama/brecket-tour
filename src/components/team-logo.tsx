import {
  SiAcer,
  SiAlienware,
  SiAmd,
  SiApple,
  SiAsus,
  SiAtari,
  SiBattledotnet,
  SiBeats,
  SiCorsair,
  SiDell,
  SiDiscord,
  SiEpicgames,
  SiFacebookgaming,
  SiGameloft,
  SiGamejolt,
  SiGenius,
  SiGogdotcom,
  SiHp,
  SiIntel,
  SiLenovo,
  SiMediatek,
  SiMeta,
  SiMsi,
  SiNvidia,
  SiPlaystation,
  SiRazer,
  SiRepublicofgamers,
  SiRiotgames,
  SiRockstargames,
  SiSamsung,
  SiSega,
  SiSteam,
  SiSteelseries,
  SiTwitch,
  SiUbisoft,
  SiUnrealengine,
  SiValorant,
  SiWegame,
  SiYoutubegaming,
} from "react-icons/si";
import type { IconType } from "react-icons";
import Image from "next/image";

import { cn } from "@/lib/utils";

const fallbackIcons = [
  SiValorant,
  SiRiotgames,
  SiSteam,
  SiEpicgames,
  SiBattledotnet,
  SiTwitch,
  SiYoutubegaming,
  SiDiscord,
  SiPlaystation,
  SiWegame,
  SiGamejolt,
  SiUbisoft,
  SiRockstargames,
  SiSega,
  SiAtari,
  SiGogdotcom,
  SiGameloft,
  SiUnrealengine,
  SiRazer,
  SiRepublicofgamers,
  SiSteelseries,
  SiCorsair,
  SiAlienware,
  SiNvidia,
  SiAmd,
  SiIntel,
  SiAsus,
  SiAcer,
  SiLenovo,
  SiDell,
  SiHp,
  SiSamsung,
  SiApple,
  SiMeta,
  SiFacebookgaming,
  SiMsi,
  SiMediatek,
  SiBeats,
  SiGenius,
] satisfies IconType[];

export const teamLogoIconCount = fallbackIcons.length;

type TeamLogoProps = {
  name: string;
  logoUrl?: string | null;
  iconKey?: number | null;
  className?: string;
};

function fallbackIndex(name: string, iconKey?: number | null) {
  if (typeof iconKey === "number") {
    return Math.abs(iconKey) % fallbackIcons.length;
  }

  let hash = 0;

  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % fallbackIcons.length;
  }

  return hash;
}

export function TeamLogo({
  name,
  logoUrl,
  iconKey,
  className,
}: TeamLogoProps) {
  if (logoUrl) {
    return (
      <span
        className={cn(
          "relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/5",
          className,
        )}
      >
        <Image
          alt={`${name} logo`}
          className="object-cover"
          fill
          sizes="24px"
          src={logoUrl}
          unoptimized
        />
      </span>
    );
  }

  const Icon = fallbackIcons[fallbackIndex(name, iconKey)];

  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
        className,
      )}
      title={`${name} fallback logo`}
    >
      <Icon className="size-[70%]" />
    </span>
  );
}
