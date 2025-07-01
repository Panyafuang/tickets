import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'secondsToMmss',
})
export class SecondsToMmssPipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || seconds < 0) {
      return '00:00';
    }

    const minutes: number = Math.floor(seconds / 60);
    const remainingSeconds: number = seconds % 60;

    const formattedMinutes: string = this.padZero(minutes);
    const formattedSeconds: string = this.padZero(remainingSeconds);

    return `${formattedMinutes}:${formattedSeconds}`;
  }

  private padZero(num: number): string {
    return num < 10 ? '0' + num : '' + num;
  }
}
