import { Subjects, Publisher, IExpirationCompleteEvent } from "@xtptickets/common";


export class ExpirationCompletePublisher extends Publisher<IExpirationCompleteEvent>{
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}