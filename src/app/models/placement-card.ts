import { Candidate } from "./candidate";

    export interface PlacementCard extends Candidate{
           reminder_date:string,
           payment_amount:string,
           status:string,
           remarks:string,
           recruiter_name:string,
           created_at:string,
           updated_at:string,
           candidate_name:string,
           client_name: string,
           isSelected:boolean,
           id?:string,    
       }