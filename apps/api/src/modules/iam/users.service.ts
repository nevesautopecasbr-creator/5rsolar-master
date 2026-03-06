import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
    return this.prisma.user.findMany({
      include: {
        roles: { include: { role: true } },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
      },
    });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }
    return user;
  }

  async create(
    dto: CreateUserDto,
    actorId?: string,
    companyId?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException(
        "Selecione uma empresa para atribuir o usuário e o perfil.",
      );
    }

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

    await this.prisma.companyMembership.upsert({
      where: {
        companyId_userId: { companyId, userId: created.id },
      },
      update: { isActive: true },
      create: {
        companyId,
        userId: created.id,
        isActive: true,
      },
    });

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: created.id, roleId: dto.roleId },
      },
      update: {},
      create: {
        userId: created.id,
        roleId: dto.roleId,
        companyId,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "User",
      entityId: created.id,
      action: "CREATE",
      payload: { email: created.email, roleId: dto.roleId },
    });

    return this.findOne(created.id);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorId?: string,
    companyId?: string,
  ) {
    const existing = await this.findOne(id);
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

    if (dto.roleId != null && companyId) {
      await this.prisma.userRole.deleteMany({
        where: { userId: id, companyId },
      });
      await this.prisma.userRole.create({
        data: {
          userId: id,
          roleId: dto.roleId,
          companyId,
          createdById: actorId,
        },
      });
    }

    await this.audit.log({
      actorId,
      entityName: "User",
      entityId: updated.id,
      action: "UPDATE",
      payload: { email: updated.email, roleId: dto.roleId },
    });

    return this.findOne(id);
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
