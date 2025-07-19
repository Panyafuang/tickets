export interface IRoute {
    id: string;
    origin: string;
    destination: string;
    distanceKm?: number;
    durationHours?: number;
}