import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InstagramModule } from './modules/instagram/instagram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InstagramModule,
  ],
})
export class AppModule {}
