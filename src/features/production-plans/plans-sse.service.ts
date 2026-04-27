import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PlansSseService {
  private subject = new Subject<string>();

  emit(planId: string): void {
    this.subject.next(planId);
  }

  observe(): Observable<MessageEvent> {
    return this.subject.pipe(
      map(
        (planId) =>
          ({
            data: { planId, type: 'plans:updated' },
            type: 'plans:updated',
          }) as MessageEvent,
      ),
    );
  }
}
