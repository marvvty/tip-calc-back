export interface ParticipantDto {
  name: string;
  custom_precent?: number;
  custom_amount?: number;
}

export interface CreateAccountDto {
  base_amount: number;
  tip_precent?: number;
  people_count: number;
  participants: ParticipantDto[];
}

export type UpdateAccountDto = Partial<CreateAccountDto>;
