import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { TTSRequestDto, TTSResponseDto } from './tts.interface';
import { TTS_API_ENDPOINT } from './tts.const';

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);

  constructor(readonly httpService: HttpService) {}

  async createTTS(requestDto: TTSRequestDto): Promise<TTSResponseDto> {
    this.logger.debug(`tts-service reqDto: ${JSON.stringify(requestDto)}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${process.env.TTS_SERVICE_HOST}/${TTS_API_ENDPOINT.POST_TTS}`,
          requestDto,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      this.logger.log(`Response: ${JSON.stringify(response.data)}`);

      return {
        path: '',
      };
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      throw error;
    }
  }
}
