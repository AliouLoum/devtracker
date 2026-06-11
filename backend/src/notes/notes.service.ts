import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
  ) {}

  async findAllForUser(userId: string): Promise<Note[]> {
    return this.notesRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneForUser(userId: string, id: string): Promise<Note> {
    const note = await this.notesRepository.findOne({
      where: { id, userId },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    const note = this.notesRepository.create({
      userId,
      title: dto.title,
      content: dto.content ?? '',
    });
    return this.notesRepository.save(note);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNoteDto,
  ): Promise<Note> {
    const note = await this.findOneForUser(userId, id);
    Object.assign(note, dto);
    return this.notesRepository.save(note);
  }

  async remove(userId: string, id: string): Promise<void> {
    const note = await this.findOneForUser(userId, id);
    await this.notesRepository.remove(note);
  }
}
