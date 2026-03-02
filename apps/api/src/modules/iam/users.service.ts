import { Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuditService } from "./audit.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }
    return user;
  }

  async create(dto: CreateUserDto, actorId?: string) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.log({
      actorId,
      entityName: "User",
      entityId: created.id,
      action: "CREATE",
      payload: { email: created.email },
    });

    return created;
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    await this.findOne(id);
    const data: Record<string, unknown> = {
      name: dto.name,
      email: dto.email,
      isActive: dto.isActive,
    };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    await this.audit.log({
      actorId,
      entityName: "User",
      entityId: updated.id,
      action: "UPDATE",
      payload: { email: updated.email },
    });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    await this.findOne(id);
    const deleted = await this.prisma.user.delete({ where: { id } });
    await this.audit.log({
      actorId,
      entityName: "User",
      entityId: deleted.id,
      action: "DELETE",
      payload: { email: deleted.email },
    });
    return deleted;
  }
}
