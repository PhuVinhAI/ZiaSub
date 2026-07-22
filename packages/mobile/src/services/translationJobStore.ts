/**
 * Translation Job Store — current job state + pub/sub
 *
 * Tách từ translationManager.ts — chỉ di chuyển code, không sửa đổi logic.
 */
import type { TranslationJob } from "@src/types";

export type TranslationListener = (job: TranslationJob) => void;

export class TranslationJobStore {
  currentJob: TranslationJob | null = null;
  private listeners: Set<TranslationListener> = new Set();

  subscribe(listener: TranslationListener): () => void {
    this.listeners.add(listener);
    if (this.currentJob) {
      listener(this.currentJob);
    }
    return () => this.listeners.delete(listener);
  }

  notify() {
    if (this.currentJob) {
      this.listeners.forEach((listener) => listener(this.currentJob!));
    }
  }
}

// Generate a unique job id
export const createJobId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
