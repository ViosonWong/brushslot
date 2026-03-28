import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      ok: true,
      service: 'brushslot-api',
      time: new Date().toISOString(),
    };
  }
}
