import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import { URL } from "url";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import { PayableStatus, ReceivableStatus, WorkOrderStatus } from "@prisma/client";

type ReminderJob = {
  receivableId: string;
  reminderNumber: number;
};

type WorkDelayJob = {
  workOrderId: string;
};

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private billingQueue!: Queue<ReminderJob>;
  private workDelayQueue!: Queue<WorkDelayJob>;
  private billingWorker!: Worker<ReminderJob>;
  private workDelayWorker!: Worker<WorkDelayJob>;
  private scheduleHandle?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const url = new URL(redisUrl);
    const connection = {
      host: url.hostname,
      port: Number(url.port || 6379),
      password: url.password || undefined,
    };

    this.billingQueue = new Queue("billing-reminders", { connection });
    this.workDelayQueue = new Queue("work-delay-alerts", { connection });

    this.billingWorker = new Worker(
      "billing-reminders",
      async (job) => {
        const receivable = await this.prisma.receivable.findUnique({
          where: { id: job.data.receivableId },
        });
        if (!receivable) {
          return;
        }
        await this.audit.log({
          companyId: receivable.companyId ?? undefined,
          entityName: "Receivable",
          entityId: receivable.id,
          action: `REMINDER_${job.data.reminderNumber}`,
          payload: { dueDate: receivable.dueDate },
        });
        this.logger.log(
          `Reminder ${job.data.reminderNumber} enviado para receivable ${receivable.id}`,
        );
      },
      { connection },
    );

    this.workDelayWorker = new Worker(
      "work-delay-alerts",
      async (job) => {
        const workOrder = await this.prisma.workOrder.findUnique({
          where: { id: job.data.workOrderId },
        });
        if (!workOrder) {
          return;
        }
        await this.audit.log({
          companyId: workOrder.companyId ?? undefined,
          entityName: "WorkOrder",
          entityId: workOrder.id,
          action: "WORK_DELAY",
          payload: { scheduledEnd: workOrder.scheduledEnd },
        });
        this.logger.warn(`Atraso de obra identificado: ${workOrder.id}`);
      },
      { connection },
    );

    await this.scheduleJobs();
    this.scheduleHandle = setInterval(() => {
      this.scheduleJobs().catch((error) =>
        this.logger.error("Falha ao agendar jobs", error),
      );
    }, 12 * 60 * 60 * 1000);
  }

  async onModuleDestroy() {
    if (this.scheduleHandle) {
      clearInterval(this.scheduleHandle);
    }
    await Promise.all([
      this.billingWorker?.close(),
      this.workDelayWorker?.close(),
      this.billingQueue?.close(),
      this.workDelayQueue?.close(),
    ]);
  }

  private async scheduleJobs() {
    await this.scheduleBillingReminders();
    await this.scheduleWorkDelayAlerts();
  }

  private async scheduleBillingReminders() {
    const receivables = await this.prisma.receivable.findMany({
      where: {
        status: { in: [ReceivableStatus.OPEN, ReceivableStatus.OVERDUE] },
      },
    });

    const now = Date.now();
    const reminderOffsets = [-7, 0, 7];

    for (const receivable of receivables) {
      for (const [index, offsetDays] of reminderOffsets.entries()) {
        const reminderNumber = index + 1;
        const reminderDate = new Date(receivable.dueDate);
        reminderDate.setDate(reminderDate.getDate() + offsetDays);
        const delay = Math.max(reminderDate.getTime() - now, 0);
        await this.billingQueue.add(
          "send-reminder",
          { receivableId: receivable.id, reminderNumber },
          {
            delay,
            jobId: `reminder-${receivable.id}-${reminderNumber}`,
            removeOnComplete: true,
            removeOnFail: true,
          },
        );
      }
    }
  }

  private async scheduleWorkDelayAlerts() {
    const overdueWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        status: { notIn: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED] },
        scheduledEnd: { lt: new Date() },
      },
    });

    for (const workOrder of overdueWorkOrders) {
      await this.workDelayQueue.add(
        "alert-delay",
        { workOrderId: workOrder.id },
        {
          jobId: `delay-${workOrder.id}`,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    }
  }
}
