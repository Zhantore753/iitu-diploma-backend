import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // ── helpers ──────────────────────────────────────────────────────────

  private otherParticipant(conv: any, myId: number) {
    return conv.participant1Id === myId ? conv.participant2 : conv.participant1;
  }

  private myLastReadAt(conv: any, myId: number): Date | null {
    return conv.participant1Id === myId ? conv.p1LastReadAt : conv.p2LastReadAt;
  }

  private serializeConversationList(conv: any, myId: number) {
    const other = this.otherParticipant(conv, myId);
    const lastMsg = conv.messages?.[0];
    const lastReadAt = this.myLastReadAt(conv, myId);

    const unreadCount = conv.messages?.filter(
      (m: any) =>
        m.senderId !== myId &&
        (!lastReadAt || new Date(m.createdAt) > new Date(lastReadAt)),
    ).length ?? 0;

    return {
      id: conv.id,
      machineId: conv.machineId ?? null,
      machineName: conv.machine?.name ?? null,
      otherUserId: other?.id ?? null,
      otherUserName: other ? `${other.firstName} ${other.lastName}`.trim() : null,
      otherUserAvatar: other?.avatar ?? null,
      lastMessage: lastMsg?.text ?? null,
      lastMessageAt: lastMsg ? new Date(lastMsg.createdAt).toISOString() : null,
      unreadCount,
    };
  }

  private serializeConversationDetail(conv: any, myId: number) {
    const other = this.otherParticipant(conv, myId);
    return {
      id: conv.id,
      machineId: conv.machineId ?? null,
      machineName: conv.machine?.name ?? null,
      otherUserId: other?.id ?? null,
      otherUserName: other ? `${other.firstName} ${other.lastName}`.trim() : null,
      otherUserAvatar: other?.avatar ?? null,
      messages: (conv.messages ?? []).map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        createdAt: new Date(m.createdAt).toISOString(),
      })),
    };
  }

  // ── endpoints ────────────────────────────────────────────────────────

  async getConversations(myId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: myId }, { participant2Id: myId }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        machine: { select: { id: true, name: true } },
        participant1: { select: USER_SELECT },
        participant2: { select: USER_SELECT },
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return conversations.map((c) => this.serializeConversationList(c, myId));
  }

  async findOrCreateConversation(
    myId: number,
    recipientId: number,
    machineId?: number,
  ) {
    // Canonical ordering to avoid duplicates
    const p1Id = Math.min(myId, recipientId);
    const p2Id = Math.max(myId, recipientId);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        participant1Id: p1Id,
        participant2Id: p2Id,
        machineId: machineId ?? null,
      },
      include: {
        machine: { select: { id: true, name: true } },
        participant1: { select: USER_SELECT },
        participant2: { select: USER_SELECT },
        messages: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (existing) return this.serializeConversationList(existing, myId);

    const created = await this.prisma.conversation.create({
      data: {
        participant1Id: p1Id,
        participant2Id: p2Id,
        machineId: machineId ?? null,
      },
      include: {
        machine: { select: { id: true, name: true } },
        participant1: { select: USER_SELECT },
        participant2: { select: USER_SELECT },
        messages: { orderBy: { createdAt: 'desc' } },
      },
    });

    return this.serializeConversationList(created, myId);
  }

  async getConversationDetail(
    convId: number,
    myId: number,
    skip = 0,
    take = 50,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: convId },
      include: {
        machine: { select: { id: true, name: true } },
        participant1: { select: USER_SELECT },
        participant2: { select: USER_SELECT },
        messages: {
          orderBy: { createdAt: 'asc' },
          skip,
          take,
        },
      },
    });

    if (!conv) throw new NotFoundException('Conversation not found');
    this.assertParticipant(conv, myId);

    // Mark as read: update the current user's lastReadAt
    const isP1 = conv.participant1Id === myId;
    await this.prisma.conversation.update({
      where: { id: convId },
      data: isP1 ? { p1LastReadAt: new Date() } : { p2LastReadAt: new Date() },
    });

    return this.serializeConversationDetail(conv, myId);
  }

  async sendMessage(convId: number, myId: number, text: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: convId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    this.assertParticipant(conv, myId);

    const now = new Date();
    const isP1 = conv.participant1Id === myId;

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId: convId, senderId: myId, text },
      }),
      // Touch updatedAt and mark sender as having read up to now
      this.prisma.conversation.update({
        where: { id: convId },
        data: {
          updatedAt: now,
          ...(isP1 ? { p1LastReadAt: now } : { p2LastReadAt: now }),
        },
      }),
    ]);

    return {
      id: message.id,
      senderId: message.senderId,
      text: message.text,
      createdAt: new Date(message.createdAt).toISOString(),
    };
  }

  // ── guard ─────────────────────────────────────────────────────────────

  private assertParticipant(conv: any, myId: number) {
    if (conv.participant1Id !== myId && conv.participant2Id !== myId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
  }
}
