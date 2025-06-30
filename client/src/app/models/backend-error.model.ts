export interface IBackEndError {
    field?: string; // field may be optional if it's a general error
    message: string;
}