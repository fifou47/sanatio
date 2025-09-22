import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  get() {
    return { status: 'ok', service: 'sanatio_consultation', timestamp: new Date().toISOString() };
  }
}

