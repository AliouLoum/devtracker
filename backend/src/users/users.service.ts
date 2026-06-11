import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: Pick<User, 'email' | 'password' | 'name'>): Promise<User> {
    const user = this.usersRepository.create({ ...data, email: data.email.toLowerCase() });
    return this.usersRepository.save(user);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { password: passwordHash });
  }

  async findOrCreateByGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { googleId: profile.googleId },
    });
    if (!user) {
      user = await this.usersRepository.findOne({
        where: { email: profile.email.toLowerCase() },
      });
    }
    if (user) {
      if (!user.googleId) {
        user.googleId = profile.googleId;
        await this.usersRepository.save(user);
      }
      return user;
    }
    const created = this.usersRepository.create({
      email: profile.email.toLowerCase(),
      name: profile.name,
      password: null as any,
      googleId: profile.googleId,
    });
    return this.usersRepository.save(created);
  }
}
