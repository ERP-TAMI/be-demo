import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity.js';
import { Stage } from './entities/stage.entity.js';
import { Workshop } from './entities/workshop.entity.js';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto.js';
import { CreateStageDto, UpdateStageDto } from './dto/stage.dto.js';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/workshop.dto.js';

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    @InjectRepository(Stage)
    private readonly stageRepo: Repository<Stage>,
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
  ) {}

  // ─── Materials ───────────────────────────────────────────────────────────────

  async findAllMaterials(): Promise<Material[]> {
    return this.materialRepo.find({ order: { materialCode: 'ASC' } });
  }

  async findOneMaterial(id: string): Promise<Material> {
    const material = await this.materialRepo.findOne({ where: { id } });
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
    Object.assign(material, dto);
    return this.materialRepo.save(material);
  }

  async removeMaterial(id: string): Promise<void> {
    const material = await this.findOneMaterial(id);
    await this.materialRepo.remove(material);
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
}
