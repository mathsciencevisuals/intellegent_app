import { WorkspaceRole } from "@/generated/prisma/client";

export function canManageMembers(role: WorkspaceRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageTargetRole(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole
) {
  if (targetRole === "OWNER") {
    return false;
  }

  if (actorRole === "OWNER") {
    return true;
  }

  if (actorRole === "ADMIN") {
    return targetRole === "MEMBER";
  }

  return false;
}

export function canAssignRole(
  actorRole: WorkspaceRole,
  newRole: WorkspaceRole
) {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return newRole !== "OWNER";
  return false;
}

export function isWorkspaceOwner(role: WorkspaceRole) {
  return role === "OWNER";
}
