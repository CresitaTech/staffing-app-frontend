import { Candidate } from "./candidate";
import { User } from "./user";

export interface Submission {
   
         candidate_name:Candidate,
         recruiter_email:string,
         recruiter_name:User,
         assignee_name:string,
         assignee_email:string,
         remarks:string,
         candidate_resume:string,
         created_at:string,
         updated_at:string,
         id?:string,
         isSelected?:boolean
    
     }

