import { Mail } from "./mail";

export interface CustomField {
    field_name: string;
    field_type: string;
    field_size: number;
    field_desc: string;
    data_type: string;
    field_value: string;
    type: string;
}