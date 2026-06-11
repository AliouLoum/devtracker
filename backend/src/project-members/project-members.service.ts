import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember, ProjectRole } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private membersRepository: Repository<ProjectMember>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getMembers(projectId: string, userId: string) {
    const isMember = await this.membersRepository.findOne({
      where: { projectId, userId },
    });
    const project = await this.projectRepository.findOne({ where: { id: projectId }});

    if (!isMember && project?.userId !== userId) {
      throw new NotFoundException('Project not found');
    }

    return this.membersRepository.find({
      where: { projectId },
      relations: ['user'],
    });
  }

  async addMember(projectId: string, email: string, currentUserId: string) {
    const project = await this.projectRepository.findOne({ where: { id: projectId }});
    if (!project || project.userId !== currentUserId) {
      throw new NotFoundException('Project not found or you do not have permission');
    }

    const userToAdd = await this.userRepository.findOne({ where: { email } });
    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.membersRepository.findOne({
      where: { projectId, userId: userToAdd.id },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    const member = this.membersRepository.create({
      projectId,
      userId: userToAdd.id,
      role: ProjectRole.MEMBER,
    });

    return this.membersRepository.save(member);
  }

  async removeMember(projectId: string, memberId: string, currentUserId: string) {
    const project = await this.projectRepository.findOne({ where: { id: projectId }});
    if (!project || project.userId !== currentUserId) {
      throw new NotFoundException('Project not found or you do not have permission');
    }

    await this.membersRepository.delete({ projectId, userId: memberId });
  }
}
