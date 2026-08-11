"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recalculateGroupStandings } from "@/lib/tournament/standings-persistence";
import { generateRoundRobinMatches } from "@/lib/tournament/matches";
import {
  buildDefaultQualifierSeeds,
  buildSingleEliminationBracket,
} from "@/lib/tournament/bracket";

const tournamentFormSchema = z.object({
  tournamentId: z.uuid(),
  name: z.string().trim().min(3).max(120),
  game: z.string().trim().min(2).max(80),
  region: z.string().trim().max(80).optional(),
  status: z.enum(["draft", "published", "live", "completed", "archived"]),
  rules: z.string().trim().max(5000).optional(),
  thirdPlaceEnabled: z.boolean(),
});

const participantFormSchema = z.object({
  tournamentId: z.uuid(),
  teamName: z.string().trim().min(2).max(120),
  teamTag: z.string().trim().max(12).optional(),
  country: z.string().trim().max(40).optional(),
  logoUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  seed: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(1).max(999).optional(),
  ),
});

const participantIdSchema = z.object({
  participantId: z.uuid(),
});

const groupFormSchema = z.object({
  tournamentId: z.uuid(),
  name: z.string().trim().min(1).max(40),
  topQualifyCount: z.coerce.number().int().min(1).max(32),
});

const groupIdSchema = z.object({
  groupId: z.uuid(),
});

const groupParticipantFormSchema = z.object({
  groupId: z.uuid(),
  participantId: z.uuid(),
});

const groupParticipantIdSchema = z.object({
  groupParticipantId: z.uuid(),
});

const groupParticipantTmSchema = z.object({
  groupParticipantId: z.uuid(),
  tm: z.coerce.number().int().min(0).max(9999),
});

const updateMatchResultSchema = z.object({
  matchId: z.uuid(),
  scoreA: z.coerce.number().int().min(0).max(99),
  scoreB: z.coerce.number().int().min(0).max(99),
  killsA: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(0).max(999).optional(),
  ),
  killsB: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(0).max(999).optional(),
  ),
  status: z.enum(["scheduled", "live", "completed", "disputed", "cancelled"]),
  scheduledAt: z.string().trim().optional(),
});

const tournamentIdSchema = z.object({
  tournamentId: z.uuid(),
});

async function requireAdminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

function getOptionalText(value?: string) {
  return value && value.length > 0 ? value : null;
}

function getOptionalScheduleDate(value?: string) {
  if (!value) {
    return null;
  }

  const normalizedValue =
    value.length === 16 ? `${value}:00+07:00` : `${value}+07:00`;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function refreshTournamentPages() {
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/playoff");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/teams");
}

async function setAdminFlash(
  message: string,
  type: "success" | "warning" | "info" = "success",
) {
  const cookieStore = await cookies();

  cookieStore.set(
    "admin_flash",
    encodeURIComponent(
      JSON.stringify({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        type,
      }),
    ),
    {
      maxAge: 30,
      path: "/",
      sameSite: "lax",
    },
  );
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export async function updateTournament(formData: FormData) {
  await requireAdminSession();

  const parsed = tournamentFormSchema.parse({
    tournamentId: formData.get("tournamentId"),
    name: formData.get("name"),
    game: formData.get("game"),
    region: formData.get("region"),
    status: formData.get("status"),
    rules: formData.get("rules"),
    thirdPlaceEnabled: formData.get("thirdPlaceEnabled") === "on",
  });

  await prisma.tournament.update({
    where: { id: parsed.tournamentId },
    data: {
      name: parsed.name,
      game: parsed.game,
      region: getOptionalText(parsed.region),
      status: parsed.status,
      rules: getOptionalText(parsed.rules),
      thirdPlaceEnabled: parsed.thirdPlaceEnabled,
    },
  });

  await setAdminFlash("Tournament settings berhasil disimpan.");
  refreshTournamentPages();
}

export async function addTournamentParticipant(formData: FormData) {
  await requireAdminSession();

  const parsed = participantFormSchema.parse({
    tournamentId: formData.get("tournamentId"),
    teamName: formData.get("teamName"),
    teamTag: formData.get("teamTag"),
    country: formData.get("country"),
    logoUrl: formData.get("logoUrl"),
    seed: formData.get("seed"),
  });

  const existingTeam = await prisma.team.findFirst({
    where: { name: { equals: parsed.teamName, mode: "insensitive" } },
  });

  const team =
    existingTeam ??
    (await prisma.team.create({
      data: {
        name: parsed.teamName,
        tag: getOptionalText(parsed.teamTag),
        country: getOptionalText(parsed.country),
        logoUrl: getOptionalText(parsed.logoUrl),
      },
    }));

  if (existingTeam) {
    await prisma.team.update({
      where: { id: existingTeam.id },
      data: {
        tag: getOptionalText(parsed.teamTag) ?? existingTeam.tag,
        country: getOptionalText(parsed.country) ?? existingTeam.country,
        logoUrl: getOptionalText(parsed.logoUrl) ?? existingTeam.logoUrl,
      },
    });
  }

  await prisma.tournamentParticipant.upsert({
    where: {
      tournamentId_teamId: {
        tournamentId: parsed.tournamentId,
        teamId: team.id,
      },
    },
    update: {
      seed: parsed.seed,
      status: "confirmed",
    },
    create: {
      tournamentId: parsed.tournamentId,
      teamId: team.id,
      seed: parsed.seed,
      status: "confirmed",
    },
  });

  await setAdminFlash("Team participant berhasil ditambahkan.");
  refreshTournamentPages();
}

export async function removeTournamentParticipant(formData: FormData) {
  await requireAdminSession();

  const parsed = participantIdSchema.parse({
    participantId: formData.get("participantId"),
  });

  await prisma.tournamentParticipant.delete({
    where: { id: parsed.participantId },
  });

  await setAdminFlash("Team participant berhasil dihapus.", "warning");
  refreshTournamentPages();
}

export async function createGroup(formData: FormData) {
  await requireAdminSession();

  const parsed = groupFormSchema.parse({
    tournamentId: formData.get("tournamentId"),
    name: formData.get("name"),
    topQualifyCount: formData.get("topQualifyCount"),
  });

  const lastGroup = await prisma.group.findFirst({
    where: { tournamentId: parsed.tournamentId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.group.create({
    data: {
      tournamentId: parsed.tournamentId,
      name: parsed.name,
      topQualifyCount: parsed.topQualifyCount,
      sortOrder: (lastGroup?.sortOrder ?? 0) + 1,
      status: "draft",
    },
  });

  await setAdminFlash("Group berhasil dibuat.");
  refreshTournamentPages();
}

export async function deleteGroup(formData: FormData) {
  await requireAdminSession();

  const parsed = groupIdSchema.parse({
    groupId: formData.get("groupId"),
  });

  await prisma.group.delete({
    where: { id: parsed.groupId },
  });

  await setAdminFlash("Group berhasil dihapus.", "warning");
  refreshTournamentPages();
}

export async function assignParticipantToGroup(formData: FormData) {
  await requireAdminSession();

  const parsed = groupParticipantFormSchema.parse({
    groupId: formData.get("groupId"),
    participantId: formData.get("participantId"),
  });

  const targetGroup = await prisma.group.findUnique({
    where: { id: parsed.groupId },
    select: { tournamentId: true },
  });

  if (!targetGroup) {
    await setAdminFlash("Group tidak ditemukan.", "warning");
    refreshTournamentPages();
    return;
  }

  await prisma.groupParticipant.deleteMany({
    where: {
      participantId: parsed.participantId,
      group: {
        tournamentId: targetGroup.tournamentId,
      },
    },
  });

  await prisma.groupParticipant.upsert({
    where: {
      groupId_participantId: {
        groupId: parsed.groupId,
        participantId: parsed.participantId,
      },
    },
    update: {},
    create: {
      groupId: parsed.groupId,
      participantId: parsed.participantId,
    },
  });

  await setAdminFlash("Team berhasil dimasukkan ke group.");
  refreshTournamentPages();
}

export async function removeParticipantFromGroup(formData: FormData) {
  await requireAdminSession();

  const parsed = groupParticipantIdSchema.parse({
    groupParticipantId: formData.get("groupParticipantId"),
  });

  await prisma.groupParticipant.delete({
    where: { id: parsed.groupParticipantId },
  });

  await setAdminFlash("Team berhasil dikeluarkan dari group.", "warning");
  refreshTournamentPages();
}

export async function updateGroupParticipantTm(formData: FormData) {
  await requireAdminSession();

  const parsed = groupParticipantTmSchema.parse({
    groupParticipantId: formData.get("groupParticipantId"),
    tm: formData.get("tm"),
  });

  await prisma.groupParticipant.update({
    where: { id: parsed.groupParticipantId },
    data: { tm: parsed.tm },
  });

  await setAdminFlash("TM berhasil disimpan.");
  refreshTournamentPages();
}

export async function generateGroupMatches(formData: FormData) {
  await requireAdminSession();

  const parsed = groupIdSchema.parse({
    groupId: formData.get("groupId"),
  });

  const group = await prisma.group.findUnique({
    where: { id: parsed.groupId },
    include: {
      participants: {
        include: {
          participant: {
            include: { team: true },
          },
        },
      },
    },
  });

  if (!group || group.participants.length < 2) {
    await setAdminFlash("Generate match gagal: minimal 2 team di group.", "warning");
    refreshTournamentPages();
    return;
  }

  const existingGroupMatchCount = await prisma.match.count({
    where: {
      groupId: group.id,
      stageType: "group",
    },
  });

  const generatedMatches = generateRoundRobinMatches(
    group.participants.map((entry) => ({
      id: entry.participant.id,
      seed: entry.participant.seed,
      team: {
        name: entry.participant.team.name,
        tag: entry.participant.team.tag,
        logoUrl: entry.participant.team.logoUrl,
      },
    })),
  );

  await prisma.$transaction([
    prisma.match.deleteMany({
      where: {
        groupId: group.id,
        stageType: "group",
      },
    }),
    prisma.match.createMany({
      data: generatedMatches.map((match) => ({
        tournamentId: group.tournamentId,
        groupId: group.id,
        stageType: "group" as const,
        roundNumber: match.roundNumber,
        matchNumber: match.matchNumber,
        participantAId: match.participantAId,
        participantBId: match.participantBId,
        status: "scheduled" as const,
      })),
    }),
  ]);

  await recalculateGroupStandings(group.id);
  await setAdminFlash(
    existingGroupMatchCount > 0
      ? "Group matches berhasil digenerate ulang."
      : "Group matches berhasil digenerate.",
  );
  refreshTournamentPages();
}

export async function updateMatchResult(formData: FormData) {
  await requireAdminSession();

  const parsed = updateMatchResultSchema.parse({
    matchId: formData.get("matchId"),
    scoreA: formData.get("scoreA"),
    scoreB: formData.get("scoreB"),
    killsA: formData.get("killsA"),
    killsB: formData.get("killsB"),
    status: formData.get("status"),
    scheduledAt: formData.get("scheduledAt"),
  });

  const winnerParticipantId =
    parsed.scoreA !== parsed.scoreB
      ? parsed.scoreA > parsed.scoreB
        ? formData.get("participantAId")
        : formData.get("participantBId")
      : null;
  const effectiveStatus =
    parsed.status === "scheduled" && winnerParticipantId
      ? "completed"
      : parsed.status;

  const updatedMatch = await prisma.match.update({
    where: { id: parsed.matchId },
    data: {
      scoreA: parsed.scoreA,
      scoreB: parsed.scoreB,
      status: effectiveStatus,
      scheduledAt: getOptionalScheduleDate(parsed.scheduledAt),
      winnerParticipantId:
        typeof winnerParticipantId === "string" ? winnerParticipantId : null,
      locked: effectiveStatus === "completed",
    },
    select: {
      groupId: true,
    },
  });

  if (updatedMatch.groupId) {
    await prisma.matchGame.upsert({
      where: {
        matchId_gameNumber: {
          matchId: parsed.matchId,
          gameNumber: 1,
        },
      },
      update: {
        scoreA: parsed.scoreA,
        scoreB: parsed.scoreB,
        killsA: parsed.killsA ?? 0,
        killsB: parsed.killsB ?? 0,
        deathsA: parsed.killsB ?? 0,
        deathsB: parsed.killsA ?? 0,
        winnerParticipantId:
          typeof winnerParticipantId === "string" ? winnerParticipantId : null,
      },
      create: {
        matchId: parsed.matchId,
        gameNumber: 1,
        scoreA: parsed.scoreA,
        scoreB: parsed.scoreB,
        killsA: parsed.killsA ?? 0,
        killsB: parsed.killsB ?? 0,
        deathsA: parsed.killsB ?? 0,
        deathsB: parsed.killsA ?? 0,
        winnerParticipantId:
          typeof winnerParticipantId === "string" ? winnerParticipantId : null,
      },
    });
  }

  if (updatedMatch.groupId) {
    await recalculateGroupStandings(updatedMatch.groupId);
  }

  await setAdminFlash("Match result berhasil disimpan.");
  refreshTournamentPages();
}

async function advancePlayoffWinner(matchId: string, winnerParticipantId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      bracketId: true,
      roundNumber: true,
      matchNumber: true,
    },
  });

  if (!match || !match.bracketId || !match.roundNumber) {
    return;
  }

  const nextRoundNumber = match.roundNumber + 1;
  const nextMatchNumber = Math.ceil(match.matchNumber / 2);
  const nextSlot = match.matchNumber % 2 === 1 ? "participantAId" : "participantBId";

  const nextMatch = await prisma.match.findFirst({
    where: {
      bracketId: match.bracketId,
      roundNumber: nextRoundNumber,
      matchNumber: nextMatchNumber,
      stageType: "playoff",
    },
  });

  if (!nextMatch) {
    const unfinishedThirdPlaceMatch = await prisma.match.findFirst({
      where: {
        bracketId: match.bracketId,
        roundNumber: match.roundNumber,
        matchNumber: 2,
        stageType: "playoff",
        status: { not: "completed" },
      },
      select: { id: true },
    });

    if (unfinishedThirdPlaceMatch) {
      return;
    }

    await prisma.bracket.update({
      where: { id: match.bracketId },
      data: { status: "completed" },
    });
    return;
  }

  await prisma.match.update({
    where: { id: nextMatch.id },
    data: {
      [nextSlot]: winnerParticipantId,
    },
  });
}

async function advanceThirdPlaceLoser(matchId: string, loserParticipantId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      bracketId: true,
      roundNumber: true,
      matchNumber: true,
      bracket: {
        select: {
          tournament: {
            select: { thirdPlaceEnabled: true },
          },
        },
      },
    },
  });

  if (
    !match ||
    !match.bracketId ||
    !match.roundNumber ||
    !match.bracket?.tournament.thirdPlaceEnabled
  ) {
    return;
  }

  const finalRound = await prisma.match.aggregate({
    where: {
      bracketId: match.bracketId,
      stageType: "playoff",
    },
    _max: { roundNumber: true },
  });
  const finalRoundNumber = finalRound._max.roundNumber;

  if (!finalRoundNumber || match.roundNumber !== finalRoundNumber - 1) {
    return;
  }

  const thirdPlaceMatch = await prisma.match.findFirst({
    where: {
      bracketId: match.bracketId,
      roundNumber: finalRoundNumber,
      matchNumber: 2,
      stageType: "playoff",
    },
    select: { id: true },
  });

  if (!thirdPlaceMatch) {
    return;
  }

  const thirdPlaceSlot =
    match.matchNumber % 2 === 1 ? "participantAId" : "participantBId";

  await prisma.match.update({
    where: { id: thirdPlaceMatch.id },
    data: {
      [thirdPlaceSlot]: loserParticipantId,
    },
  });
}

export async function generatePlayoffs(formData: FormData) {
  await requireAdminSession();

  const parsed = tournamentIdSchema.parse({
    tournamentId: formData.get("tournamentId"),
  });

  const tournament = await prisma.tournament.findUnique({
    where: { id: parsed.tournamentId },
    select: { thirdPlaceEnabled: true },
  });

  const groups = await prisma.group.findMany({
    where: { tournamentId: parsed.tournamentId },
    orderBy: { sortOrder: "asc" },
    include: {
      matches: {
        where: { stageType: "group" },
        select: { id: true, status: true },
      },
      standings: {
        orderBy: { rank: "asc" },
      },
    },
  });

  const hasUnreadyGroup = groups.some(
    (group) =>
      group.matches.length === 0 ||
      group.matches.some((match) => match.status !== "completed") ||
      group.standings.length < group.topQualifyCount,
  );

  if (hasUnreadyGroup) {
    await setAdminFlash(
      "Playoff belum bisa dibuat: semua group match harus completed dulu.",
      "warning",
    );
    refreshTournamentPages();
    return;
  }

  const seeds = buildDefaultQualifierSeeds(
    groups.map((group) => ({
      id: group.id,
      name: group.name,
      topQualifyCount: group.topQualifyCount,
      standings: group.standings.map((standing) => ({
        participantId: standing.participantId,
        rank: standing.rank,
      })),
    })),
  );

  if (seeds.length < 2) {
    await setAdminFlash("Playoff gagal dibuat: qualifier kurang dari 2 team.", "warning");
    refreshTournamentPages();
    return;
  }

  const generatedMatches = buildSingleEliminationBracket(seeds);
  const finalRoundNumber = Math.max(
    ...generatedMatches.map((match) => match.roundNumber),
  );

  await prisma.$transaction(async (tx) => {
    const existingBrackets = await tx.bracket.findMany({
      where: {
        tournamentId: parsed.tournamentId,
        type: "single_elimination",
      },
      select: { id: true },
    });
    const existingBracketIds = existingBrackets.map((bracket) => bracket.id);

    if (existingBracketIds.length > 0) {
      await tx.bracketSlot.deleteMany({
        where: {
          bracketId: { in: existingBracketIds },
        },
      });
    }

    await tx.match.deleteMany({
      where: {
        tournamentId: parsed.tournamentId,
        stageType: "playoff",
      },
    });

    await tx.bracket.deleteMany({
      where: {
        tournamentId: parsed.tournamentId,
        type: "single_elimination",
      },
    });

    const bracket = await tx.bracket.create({
      data: {
        tournamentId: parsed.tournamentId,
        type: "single_elimination",
        status: "live",
        generatedFromStage: "group",
      },
    });

    for (const generatedMatch of generatedMatches) {
      const match = await tx.match.create({
        data: {
          tournamentId: parsed.tournamentId,
          bracketId: bracket.id,
          stageType: "playoff",
          roundNumber: generatedMatch.roundNumber,
          matchNumber: generatedMatch.matchNumber,
          participantAId:
            generatedMatch.slotA?.participantId &&
            generatedMatch.slotA.participantId !== "bye"
              ? generatedMatch.slotA.participantId
              : null,
          participantBId:
            generatedMatch.slotB?.participantId &&
            generatedMatch.slotB.participantId !== "bye"
              ? generatedMatch.slotB.participantId
              : null,
          status: "scheduled",
        },
      });

      for (const [slotLabel, slot] of [
        ["A", generatedMatch.slotA],
        ["B", generatedMatch.slotB],
      ] as const) {
        if (!slot) {
          continue;
        }

        await tx.bracketSlot.create({
          data: {
            bracketId: bracket.id,
            matchId: match.id,
            slotLabel,
            sourceType: slot.participantId === "bye" ? "bye" : "group_rank",
            sourceGroupId:
              slot.sourceGroupId === "bye" ? null : slot.sourceGroupId,
            sourceRank: slot.sourceRank || null,
            participantId:
              slot.participantId === "bye" ? null : slot.participantId,
          },
        });
      }
    }

    if (tournament?.thirdPlaceEnabled && finalRoundNumber > 1) {
      await tx.match.create({
        data: {
          tournamentId: parsed.tournamentId,
          bracketId: bracket.id,
          stageType: "playoff",
          roundNumber: finalRoundNumber,
          matchNumber: 2,
          status: "scheduled",
        },
      });
    }
  });

  await setAdminFlash("Playoff bracket berhasil digenerate.");
  refreshTournamentPages();
}

export async function clearPlayoffs(formData: FormData) {
  await requireAdminSession();

  const parsed = tournamentIdSchema.parse({
    tournamentId: formData.get("tournamentId"),
  });

  await prisma.$transaction(async (tx) => {
    const brackets = await tx.bracket.findMany({
      where: { tournamentId: parsed.tournamentId },
      select: { id: true },
    });
    const bracketIds = brackets.map((bracket) => bracket.id);

    if (bracketIds.length > 0) {
      await tx.bracketSlot.deleteMany({
        where: { bracketId: { in: bracketIds } },
      });
    }

    await tx.match.deleteMany({
      where: {
        tournamentId: parsed.tournamentId,
        stageType: "playoff",
      },
    });

    await tx.bracket.deleteMany({
      where: { tournamentId: parsed.tournamentId },
    });
  });

  await setAdminFlash("Playoff bracket berhasil dihapus.", "warning");
  refreshTournamentPages();
}

export async function updatePlayoffResult(formData: FormData) {
  await requireAdminSession();

  const parsed = updateMatchResultSchema.parse({
    matchId: formData.get("matchId"),
    scoreA: formData.get("scoreA"),
    scoreB: formData.get("scoreB"),
    status: formData.get("status"),
    scheduledAt: formData.get("scheduledAt"),
  });

  const participantAId = String(formData.get("participantAId") ?? "");
  const participantBId = String(formData.get("participantBId") ?? "");
  const winnerParticipantId =
    participantAId && participantBId && parsed.scoreA !== parsed.scoreB
      ? parsed.scoreA > parsed.scoreB
        ? participantAId
        : participantBId
      : null;
  const safeWinnerParticipantId = winnerParticipantId || null;
  const effectiveStatus =
    parsed.status === "scheduled" && safeWinnerParticipantId
      ? "completed"
      : parsed.status;
  const loserParticipantId =
    safeWinnerParticipantId && participantAId && participantBId
      ? safeWinnerParticipantId === participantAId
        ? participantBId
        : participantAId
      : null;

  await prisma.match.update({
    where: { id: parsed.matchId },
    data: {
      scoreA: parsed.scoreA,
      scoreB: parsed.scoreB,
      status: effectiveStatus,
      scheduledAt: getOptionalScheduleDate(parsed.scheduledAt),
      winnerParticipantId: safeWinnerParticipantId,
      locked: effectiveStatus === "completed",
    },
  });

  if (safeWinnerParticipantId) {
    await advancePlayoffWinner(parsed.matchId, safeWinnerParticipantId);
  }

  if (loserParticipantId) {
    await advanceThirdPlaceLoser(parsed.matchId, loserParticipantId);
  }

  await setAdminFlash("Playoff result berhasil disimpan.");
  refreshTournamentPages();
}
