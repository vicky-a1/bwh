import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from '../../common/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoursesService } from './courses.service';
import { CoursesProgressService } from './courses.progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('courses')
export class CoursesProgressController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly progressService: CoursesProgressService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(':slug/enroll')
  async enroll(@Req() req: RequestWithUser, @Param('slug') slug: string) {
    const course = await this.coursesService.getCourseBySlug(slug);
    const enrollment = await this.progressService.enroll(
      req.user.sub,
      course.id,
    );
    return { enrolledAt: enrollment.enrolledAt };
  }

  @UseGuards(JwtAuthGuard)
  @Put('lessons/:lessonId/progress')
  async updateProgress(
    @Req() req: RequestWithUser,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    const result = await this.progressService.upsertLessonProgress(
      req.user.sub,
      lessonId,
      dto.percent,
    );
    return {
      lessonId: result.lessonId,
      percent: result.percent,
      updatedAt: result.updatedAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':slug/certify')
  async certify(@Req() req: RequestWithUser, @Param('slug') slug: string) {
    const course = await this.coursesService.getCourseBySlug(slug);
    const cert = await this.progressService.issueCertification(
      req.user.sub,
      course.id,
    );
    return { issuedAt: cert.issuedAt };
  }
}
