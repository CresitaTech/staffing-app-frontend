import * as moment from 'moment';
import { User } from './user';

export interface JobDescription {
    job_id: string,
    end_client_name: string,
    priority: boolean,
    industry_experience: string,
    nice_to_have_skills: string,
    job_title: string,
    job_description: string,
    min_client_rate: any,
    max_client_rate: any,
    job_pdf: any,
    job_recruiter_pdf: any,
    mode_of_work:any,
    mode_of_interview:any,
    number_of_opening:any,
    notice_period:any,
    visa_type: string,
    no_of_requests: any,
    roles_and_responsibilities: string,
    min_years_of_experience: number;
    max_years_of_experience: number;
    key_skills: string,
    education_qualificaion: string,
    start_date: string,
    job_posted_date: string,
    //  contract_type: string,
    employment_type_description: string,
    employment_type: string
    contract_duration: string,
    location: any,
    country: any;
    min_rate: any,
    max_rate: any,
    salary: any,
    min_salary: any,
    max_salary: any,
    // Rate: number,
    key_fields: string,
    status: any,
    revenue_frequency: string,
    projected_revenue: number,
    //default_recruiter: User;
    default_assignee: any,
    id?: string,
    isSelected?: boolean,
    created_by?: User,
    created_at?: string,
    updated_at?: string,
    client_name: string,
    isSalary?: string,
    primary_recruiter_name?: string,
    secondary_recruiter_name?: string,
    job_description_notes?:string,
    mandate_skills:any,
    currency?: string

}

export class JobDescriptionModel implements JobDescription {
    job_id: string;
    end_client_name: string;
    priority: boolean;
    mode_of_work:any;
    mode_of_interview:any;
    number_of_opening:any;
    notice_period:any;
    industry_experience: string;
    nice_to_have_skills: string;
    mandate_skills:any;
    job_title: string;
    job_description: string;
    job_pdf: any;
    job_recruiter_pdf: any;
    visa_type: string;
    no_of_requests: any;
    roles_and_responsibilities: string;
    min_years_of_experience: number;
    max_years_of_experience: number;
    key_skills: string;
    education_qualificaion: string;
    start_date: string;
    job_posted_date: string;
    // contract_type: string;
    employment_type: string;
    employment_type_description: string;
    contract_duration: string;
    location: any;
    country: string;
    min_rate: number;
    max_rate: number;
    min_salary: any;
    max_salary: any;
    salary: number;
    // Rate: number;
    key_fields: string;
    status: any;
    revenue_frequency: string;
    projected_revenue: number;
    //default_recruiter: User;
    default_assignee: User;
    id?: string;
    isSelected?: boolean;
    created_by?: User;
    created_at?: string;
    updated_at?: string;
    client_name: string;
    isSalary?: string;
    min_client_rate: any;
    max_client_rate: any;


    constructor() { }

    static getNewJobDescriptionId(): string {
        const m = moment().utc();
        return `OP-JDID${m.year()}${m.month() + 1}${m.date()}_${m.minute}${m.seconds}`
    }

}