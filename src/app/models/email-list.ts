import { Mail } from "./mail";

export interface EmailList{  
list_name: string;
campaign_name: string;
list_description : string;
template_name: string;
list_size: number;
list_data: Array<string>;
tag: string;
}