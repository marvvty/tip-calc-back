import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { CreateAccountDto, UpdateAccountDto } from './dto/create-accounts.dto';

@Injectable()
export class AccountsService {
  prisma = new PrismaClient();

  async create(data: CreateAccountDto) {
    return this.prisma.accounts.create({
      data: {
        base_amount: data.base_amount.toString(),
        tip_precent: data.tip_precent,
        people_count: data.people_count ?? 1,
        participants: {
          create: data.participants,
        },
      },
      include: { participants: true },
    });
  }

  async findAll() {
    return this.prisma.accounts.findMany({ include: { participants: true } });
  }

  async findOne(id: number) {
    return this.prisma.accounts.findUnique({
      where: { id },
      include: { participants: true },
    });
  }

  async update(id: number, data: UpdateAccountDto) {
    await this.prisma.participants.deleteMany({
      where: { accounts: { id } },
    });

    return this.prisma.accounts.update({
      where: { id },
      data: {
        base_amount: data.base_amount,
        tip_precent: data.tip_precent,
        people_count: data.people_count,
        participants: {
          create: data.participants || [],
        },
      },
      include: { participants: true },
    });
  }

  async delete(id: number) {
    return this.prisma.accounts.delete({ where: { id } });
  }

  async calculateShares(id: number) {
    const accounts = await this.findOne(id);
    if (!accounts) throw new Error('account not found');

    const base = Number(accounts.base_amount);
    const tipPercent = accounts.tip_precent || 0;
    const tipAmount = base * (tipPercent / 100);
    const total = base + tipAmount;

    const normalizedPercentages = this.calculateNormalizedPercentages(
      accounts.participants,
    );
    const participants = this.calculateParticipantShares(
      accounts.participants,
      total,
      normalizedPercentages,
    );

    return { tipAmount, total, participants };
  }

  private calculateNormalizedPercentages(
    participants: any[],
  ): Map<number, number> {
    const customPercentages = new Map<number, number>();
    let totalCustomPercent = 0;
    let customCount = 0;

    participants.forEach((p, index) => {
      if (p.custom_precent != null) {
        customPercentages.set(index, p.custom_precent);
        totalCustomPercent += p.custom_precent;
        customCount++;
      }
    });

    const remainingParticipants = participants.length - customCount;
    const normalizedPercentages = new Map<number, number>();

    if (remainingParticipants > 0) {
      const defaultPercent = Math.max(
        0,
        (100 - totalCustomPercent) / remainingParticipants,
      );

      participants.forEach((p, index) => {
        if (p.custom_precent == null) {
          normalizedPercentages.set(index, defaultPercent);
        }
      });

      totalCustomPercent = 100;
    }

    const normalizationFactor =
      totalCustomPercent > 100 ? 100 / totalCustomPercent : 1;

    participants.forEach((p, index) => {
      if (p.custom_precent != null) {
        normalizedPercentages.set(
          index,
          p.custom_precent * normalizationFactor,
        );
      } else if (normalizedPercentages.has(index)) {
        const currentPercent = normalizedPercentages.get(index)!;
        normalizedPercentages.set(index, currentPercent * normalizationFactor);
      }
    });

    return normalizedPercentages;
  }

  private calculateParticipantShares(
    participants: any[],
    total: number,
    normalizedPercentages: Map<number, number>,
  ) {
    return participants.map((participant, index) => {
      const percentage =
        normalizedPercentages.get(index) || 100 / participants.length;
      const share = total * (percentage / 100);

      return {
        participant,
        calculated_share: share,
      };
    });
  }
}
