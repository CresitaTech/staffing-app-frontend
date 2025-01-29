import { Candidate } from "./candidate";
import { CandidateStages } from "./candidateStages";

export interface Activity {
        activity_status: string ,
        notes: string,
        remarks: string,
        created_at: string,
        updated_at: string,
        candidate_name: Candidate,
        job_description:any,
        jd_name:any,
        stage_name:any,
        submission_date:string,
        isSelected: boolean,
        id?: string,
        send_out_date?:string,
        meeting_mode?:string,
        manual_invite?:string,
        schedule_interview_now?:String,
        job_status?:String,
        
        min_rate?:string,
        max_rate?:string,
        min_salary?:string,
        max_salary?:string,
        isSalary?:string,
        visa?:string,
        
        /**job_max_salary?:string,
        job_min_rate?:string,
        job_max_rate?:string */
}