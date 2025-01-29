import { Candidate } from "./candidate";

export interface Feedback {

        interview_date:string,
        duration:string,
        forwarded:string,
        mail_from:string,
        mail_to:string,
        mail_subject:string,
        mail_cc:string,
        feedback:string,
        attachment:string,
        id:string,
        isSelected:boolean
        // interview:string,
        // candidate_name:Candidate,
        // time_slot:string,
        // created_by:string,
        // updated_by:string,
        // id?:string,
        // isSelected?:boolean

}


export interface Interview  {
    
         time_zone:string,
         meeting_time:string,
         status:string,
         remarks:string,
         recruiter_name:string,
         candidate_name:any,
         interviewer_name:any,
         time_slot:string,
         source:string,
         jd_attachment:string,
         created_by:string,
         updated_by:string,
         created_at:string,
        //  manual_time_slot:string,
         manual_invite:string,
         updated_at:string,
         id:string,
         isSelected:boolean
}


export interface Source{
   
        source:string,
        remarks:string,
        created_by:string,
        updated_by:string,
        id?:string,
        isSelected?:boolean
}