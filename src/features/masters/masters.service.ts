import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, StockStatus } from './entities/material.entity';
import { MaterialGroup } from './entities/material-group.entity';
import { Stage } from './entities/stage.entity';
import { Workshop } from './entities/workshop.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { MaterialSize } from './entities/material-size.entity';
import { CreateMaterialDto, UpdateMaterialDto, AdjustStockDto } from './dto/material.dto.js';
import { CreateMaterialSizeDto, UpdateMaterialSizeDto, BulkCreateMaterialSizeDto } from './dto/material-size.dto.js';
import { CreateStageDto, UpdateStageDto } from './dto/stage.dto.js';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/workshop.dto.js';

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    @InjectRepository(MaterialGroup)
    private readonly materialGroupRepo: Repository<MaterialGroup>,
    @InjectRepository(Stage)
    private readonly stageRepo: Repository<Stage>,
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,
    @InjectRepository(MaterialSize)
    private readonly materialSizeRepo: Repository<MaterialSize>,
  ) {}

  // ─── Materials ───────────────────────────────────────────────────────────────

  async findAllMaterials(): Promise<Material[]> {
    return this.materialRepo.find({
      relations: ['materialGroupEntity'],
      order: { materialCode: 'ASC' },
    });
  }

  async findOneMaterial(id: string): Promise<Material> {
    const material = await this.materialRepo.findOne({
      where: { id },
      relations: ['materialGroupEntity'],
    });
    if (!material) {
      throw new NotFoundException(`Material #${id} not found`);
    }
    return material;
  }

  async createMaterial(dto: CreateMaterialDto): Promise<Material> {
    const existing = await this.materialRepo.findOne({
      where: { materialCode: dto.materialCode },
    });
    if (existing) {
      throw new ConflictException(
        `Material code "${dto.materialCode}" already exists`,
      );
    }
    const material = this.materialRepo.create(dto);
    return this.materialRepo.save(material);
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findOneMaterial(id);
    const { materialCode, ...rest } = dto;

    if (materialCode !== undefined && materialCode !== material.materialCode) {
      const existing = await this.materialRepo.findOne({ where: { materialCode } });
      if (existing) {
        throw new ConflictException(`Material code "${materialCode}" already exists`);
      }
    }

    // Only update fields that are explicitly provided (skip undefined)
    const defined = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    );
    Object.assign(material, defined, { materialCode: materialCode ?? material.materialCode });
    return this.materialRepo.save(material);
  }

  async removeMaterial(id: string): Promise<void> {
    const material = await this.findOneMaterial(id);
    await this.materialRepo.remove(material);
  }

  async findAllMaterialsWithStock(): Promise<Material[]> {
    const materials = await this.materialRepo.find({ order: { materialCode: 'ASC' } });
    return materials.map(m => this.addStockStatus(m));
  }

  async findLowStockMaterials(): Promise<Material[]> {
    const materials = await this.materialRepo
      .createQueryBuilder('material')
      .where('material.currentStock <= material.lowStockThreshold')
      .andWhere('material.status = :status', { status: 'Active' })
      .orderBy('material.currentStock', 'ASC')
      .getMany();
    return materials.map(m => this.addStockStatus(m));
  }

  async adjustStock(
    id: string,
    dto: AdjustStockDto,
    userId: string,
  ): Promise<Material> {
    const material = await this.findOneMaterial(id);
    const newStock = Number(material.currentStock) + dto.adjustment;
    if (newStock < 0) {
      throw new BadRequestException(
        `Stock cannot be negative. Current: ${material.currentStock}, Adjustment: ${dto.adjustment}`,
      );
    }
    material.currentStock = newStock;
    await this.materialRepo.save(material);
    const movement = this.stockMovementRepo.create({
      materialId: id,
      movementType: dto.movementType,
      quantity: dto.adjustment,
      reason: dto.reason || '',
      createdById: userId,
    });
    await this.stockMovementRepo.save(movement);
    return this.addStockStatus(material);
  }

  async getStockMovements(materialId: string): Promise<StockMovement[]> {
    await this.findOneMaterial(materialId);
    return this.stockMovementRepo.find({
      where: { materialId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  private addStockStatus(material: Material): Material {
    const stock = Number(material.currentStock);
    const threshold = Number(material.lowStockThreshold);
    if (stock === 0) {
      (material as any).stockStatus = StockStatus.OUT;
    } else if (stock <= threshold) {
      (material as any).stockStatus = StockStatus.LOW;
    } else {
      (material as any).stockStatus = StockStatus.OK;
    }
    return material;
  }

  // ─── Material Groups ─────────────────────────────────────────────────────────

  async findAllMaterialGroups(): Promise<MaterialGroup[]> {
    return this.materialGroupRepo.find({ order: { displayOrder: 'ASC' } });
  }

  async findOneMaterialGroup(id: string): Promise<MaterialGroup> {
    const group = await this.materialGroupRepo.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`MaterialGroup #${id} not found`);
    }
    return group;
  }

  async createMaterialGroup(name: string): Promise<MaterialGroup> {
    const existing = await this.materialGroupRepo.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException(`MaterialGroup "${name}" already exists`);
    }
    const maxOrder = await this.materialGroupRepo
      .createQueryBuilder('mg')
      .select('MAX(mg.displayOrder)', 'max')
      .getRawOne();
    const group = this.materialGroupRepo.create({
      name,
      displayOrder: (maxOrder?.max || 0) + 1,
    });
    return this.materialGroupRepo.save(group);
  }

  async updateMaterialGroup(id: string, name: string): Promise<MaterialGroup> {
    const group = await this.findOneMaterialGroup(id);
    const existing = await this.materialGroupRepo.findOne({ where: { name } });
    if (existing && existing.id !== id) {
      throw new ConflictException(`MaterialGroup "${name}" already exists`);
    }
    group.name = name;
    return this.materialGroupRepo.save(group);
  }

  async removeMaterialGroup(id: string): Promise<void> {
    const group = await this.findOneMaterialGroup(id);
    await this.materialGroupRepo.remove(group);
  }

  // ─── Stages ──────────────────────────────────────────────────────────────────

  async findAllStages(): Promise<Stage[]> {
    return this.stageRepo.find({ order: { stageCode: 'ASC' } });
  }

  async findOneStage(id: string): Promise<Stage> {
    const stage = await this.stageRepo.findOne({ where: { id } });
    if (!stage) {
      throw new NotFoundException(`Stage #${id} not found`);
    }
    return stage;
  }

  async createStage(dto: CreateStageDto): Promise<Stage> {
    const existing = await this.stageRepo.findOne({
      where: { stageCode: dto.stageCode },
    });
    if (existing) {
      throw new ConflictException(
        `Stage code "${dto.stageCode}" already exists`,
      );
    }
    const stage = this.stageRepo.create(dto);
    return this.stageRepo.save(stage);
  }

  async updateStage(id: string, dto: UpdateStageDto): Promise<Stage> {
    const stage = await this.findOneStage(id);
    Object.assign(stage, dto);
    return this.stageRepo.save(stage);
  }

  async removeStage(id: string): Promise<void> {
    const stage = await this.findOneStage(id);
    await this.stageRepo.remove(stage);
  }

  // ─── Workshops ───────────────────────────────────────────────────────────────

  async findAllWorkshops(): Promise<Workshop[]> {
    return this.workshopRepo.find({ order: { workshopCode: 'ASC' } });
  }

  async findOneWorkshop(id: string): Promise<Workshop> {
    const workshop = await this.workshopRepo.findOne({ where: { id } });
    if (!workshop) {
      throw new NotFoundException(`Workshop #${id} not found`);
    }
    return workshop;
  }

  async createWorkshop(dto: CreateWorkshopDto): Promise<Workshop> {
    const existing = await this.workshopRepo.findOne({
      where: { workshopCode: dto.workshopCode },
    });
    if (existing) {
      throw new ConflictException(
        `Workshop code "${dto.workshopCode}" already exists`,
      );
    }
    const workshop = this.workshopRepo.create(dto);
    return this.workshopRepo.save(workshop);
  }

  async updateWorkshop(id: string, dto: UpdateWorkshopDto): Promise<Workshop> {
    const workshop = await this.findOneWorkshop(id);
    Object.assign(workshop, dto);
    return this.workshopRepo.save(workshop);
  }

  async removeWorkshop(id: string): Promise<void> {
    const workshop = await this.findOneWorkshop(id);
    await this.workshopRepo.remove(workshop);
  }

  // ─── Material Sizes ─────────────────────────────────────────────────────────

  async findAllSizesByMaterial(materialId: string): Promise<MaterialSize[]> {
    await this.findOneMaterial(materialId);
    return this.materialSizeRepo.find({
      where: { materialId },
      order: { size: 'ASC' },
    });
  }

  async createMaterialSize(dto: CreateMaterialSizeDto): Promise<MaterialSize> {
    await this.findOneMaterial(dto.materialId);

    const existing = await this.materialSizeRepo.findOne({
      where: { materialId: dto.materialId, size: dto.size },
    });
    if (existing) {
      throw new ConflictException(
        `Size "${dto.size}" already exists for this material`,
      );
    }

    const size = this.materialSizeRepo.create(dto);
    return this.materialSizeRepo.save(size);
  }

  async bulkCreateMaterialSizes(materialId: string, dto: BulkCreateMaterialSizeDto): Promise<MaterialSize[]> {
    await this.findOneMaterial(materialId);

    const sizes = dto.sizes.map(size =>
      this.materialSizeRepo.create({
        materialId,
        size,
      })
    );

    return this.materialSizeRepo.save(sizes);
  }

  async updateMaterialSize(id: string, dto: UpdateMaterialSizeDto): Promise<MaterialSize> {
    const size = await this.materialSizeRepo.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`MaterialSize #${id} not found`);
    }

    Object.assign(size, dto);
    return this.materialSizeRepo.save(size);
  }

  async removeMaterialSize(id: string): Promise<void> {
    const size = await this.materialSizeRepo.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`MaterialSize #${id} not found`);
    }
    await this.materialSizeRepo.remove(size);
  }

  async getMaterialWithSizes(materialId: string) {
    const material = await this.findOneMaterial(materialId);
    const sizes = await this.findAllSizesByMaterial(materialId);
    return { ...material, sizes };
  }
}
