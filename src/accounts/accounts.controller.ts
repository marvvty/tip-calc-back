import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import type {
  CreateAccountDto,
  UpdateAccountDto,
} from './dto/create-accounts.dto';

@Controller('accounts')
export class AccountsController {
  constructor(readonly accountService: AccountsService) {}

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountService.create(dto);
  }

  @Get()
  findAll() {
    return this.accountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.accountService.delete(+id);
  }

  @Get(':id/calc')
  calculate(@Param('id') id: string) {
    return this.accountService.calculateShares(+id);
  }
}
