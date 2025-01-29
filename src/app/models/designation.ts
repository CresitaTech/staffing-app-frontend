import { BaseInterface } from "./base-interface";

export interface Designation extends BaseInterface {
    name: string,
    remark: string,
    id?: string,
    created_at?: string,
    updated_at?: string,
}