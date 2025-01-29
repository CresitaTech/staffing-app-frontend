import { Candidate } from "./candidate";

export interface Rtr extends Candidate{
            job_title:string,
            rate:any,
            consultant_full_legal_name:string,
            address:string,
            last_4_ssn:string,
            phone_no:string,
            email:string,
            rtr_doc:string,
            created_at:string,
            updated_at:string,
            candidate_name:Candidate,
            isSelected:boolean,
            id?:string  
            job_id:string
        }