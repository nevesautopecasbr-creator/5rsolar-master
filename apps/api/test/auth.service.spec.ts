import { UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import type { PrismaService } from "../src/prisma/prisma.service";
import { AuthService } from "../src/modules/iam/auth.service";
import * as bcrypt from "bcryptjs";

describe("AuthService login", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns tokens for valid credentials", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          email: "admin@erp.local",
          name: "Admin",
          isActive: true,
          passwordHash: "hash",
        }),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce("refresh-token"),
    } as unknown as JwtService;

    jest
      .spyOn(bcrypt, "compare")
      .mockImplementation(((_data, _hash) =>
        Promise.resolve(true)) as typeof bcrypt.compare);
    jest
      .spyOn(bcrypt, "hash")
      .mockImplementation(((_data, _salt) =>
        Promise.resolve("hashed-refresh")) as typeof bcrypt.hash);

    const service = new AuthService(prisma, jwtService);

    const result = await service.login("admin@erp.local", "Admin@123");

    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { id: "user-1", name: "Admin", email: "admin@erp.local" },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "admin@erp.local" },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it("throws UnauthorizedException for invalid password", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          email: "admin@erp.local",
          name: "Admin",
          isActive: true,
          passwordHash: "hash",
        }),
      },
      refreshToken: {
        create: jest.fn(),
      },
    } as unknown as PrismaService;

    const jwtService = {
      signAsync: jest.fn(),
    } as unknown as JwtService;

    jest
      .spyOn(bcrypt, "compare")
      .mockImplementation(((_data, _hash) =>
        Promise.resolve(false)) as typeof bcrypt.compare);

    const service = new AuthService(prisma, jwtService);

    await expect(
      service.login("admin@erp.local", "wrong-pass"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
});
