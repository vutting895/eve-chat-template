"use client";

import {
  ArrowRightIcon,
  EllipsisIcon,
  PanelLeftIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  AuthDisplayLoggedIn,
  AuthDisplayLoggedOut,
} from "@/components/auth/auth-display";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatListItem, SetupStatus, Viewer } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

export function ChatSidebar({
  activeChatId,
  className,
  chats,
  hasMoreChats = false,
  isLoadingChats = false,
  isLoadingMore = false,
  onDeleteChat,
  onLoadMoreChats,
  onNavigate,
  onNewChat,
  onSignIn,
  onToggleSidebar,
  setupStatus,
  viewer,
}: {
  readonly activeChatId: string | null;
  readonly className?: string;
  readonly chats: readonly ChatListItem[];
  readonly hasMoreChats?: boolean;
  readonly isLoadingChats?: boolean;
  readonly isLoadingMore?: boolean;
  readonly onDeleteChat: (chatId: string) => void | Promise<void>;
  readonly onLoadMoreChats?: () => void | Promise<void>;
  readonly onNavigate?: (chatId?: string | null) => void;
  readonly onNewChat: () => void;
  readonly onSignIn?: () => void;
  readonly onToggleSidebar?: () => void;
  readonly setupStatus: SetupStatus;
  readonly viewer: Viewer | null;
}) {
  const authDisabled = !setupStatus.appReady;
  const newSessionActive = activeChatId === null;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMoreChats || !onLoadMoreChats) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          void onLoadMoreChats();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMoreChats, isLoadingMore, onLoadMoreChats]);

  return (
    <aside
      className={cn(
        "nova-sidebar flex h-full w-64 shrink-0 flex-col border-r border-border bg-background",
        className,
      )}
    >
      <div className="nova-sidebar-top flex flex-col gap-1 px-3 pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <button
            aria-label="VOOM NOVA home"
            className="nova-sidebar-brand"
            onClick={() => {
              onNewChat();
              onNavigate?.(null);
            }}
            type="button"
          >
            <span className="nova-brand-emblem">V<span>✦</span></span>
            <span className="nova-brand-copy">
              <strong>VOOM <em>/ NOVA</em></strong>
              <small>INTELLIGENCE SYSTEMS</small>
            </span>
          </button>
          {onToggleSidebar ? (
            <Button
              aria-label="Close sidebar"
              className="nova-sidebar-close text-muted-foreground/55 hover:text-muted-foreground"
              onClick={onToggleSidebar}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <PanelLeftIcon className="size-4" />
            </Button>
          ) : null}
        </div>
        <div className="nova-sidebar-section-label">COMMAND DECK</div>
        <button
          className={cn("nova-new-chat", newSessionActive && "is-active")}
          onClick={() => {
            onNewChat();
            onNavigate?.(null);
          }}
          type="button"
        >
          <PlusIcon className="size-4" />
          แชตใหม่
        </button>
      </div>

      <div className="nova-session-list flex-1 overflow-y-auto px-2 py-2">
        <div className="nova-sidebar-section-label nova-sidebar-session-heading">SESSION ARCHIVE</div>
        {chats.length ? (
          <div>
            {chats.map((chat) => {
              const active = activeChatId === chat.id;

              return (
                <div
                  className={cn(
                    "nova-session-row group/session relative mb-0.5 rounded-md transition-colors",
                    active && "is-active",
                  )}
                  key={chat.id}
                >
                  <Link
                    className="flex h-8 min-w-0 items-center px-2 pr-8 text-sm"
                    href={`/chat/${chat.id}`}
                    onClick={() => onNavigate?.(chat.id)}
                  >
                    <span className="block truncate">{chat.title}</span>
                    <span className="sr-only">Updated {formatHistoryTime(chat.updatedAt)}</span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label="Chat actions"
                        className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity hover:bg-muted group-hover/session:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                        size="icon-xs"
                        type="button"
                        variant="ghost"
                      >
                        <EllipsisIcon className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={6}>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          void onDeleteChat(chat.id);
                        }}
                        variant="destructive"
                      >
                        <Trash2Icon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : null}
        {hasMoreChats ? (
          <div ref={sentinelRef} className="px-2 py-2">
            {isLoadingMore ? (
              <p className="text-xs text-muted-foreground">Loading more...</p>
            ) : (
              <button
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => void onLoadMoreChats?.()}
                type="button"
              >
                Load more
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="nova-sidebar-bottom border-t border-border px-2 py-3">
        <div className="nova-security-card">
          <span className="nova-security-led" />
          <div>
            <strong>READ-ONLY MODE</strong>
            <small>Order execution locked</small>
          </div>
          <span className="nova-lock-symbol">⌑</span>
        </div>
        {viewer ? (
          <UserMenu viewer={viewer} />
        ) : isLoadingChats ? (
          <>
            <AuthDisplayLoggedIn>
              <div className="h-8 rounded-md bg-muted/25" />
            </AuthDisplayLoggedIn>
            <AuthDisplayLoggedOut>
              <SidebarSignInButton
                authDisabled={false}
                onNavigate={onNavigate}
                onSignIn={onSignIn}
              />
            </AuthDisplayLoggedOut>
          </>
        ) : (
          <SidebarSignInButton
            authDisabled={authDisabled}
            onNavigate={onNavigate}
            onSignIn={onSignIn}
          />
        )}
      </div>
    </aside>
  );
}

function SidebarSignInButton({
  authDisabled,
  onNavigate,
  onSignIn,
}: {
  readonly authDisabled: boolean;
  readonly onNavigate?: (chatId?: string | null) => void;
  readonly onSignIn?: () => void;
}) {
  return (
    <button
      className="nova-sign-in flex h-8 w-full items-center justify-between rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      disabled={authDisabled}
      onClick={() => {
        onSignIn?.();
        onNavigate?.();
      }}
      type="button"
    >
      <span className="min-w-0">Sign in</span>
      <ArrowRightIcon className="size-3.5" />
    </button>
  );
}

function formatHistoryTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
