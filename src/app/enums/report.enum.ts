export interface RecruiterGraphUnit {
    first_name: string,
    total_count: string,
    stage_name: string,
    created_at: string
}

export interface JobSummaryGraphUnit {
    job_title: string,
    total_count: string,
    stage_name: string,
    created_at: string
}

//For Client Revenue
export interface ClientRevenueGraphUnit {
    client_name_value: string,
    expected_revenue: string,
    actual_revenue: string
}

export interface TableRecruiterGraphUnit {
    created_at: string,
    cadidate_name: string,
    candidate_stage: string,
    job_title: string,
    total_experience: string,
    visa: string,
    salary_or_rate: any,

    bdm_name: string,
    recruiter_name: string
}

export enum ChartTypeEnum {
    BAR = 'bar',
    LINE = 'line',
}

export enum ReportDateRange {
    // NONE = 'Select Date',
    TODAY = 'today',
    Last24HOURS = 'last-24-hours',
    YESTERDAY = 'yesterday',
    WEEK = 'week',
    MONTH = 'month',
    CUSTOM = 'custom',
}

export enum ReportTags {
    BDM = 'bdm',
    RECRUITER = 'recruiter',
    CANDIDATE_REPORT = 'candidate_report',
    RECRUITER_PERFORMANCE = 'recruiter_performance',
    JOB_SUMMARY = 'job_summary',
    BDM_JOBS = 'bdm_job',
    JOB_AGE = 'job_aging',
    CLIENT_REVENUE = 'client_name_value',
    JOBS_BY_CLIENT = 'jobs_by_client',
}
