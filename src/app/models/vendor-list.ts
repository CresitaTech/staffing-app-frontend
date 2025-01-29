import { Mail } from "./mail";

export interface VendorList{  
list_name: string;
list_description : string;
template_name: string;
list_size: number;
list_data: Array<string>;
tag: string;
}