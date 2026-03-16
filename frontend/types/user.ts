export interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    bio ?:String;
    phone ?:string;
    createdAt?: string;
    updatedAt?: string;

}