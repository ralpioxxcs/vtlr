export interface TTSResponseDto {
  path: string;
}

export interface TTSRequestDto {
  playId: string;
  text: string;
  model?: string;
}
