
export interface Interviewer {
    first_name: string;
    last_name: string;
    zoom_username: string;
    zoom_password: string;
    zoom_api_key: string;
    zoom_api_secret: string;
    zoom_token: string;
    gmeet_username: string;
    gmeet_password: string;
    gmeet_api_key: string;
    gmeet_api_secret: string;
    gmeet_token: string;
    primary_email: string;
    secondary_email: string;
    phone_number: string;
    designation: string;
    id: any;
    time_slots: Array<any>;
    created_at: string;
    created_by?: string;
    updated_by?: string;
    
}

