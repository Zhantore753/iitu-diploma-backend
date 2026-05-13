import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/public/public.decorator';
import { User } from 'src/users/users.decorator';
import { BookRentalDto } from './dto/book-rental.dto';
import { RentalService } from './rental.service';

@ApiTags('rental')
@ApiBearerAuth()
@Controller('rental')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  /** Renter books a machine. renterId comes from the JWT. */
  @Post('book')
  @ApiOperation({ summary: 'Book a machine rental' })
  async bookRental(@User() user: any, @Body() dto: BookRentalDto) {
    return this.rentalService.bookRental(user.sub, dto);
  }

  /** All bookings where the current user is the renter */
  @Get('my-rentals')
  @ApiOkResponse({ description: 'List of rentals for the authenticated renter' })
  @ApiOperation({ summary: 'Get my bookings (as renter)' })
  async myRentals(@User() user: any) {
    return this.rentalService.myRentals(user.sub);
  }

  /** All bookings for machines owned by the current user */
  @Get('provider-rentals')
  @ApiOkResponse({ description: 'List of rentals for machines owned by the authenticated user' })
  @ApiOperation({ summary: 'Get bookings for my machines (as provider)' })
  async providerRentals(@User() user: any) {
    return this.rentalService.providerRentals(user.sub);
  }

  /** Public: booked date ranges for a machine (excludes cancelled) */
  @Get('machine/:machineId/booked-dates')
  @Public()
  @ApiOkResponse({ description: 'Array of booked date ranges' })
  @ApiOperation({ summary: 'Get booked dates for a machine (public)' })
  async bookedDates(@Param('machineId', ParseIntPipe) machineId: number) {
    return this.rentalService.getBookedDates(machineId);
  }

  /** Cancel a booking (renter or provider) */
  @Patch(':id/cancel')
  @ApiOkResponse({ description: 'Booking cancelled' })
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancelRental(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
  ) {
    return this.rentalService.cancelRental(id, user.sub);
  }

  /** Transition a booking to the next status (provider confirms/completes) */
  @Patch(':id/status')
  @ApiOkResponse({ description: 'Booking status updated' })
  @ApiOperation({ summary: 'Transition booking status (confirmed | completed | cancelled)' })
  async transitionStatus(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
    @Body('status') status: 'confirmed' | 'completed' | 'cancelled',
  ) {
    return this.rentalService.transitionStatus(id, user.sub, status);
  }

  /** Get full details of a single booking */
  @Get(':id')
  @ApiOkResponse({ description: 'Booking details' })
  @ApiOperation({ summary: 'Get booking by ID' })
  async rentalDetails(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.rentalService.rentalDetails(id, user.sub);
  }
}
