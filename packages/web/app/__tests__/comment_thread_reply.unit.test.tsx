import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CommentSidebar from "../lib/components/comments/CommentSidebar";

// Mock comments data
const mockCommentsData = [
  {
    id: "c1",
    noteId: "n1",
    text: "Root 1",
    authorId: "inst-1",
    authorName: "Instructor",
    createdAt: new Date().toISOString(),
    role: "instructor",
    position: { from: 1, to: 2 },
    threadId: "t1",
    parentId: null,
    resolved: false,
  },
  {
    id: "c2",
    noteId: "n1",
    text: "Root 2",
    authorId: "inst-1",
    authorName: "Instructor",
    createdAt: new Date().toISOString(),
    role: "instructor",
    position: { from: 3, to: 4 },
    threadId: "t2",
    parentId: null,
    resolved: false,
  },
];

// Mock TanStack Query hooks
jest.mock("../lib/hooks/queries/useComments", () => ({
  useComments: jest.fn(() => ({
    data: mockCommentsData,
    refetch: jest.fn(),
  })),
  useCommentMutations: jest.fn(() => ({
    createComment: { mutateAsync: jest.fn() },
    resolveThread: { mutateAsync: jest.fn() },
    deleteComment: { mutateAsync: jest.fn() },
  })),
}));

// Mock useAuthStore
jest.mock("../lib/stores/authStore", () => ({
  useAuthStore: jest.fn((selector) => {
    const mockState = {
      user: {
        uid: "inst-1",
        name: "Instructor",
        roles: { contributor: false, administrator: true },
      },
      isLoggedIn: true,
      isLoading: false,
      isInitialized: true,
    };
    return selector ? selector(mockState) : mockState;
  }),
}));

jest.mock("../lib/utils/api_service", () => ({
  __esModule: true,
  default: {
    fetchCreatorName: async () => "Instructor",
    fetchUserData: async () => ({
      uid: "inst-1",
      name: "Instructor",
      isInstructor: true,
      roles: { contributor: false, administrator: true },
    }),
  },
}));

describe("CommentSidebar - per-thread reply drafts", () => {
  test("typing in one thread reply does not mirror in another", async () => {
    render(<CommentSidebar noteId={"n1"} getCurrentSelection={() => ({ from: 1, to: 2 })} />);

    const replyInputs = await screen.findAllByPlaceholderText(/reply/i);
    expect(replyInputs.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(replyInputs[0], { target: { value: "Reply A" } });
    expect((replyInputs[0] as HTMLInputElement).value).toBe("Reply A");
    expect((replyInputs[1] as HTMLInputElement).value).toBe("");
  });
});
