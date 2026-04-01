type QueueJob<T> = {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

export class RenderQueue {
  private queue: QueueJob<any>[] = [];
  private processing = false;
  private currentJobId: string | null = null;

  get pending(): number {
    return this.queue.length;
  }

  get isProcessing(): boolean {
    return this.processing;
  }

  get currentJob(): string | null {
    return this.currentJobId;
  }

  enqueue<T>(id: string, execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ id, execute, resolve, reject });
      console.log(`[Queue] Job ${id} enqueued. Queue size: ${this.queue.length}`);
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift()!;
    this.currentJobId = job.id;

    console.log(`[Queue] Processing job ${job.id}. Remaining: ${this.queue.length}`);

    try {
      const result = await job.execute();
      job.resolve(result);
      console.log(`[Queue] Job ${job.id} completed`);
    } catch (error) {
      job.reject(error as Error);
      console.error(`[Queue] Job ${job.id} failed:`, (error as Error).message);
    } finally {
      this.processing = false;
      this.currentJobId = null;
      this.processNext();
    }
  }
}
