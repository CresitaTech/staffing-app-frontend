import { JobDescription } from "./job-description";
import { User } from "./user";

export interface Assignment{

     primary_recruiter_email:string,
     primary_recruiter_name:User,
     secondary_recruiter_name:string,
     secondary_recruiter_email:string,
     number_of_unassigned_jobs:string,
     assignee_name:string,
     assignee_email:string,
     time_window:string,
     job_id:JobDescription,
     remarks:string,
     created_at:string,
     updated_at:string,
     id?:string,
     isSelected?:boolean


}




