import { ITicket } from './ticket.model';

export interface IOrder {
    userId: string;
    status: string;
    expiresAt: string;
    ticket: ITicket;
    version: number;
    id: string;
    price?: number;
}