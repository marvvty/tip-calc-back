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
    return this.prisma.accounts.update({
      where: { id },
      data: {
        base_amount: data.base_amount,
        tip_precent: data.tip_precent,
        people_count: data.people_count,
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
    const peopleCount = accounts.people_count || accounts.participants.length;

    const participants = accounts.participants.map((participant) => {
      let share: number;

      if (participant.custom_precent != null) {
        share = total * (participant.custom_precent / 100);
      } else {
        share = total / peopleCount;
      }

      return { participant, calculated_share: share };
    });

    return { tipAmount, total, participants };
  }
}
