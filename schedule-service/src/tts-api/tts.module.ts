import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TTSService } from './tts.service';

@Module({
  imports: [
    HttpModule,
  ],
  providers: [TTSService],
  exports: [TTSService],
})
export class TTSModule {}
