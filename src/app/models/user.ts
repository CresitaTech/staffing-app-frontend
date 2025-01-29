import { BaseInterface } from "./base-interface";
import { Group } from "./group";
import { Permission } from "./permission";

export interface User extends BaseInterface {
    email: string,
    first_name: string,
    last_name: string,
    country: any,
    user_countries: any,
    avatar: any,
    date_joined: string,
    role: number,
    send_notification: string;
    is_active: boolean,
    is_deleted: boolean,
    username: string,
    user_permissions?: Array<Permission>,
    groups?: Array<Group>,
    id?: string,
    password?: string,
    confirmPassword?: string,
    created_by?: string,
    updated_by?: string,
    created_at?: string,
}