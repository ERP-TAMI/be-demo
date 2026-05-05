import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ColorCardService } from './color-card.service';
import { LineStatus } from './entities/po-line.entity';
import { PoStatus } from '../purchase-orders/entities/purchase-order.entity';
import { UserRole } from '../user/entities/user.entity';

function repo<T>(items: T[]) {
  return {
    findOne: jest.fn(
      async ({ where }: { where: Partial<T> }) =>
        items.find((item) =>
          Object.entries(where).every(
            ([key, value]) => item[key as keyof T] === value,
          ),
        ) ?? null,
    ),
    create: jest.fn((value: Partial<T>) => value),
    save: jest.fn(async (value: T) => value),
  };
}

describe('ColorCardService', () => {
  const color = { id: 'color-1', lineId: 'line-1' };
  const line = { id: 'line-1', poId: 'po-1', status: LineStatus.DRAFT };
  const po = { id: 'po-1', status: PoStatus.DRAFT };

  function buildService(existingCards: any[] = []) {
    const colorRepo = repo([color]);
    const cardRepo = repo(existingCards);
    const lineRepo = repo([line]);
    const poRepo = repo([po]);
    const uploadsService = {
      uploadFile: jest.fn(async () => ({
        fileKey: 'color-cards/new.png',
        fileUrl: 'https://example.test/new.png',
        fileName: 'new.png',
        sizeMb: 1,
      })),
      getPresignedUrl: jest.fn(
        async (fileKey: string) => `https://example.test/${fileKey}`,
      ),
    };

    const service = new ColorCardService(
      colorRepo as any,
      cardRepo as any,
      lineRepo as any,
      poRepo as any,
      uploadsService as any,
    );

    return { service, cardRepo, uploadsService };
  }

  it('rejects replace without a reason before uploading a new file', async () => {
    const existing = {
      id: 'card-1',
      lineColorId: 'color-1',
      filePath: 'color-cards/old.png',
      fileName: 'old.png',
      uploadedBy: 'user-1',
      uploadedAt: new Date('2026-04-01T00:00:00.000Z'),
      status: 'active',
    };
    const { service, uploadsService } = buildService([existing]);

    await expect(
      service.upsertColorCard({
        poId: 'po-1',
        colorId: 'color-1',
        buffer: Buffer.from('image'),
        originalName: 'new.png',
        mimeType: 'image/png',
        actorId: 'user-2',
        actorRole: UserRole.NVKH,
        reason: '   ',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(uploadsService.uploadFile).not.toHaveBeenCalled();
  });

  it('rejects color cards when the color does not belong to the route PO', async () => {
    const { service } = buildService();

    await expect(service.getColorCard('po-other', 'color-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('updates uploadedAt when replacing an existing color card', async () => {
    const existing = {
      id: 'card-1',
      lineColorId: 'color-1',
      filePath: 'color-cards/old.png',
      fileName: 'old.png',
      uploadedBy: 'user-1',
      uploadedAt: new Date('2026-04-01T00:00:00.000Z'),
      status: 'active',
    };
    const { service, cardRepo } = buildService([existing]);

    const result = await service.upsertColorCard({
      poId: 'po-1',
      colorId: 'color-1',
      buffer: Buffer.from('image'),
      originalName: 'new.png',
      mimeType: 'image/png',
      actorId: 'user-2',
      actorRole: UserRole.NVKH,
      reason: 'Customer revised thread color',
    });

    expect(cardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: 'color-cards/new.png',
        uploadedBy: 'user-2',
        uploadedAt: expect.any(Date),
      }),
    );
    expect(result.uploadedAt.getTime()).toBeGreaterThan(
      new Date('2026-04-01T00:00:00.000Z').getTime(),
    );
  });
});
