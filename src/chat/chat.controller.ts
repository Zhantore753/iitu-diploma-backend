import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/users/users.decorator';
import { ChatService } from './chat.service';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOkResponse({ description: 'All conversations for the current user' })
  @ApiOperation({ summary: 'List my conversations' })
  async getConversations(@User() user: any) {
    return this.chatService.getConversations(user.sub);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Find or create a conversation' })
  async findOrCreate(
    @User() user: any,
    @Body('recipientId', ParseIntPipe) recipientId: number,
    @Body('machineId') machineId?: number,
  ) {
    return this.chatService.findOrCreateConversation(
      user.sub,
      recipientId,
      machineId ? Number(machineId) : undefined,
    );
  }

  @Get('conversations/:id')
  @ApiOkResponse({ description: 'Conversation detail with paginated messages' })
  @ApiOperation({ summary: 'Get conversation + messages (take=50)' })
  async getConversation(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.chatService.getConversationDetail(
      id,
      user.sub,
      skip ? Number(skip) : 0,
      take ? Number(take) : 50,
    );
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message to a conversation' })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
    @Body('text') text: string,
  ) {
    return this.chatService.sendMessage(id, user.sub, text);
  }
}
