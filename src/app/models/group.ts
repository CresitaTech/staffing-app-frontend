import { BaseInterface } from "./base-interface";
import { Permission } from "./permission";

export interface Group extends BaseInterface {
    id?: number;
    name: string,
    permissions: Array<Permission>,
    created_at?:string
}