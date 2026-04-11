export type WorkspaceBrowserItem = {
  id: string;
  name: string;
  slug: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceBrowserSortKey = "name" | "updatedAt" | "createdAt";
