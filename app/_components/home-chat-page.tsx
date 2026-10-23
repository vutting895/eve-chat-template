"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ComposerFooterControls,
  ErrorToast,
  type AgentChatControllerStatus,
} from "@/app/_components/agent-chat";
import { useChatShell } from "@/app/_components/chat-shell-context";
import { ChatComposer } from "@/components/chat/composer";
import { TemplateFooterLinks } from "@/components/chat/template-footer-links";
import { getChatMessageLengthError } from "@/lib/chat/limits";
import {
  createProvisionalChatId,
  writePendingChatMessage,
} from "@/lib/chat/provisional-chat";
import type { SetupStatus } from "@/lib/chat/types";

const IDLE_CONTROLLER_STATUS: AgentChatControllerStatus = {
  isBusy: false,
  isDisabled: false,
  isEmpty: true,
};

export function HomeChatPage() {
  const {
    requestSignIn,
    setActiveChatId,
    setupStatus,
    viewer,
  } = useChatShell();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const setupReady = setupStatus.appReady;
  const pathname = usePathname();
  const router = useRouter();
  const toastError = clientError && dismissedError !== clientError ? clientError : null;

  useEffect(() => {
    setActiveChatId(null);
  }, [setActiveChatId]);

  useEffect(() => {
    if (pathname === "/") {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!viewer) {
      return;
    }

    const restoredDraft = window.sessionStorage.getItem("eve-chat-draft");

    if (restoredDraft) {
      setDraft(restoredDraft);
      window.sessionStorage.removeItem("eve-chat-draft");
    }
  }, [viewer]);

  useEffect(() => {
    setDismissedError(null);
  }, [clientError]);

  const handleSubmit = useCallback(
    (text: string) => {
      const message = text.trim();

      if (!message || submittingRef.current) {
        return;
      }

      setClientError(null);

      const lengthError = getChatMessageLengthError(message);

      if (lengthError) {
        setClientError(lengthError);
        return;
      }

      if (!setupReady) {
        setClientError(
          getHomeComposerDisabledReason({ setupStatus, submitting }) ??
            "Finish setup before chatting.",
        );
        return;
      }

      if (!viewer) {
        requestSignIn(message);
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      setDraft("");

      const provisionalChatId = createProvisionalChatId();
      const didStoreMessage = writePendingChatMessage(provisionalChatId, message);

      if (!didStoreMessage) {
        submittingRef.current = false;
        setSubmitting(false);
        setDraft(message);
        setClientError("Failed to start chat.");
        return;
      }

      setActiveChatId(provisionalChatId);
      router.push(`/chat/${provisionalChatId}`, { scroll: false });
    },
    [
      requestSignIn,
      router,
      setActiveChatId,
      setupReady,
      setupStatus,
      submitting,
      viewer,
    ],
  );

  const composerDisabled = !setupReady;
  const composerDisabledReason = getHomeComposerDisabledReason({
    setupStatus,
    submitting,
  });

  if (pathname !== "/") {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-14 md:pt-8">
      {toastError ? (
        <ErrorToast
          message={toastError}
          onDismiss={() => setDismissedError(toastError)}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col justify-between px-4 pt-8 pb-4 sm:px-6 sm:pb-6">
        <div className="flex min-h-0 flex-1 items-center justify-center pb-20 sm:pb-[12vh]">
          <div className="w-full max-w-2xl space-y-5 sm:space-y-7 md:space-y-8">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-foreground text-3xl font-bold text-background shadow-sm sm:size-20 sm:text-4xl md:size-24 md:text-5xl">
                V
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Voom AI</h1>
              <p className="text-sm text-muted-foreground sm:text-base">ผู้ช่วย AI สำหรับระบบ Voom_system</p>
            </div>
            <ChatComposer
              autoFocus
              disabled={composerDisabled}
              disabledReason={composerDisabledReason}
              footerStart={<ComposerFooterControls setupStatus={setupStatus} />}
              isBusy={IDLE_CONTROLLER_STATUS.isBusy}
              isPreparing={submitting}
              onChange={setDraft}
              onStop={() => {}}
              onSubmit={handleSubmit}
              placeholder="ถาม Voom AI ได้เลย..."
              value={draft}
            />
          </div>
        </div>
        <TemplateFooterLinks />
      </div>
    </div>
  );
}

function getHomeComposerDisabledReason({
  setupStatus,
  submitting,
}: {
  readonly setupStatus: SetupStatus;
  readonly submitting: boolean;
}) {
  if (!setupStatus.databaseConfigured) {
    return "ตั้งค่า DATABASE_URL สำหรับฐานข้อมูลแชตก่อนเริ่มใช้งาน (ใช้ PostgreSQL ที่รองรับได้).";
  }

  if (!setupStatus.databaseSchemaReady) {
    return "Run database migrations: vercel env run -e production -- pnpm db:migrate.";
  }

  if (!setupStatus.authReady) {
    const missing = setupStatus.missing.length
      ? ` Missing: ${setupStatus.missing.join(", ")}.`
      : "";

    return `Finish auth setup before chatting.${missing}`;
  }

  if (!setupStatus.rateLimitReady) {
    return "Provision Upstash Redis before chatting.";
  }

  if (submitting) {
    return "Preparing chat.";
  }

  return undefined;
}
