import csv
import os
from django.core.mail import EmailMessage
from django.db.models import Count, Q, Sum
from django.http import HttpResponse
from django.db import connection
import datetime
from datetime import datetime as dt
import pandas as pd
from rest_framework.authtoken.models import Token

# Create your views here.
from django.template.loader import render_to_string
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, generics, status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from django.shortcuts import render

from candidates.models import Candidates, candidatesJobDescription
from candidates.serializers import CandidateSerializer, CandidateWriteSerializer, CandidateJobsStagesSerializer
from clients.models import clientModel
from comman_utils.utils import get_datetime_from_date, get_startdate_and_enddate
from jobdescriptions.serializers import JobDescriptionSerializer, GetJobCurrentStatusSerializer, \
    JobDescriptionWriteSerializer
from comman_utils import utils
from jobdescriptions.models import jobModel
from reports.filters import ReportFilter
from rest_framework.permissions import DjangoModelPermissions

from reports.serializers import RecruiterPerformanceSummarySerializer, WeekendEmailReportSerializer, \
    RecruiterPerformanceSummaryGraphSerializer, \
    BdmPerformanceSummarySerializer, BdmPerformanceSummarySerializerSep, BdmPerformanceSummaryGraphSerializer, JobSummarySerializer, \
    JobSummaryGraphSerializer, ClientSummarySerializer, TopFivePlacementSerializer, ClientDropdownListSerializer, \
    JobsDropdownListSerializer, ClientDashboardListSerializer, UserObjectSerializer, ActiveClientSerializer, \
    TotalRecordSerializer, BdmEmailReportSerializer, RecruiterEmailReportSerializer, \
    RecruiterSubmissionReportSerializer, \
    RecruiterSubmissionFollowUpReportSerializer, RecruitersPerformanceSummarySerializer, \
    AssingedDashboardListSerializer, ClientRevenueSerializer, \
    JobSummaryTableSerializer, MyCandidateSerializer, UnassignedJobsSerializer, JobsByBDMTableSerializer, \
    JobsByBDMGraphSerializer, ActiveJobsAgingSerializer, AssingedDashboardSerializer, \
    JobSubmissionsByClientTableSerializer, JobSubmissionsByClientGraphSerializer, TopClientSerializer, \
    BdmPerformanceSummaryCSVSerializer, UserReportSerializer, BdmJobsReportSerializer, \
    BdmJobsAssignmentReportSerializer, JobSummaryCSVSerializer, RecruiterSubmissionReportSerializer, \
    BdmDailySubmissionReportSerializer, BdmSubmissionFollowUpReportSerializer, TopFiveHighPriorityJobSerializer, \
    CandidateReportSerializer, BdmJobsSummaryReportSerializer, BdmJobSummaryTableSerializer, \
    BdmDailyJobsSummaryReportSerializer, BdmJobSummaryTableByTitleSerializer, \
    BdmJobSummaryTableByDatewiseBreakdownSerializer, CandidateDetailsByJobIdSerializer, \
    JobSummaryTableByTitleAllDataSerializer, JobSummaryCommonSubmissionSerializerCsv, \
    RecruitersCallsPerformanceSummaryTableSerializer, RecruitersCallsPerformanceSummaryAllDataSerializer, \
    NoSubmissionSerializer, RecruitersCallsPerformanceSummaryAllDataByJobIdSerializer, \
    RecruiterCallsPerformanceSummaryByJobAndRecruiterSerializer
from reports.store_procedures_call import get_jobs_summary_csv_by_date_range_and_id, get_candidate_queryset, \
    get_jobs_summary_by_datewise_breakdown, get_candidate_details_by_job_id, \
    get_jobs_summary_by_job_title_alldata, get_recruiter_calls_performance_table, \
    get_recruiter_calls_performance_table_alldata, get_jobs_summary_by_datewise_breakdown_csv, \
    get_candidate_details_by_job_id_csv, get_recruiter_calls_performance_table_alldata_csv, \
    get_recruiter_calls_performance_table_alldata_by_job_id, recruiter_calls_performance_summary_by_job_and_recruiter, \
    get_job_submission_by_client

# SELECT COUNT(*) as total_count, s.stage_name FROM `osms_candidates` as c, `candidates_stages` as s WHERE c.stage_id = s.id GROUP BY c.stage_id
# SELECT COUNT(*) as total_count, s.stage_name, u.first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id GROUP BY c.stage_id, u.first_name
from reports.utils import sortDic, calculateSubmission, calculateSendOut, download_csv, formulaFields
from staffingapp.settings import GLOBAL_ROLE, EMAIL_FROM_USER, BASE_DIR
from users.models import User
from users.serializers import UserSerializer, UserRestrictSerializer
import logging

logger = logging.getLogger(__name__)

####################### Recruiter Calls Report #############################

class RecruiterCallsPerformanceSummaryTable(generics.ListAPIView):
    serializer_class = RecruitersCallsPerformanceSummaryTableSerializer
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        logger.info('Recruter Performance Report Request' + str(request))
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        stage_name = request.query_params.get('stage_name')

        recruiter_id = request.query_params.get('recruiter_id')
        country = request.query_params.get('country')
        data_type = request.query_params.get('data_type')

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        print(start_date)
        print(end_date)

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroupID = None
        userGroup = None
        queryset = None

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
            # logger.info("groups: " + str(groups['groups']))
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
            userGroupID = userGroupDict['id']

        logger.info('userGroup Data: %s' % userGroup)
        logger.info('userGroupID Data: %s' % userGroupID)
        logger.info('stage_name: %s' % stage_name)
        uid = str(request.user.id).replace("-", "")

        if date_range == 'today':
            queryset = get_recruiter_calls_performance_table(today, today, recruiter_id, country, data_type)
        elif date_range == 'yesterday':
            queryset = get_recruiter_calls_performance_table(yesterday, yesterday, recruiter_id, country, data_type)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_recruiter_calls_performance_table(start_date, today, recruiter_id, country, data_type)
        elif date_range == 'week':
            queryset = get_recruiter_calls_performance_table(week_start, week_end, recruiter_id, country, data_type)
        elif date_range == 'month':
            queryset = get_recruiter_calls_performance_table(month_start, month_end, recruiter_id, country, data_type)
        elif start_date is not None and end_date is not None:
            queryset = get_recruiter_calls_performance_table(start_date, end_date, recruiter_id, country, data_type)

        if queryset is not None:
            logger.info('get_recruiter_calls_performance_table: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = RecruitersCallsPerformanceSummaryTableSerializer(queryset, many=True)
        # print(serializer.data['first_name'])

        return Response(serializer.data)


class RecruiterCallsPerformanceSummaryAllData(generics.ListAPIView):
    serializer_class = RecruitersCallsPerformanceSummaryAllDataSerializer
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        logger.info('Recruter Performance Report Request' + str(request))
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        stage_name = request.query_params.get('stage_name')

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        print(start_date)
        print(end_date)

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroupID = None
        userGroup = None
        queryset = None

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
            # logger.info("groups: " + str(groups['groups']))
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
            userGroupID = userGroupDict['id']

        logger.info('userGroup Data: %s' % userGroup)
        logger.info('userGroupID Data: %s' % userGroupID)
        logger.info('stage_name: %s' % stage_name)
        uid = str(request.user.id).replace("-", "")

        if date_range == 'today':
            queryset = get_recruiter_calls_performance_table_alldata(today, today)
        elif date_range == 'yesterday':
            queryset = get_recruiter_calls_performance_table_alldata(yesterday, today)
        elif date_range == 'last-24-hours':
            queryset = get_recruiter_calls_performance_table_alldata(yesterday, today)
        elif date_range == 'week':
            queryset = get_recruiter_calls_performance_table_alldata(week_start, week_end)
        elif date_range == 'month':
            queryset = get_recruiter_calls_performance_table_alldata(month_start, month_end)
        elif start_date is not None and end_date is not None:
            queryset = get_recruiter_calls_performance_table_alldata(start_date, end_date)

        if queryset is not None:
            logger.info('Recruiter Perf Table QuerySet Query formed: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = RecruitersCallsPerformanceSummaryAllDataSerializer(queryset, many=True)
        # print(serializer.data['first_name'])


        return Response(serializer.data)

class RecruiterCallsPerformanceSummaryAllDataByJobId(generics.ListAPIView):
    serializer_class = RecruitersCallsPerformanceSummaryAllDataSerializer
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        logger.info('Recruter Performance Report Request' + str(request))
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        recruiter_id = request.query_params.get('recruiter_id')
        country = request.query_params.get('country')

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        print(start_date)
        print(end_date)

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroupID = None
        userGroup = None
        queryset = None

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
            # logger.info("groups: " + str(groups['groups']))
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
            userGroupID = userGroupDict['id']

        logger.info('userGroup Data: %s' % userGroup)
        logger.info('userGroupID Data: %s' % userGroupID)
        job_id = str(job_id).replace("-", "")

        if date_range == 'today':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(today, today, job_id, recruiter_id, country)
        elif date_range == 'yesterday':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(yesterday, yesterday, job_id, recruiter_id, country)
        elif date_range == 'last-24-hours':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(yesterday, today, job_id, recruiter_id, country)
        elif date_range == 'week':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(week_start, week_end, job_id, recruiter_id, country)
        elif date_range == 'month':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(month_start, month_end, job_id, recruiter_id, country)
        elif start_date is not None and end_date is not None:
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(start_date, end_date, job_id, recruiter_id, country)

        if queryset is not None:
            logger.info('Recruiter Perf Table QuerySet Query formed: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = RecruitersCallsPerformanceSummaryAllDataByJobIdSerializer(queryset, many=True)
        # print(serializer.data['first_name'])

        return Response(serializer.data)


class RecruiterCallsPerformanceSummaryAllDataByJobIdCSV(generics.ListAPIView):
    serializer_class = RecruitersCallsPerformanceSummaryAllDataSerializer
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        logger.info('Recruter Performance Report Request' + str(request))
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        recruiter_id = request.query_params.get('recruiter_id')
        country = request.query_params.get('country')

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        print(start_date)
        print(end_date)

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroupID = None
        userGroup = None
        queryset = None

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
            # logger.info("groups: " + str(groups['groups']))
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
            userGroupID = userGroupDict['id']

        logger.info('userGroup Data: %s' % userGroup)
        logger.info('userGroupID Data: %s' % userGroupID)
        job_id = str(job_id).replace("-", "")

        if date_range == 'today':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(today, today, job_id, recruiter_id, country)
        elif date_range == 'yesterday':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(yesterday, today, job_id, recruiter_id, country)
        elif date_range == 'last-24-hours':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(yesterday, today, job_id, recruiter_id, country)
        elif date_range == 'week':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(week_start, week_end, job_id, recruiter_id, country)
        elif date_range == 'month':
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(month_start, month_end, job_id, recruiter_id, country)
        elif start_date is not None and end_date is not None:
            queryset = get_recruiter_calls_performance_table_alldata_by_job_id(start_date, end_date, job_id, recruiter_id, country)

        if queryset is not None:
            logger.info('Recruiter Perf Table QuerySet Query formed: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = RecruitersCallsPerformanceSummaryAllDataByJobIdSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        for i in range(array_length):
            rows = {
                'job_title': serializer.data[i]['job_title'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'submitted_on': serializer.data[i]['submitted_on'],
                'current_status': serializer.data[i]['current_status'],
                'last_updated_on': serializer.data[i]['last_updated_on'],
                'total_exp': serializer.data[i]['total_exp'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'assignment_type': serializer.data[i]['assignment_type'],
                'remarks': serializer.data[i]['remarks']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
        writer = csv.DictWriter(response,
                                fieldnames=['job_title', 'candidate_name', 'recruiter_name', 'submitted_on', 'current_status', 'last_updated_on', 'total_exp',
                                            'min_salary', 'max_salary', 'assignment_type', 'remarks'
                                            ])

        writer.writeheader()
        writer.writerows(outputs)

        return response


class RecruiterCallsPerformanceSummaryGraph(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        print(today)
        yesterday = utils.yesterday_datetime()
        print(yesterday)

        week_start, week_end = utils.week_date_range()
        print(week_start)
        print(week_end)

        month_start, month_end = utils.month_date_range()
        print(month_start)
        print(month_end)

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")

        queryset = None
        print(GLOBAL_ROLE.get('ADMIN'))

        # if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):

        if date_range == 'today':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date > %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [today])
        elif date_range == 'yesterday':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date > %s AND cjs.submission_date < %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [yesterday, today])
        elif date_range == 'week':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [week_start, week_end])
        elif date_range == 'month':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [month_start, month_end])
        elif start_date is not None and end_date is not None:
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [start_date, end_date])

        """        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, start_date, end_date])
"""
        if queryset is not None:
            logger.info('Recruiter Perf Graph QuerySet Query formed: ' + str(queryset.query))
        serializer = RecruiterPerformanceSummaryGraphSerializer(queryset, many=True)
        # print(serializer.data)
        return Response(serializer.data)


class RecruiterCallsPerformanceSummaryCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):

        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        recruiter_id = request.query_params.get('recruiter_id')
        country = request.query_params.get('country')
        data_type = request.query_params.get('data_type')

        if end_date is not None:
            start_date, end_date = get_startdate_and_enddate(start_date, end_date)

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")

        if data_type == 'all_data':
            logger.info("All Data Download")
            if date_range == 'today':
                queryset = get_recruiter_calls_performance_table(today, today, recruiter_id, country, data_type)
            elif date_range == 'yesterday':
                queryset = get_recruiter_calls_performance_table(yesterday, yesterday, recruiter_id, country, data_type)
            elif date_range == 'last-24-hours':
                start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
                queryset = get_recruiter_calls_performance_table(start_date, today, recruiter_id, country, data_type)
            elif date_range == 'week':
                queryset = get_recruiter_calls_performance_table(week_start, week_end, recruiter_id, country, data_type)
            elif date_range == 'month':
                queryset = get_recruiter_calls_performance_table(month_start, month_end, recruiter_id, country, data_type)
            elif start_date is not None and end_date is not None:
                queryset = get_recruiter_calls_performance_table(start_date, end_date, recruiter_id, country, data_type)

            if queryset is not None:
                logger.info('Recruiter Calls performance CSV QuerySet Query formed: ' + str(queryset.query))
            serializer = RecruitersCallsPerformanceSummaryTableSerializer(queryset, many=True)
            array_length = len(serializer.data)
            outputs = []
            for i in range(array_length):
                rows = {
                    'recruiter_name': serializer.data[i]['recruiter_name'],
                    'jobs': serializer.data[i]['job_title'],
                    'country': serializer.data[i]['country'],
                    'attempted_calls': serializer.data[i]['attempted_calls'],
                    #'job_posted_date': serializer.data[i]['job_posted_date'],

                    #'attempted_calls': serializer.data[i]['attempted_calls'],
                    #'connected_calls': serializer.data[i]['connected_calls'],
                    #'missed_calls': serializer.data[i]['missed_calls'],

                    'Submission': serializer.data[i]['Submission'],
                    'StillSubmission': serializer.data[i]['StillSubmission'],
                    'SubmissionReject': serializer.data[i]['SubmissionReject'],
                    'SendOut': serializer.data[i]['SendOut'],
                    'SendoutReject': serializer.data[i]['SendoutReject'],
                    'ClientInterview': serializer.data[i]['ClientInterview'],
                    'RejectedByClient': serializer.data[i]['RejectedByClient'],
                    'Shortlisted': serializer.data[i]['Shortlisted'],
                    'Offered': serializer.data[i]['Offered'],
                    'Placed': serializer.data[i]['Placed'],
                    'CandidateAdded': serializer.data[i]['CandidateAdded'],
                    'CandidateReview': serializer.data[i]['CandidateReview'],
                    'RejectedByTeam': serializer.data[i]['RejectedByTeam'],
                    'ClientInterviewSecond': serializer.data[i]['ClientInterviewSecond'],
                    'ClientInterviewFirst': serializer.data[i]['ClientInterviewFirst'],
                    'OfferRejected': serializer.data[i]['OfferRejected'],
                    'SecondInterviewReject': serializer.data[i]['SecondInterviewReject'],
                    'HoldbyClient': serializer.data[i]['HoldbyClient'],
                    'InterviewSelect': serializer.data[i]['InterviewSelect'],
                    'OfferBackout': serializer.data[i]['OfferBackout'],
                    'HoldbyBDM': serializer.data[i]['HoldbyBDM'],
                    'InternalInterview': serializer.data[i]['InternalInterview'],
                    'InterviewBackout': serializer.data[i]['InterviewBackout'],
                    'FeedbackAwaited': serializer.data[i]['FeedbackAwaited'],
                    'InternalInterviewReject': serializer.data[i]['InternalInterviewReject'],
                    'InterviewReject': serializer.data[i]['InterviewReject'],

                    'InternalSubmission': serializer.data[i]['InternalSubmission'],
                    'InternalSubmissionReject': serializer.data[i]['InternalSubmissionReject'],
                    'InternalInterview1': serializer.data[i]['InternalInterview1'],
                    'InternalInterviewReject1': serializer.data[i]['InternalInterviewReject1'],
                    'InternalShortlisted': serializer.data[i]['InternalShortlisted'],
                    'InternalOffered': serializer.data[i]['InternalOffered'],
                    'InternalOfferedReject': serializer.data[i]['InternalOfferedReject'],
                    'InternalPlaced': serializer.data[i]['InternalPlaced'],
                    'SendOuttoClient': serializer.data[i]['SendOuttoClient']
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
            writer = csv.DictWriter(response, fieldnames=['recruiter_name', 'jobs', 'country', 'attempted_calls',
                                                          "Submission", "StillSubmission", "SubmissionReject", "SendOut",
                                                          "SendoutReject",
                                                          "ClientInterview", "RejectedByClient", "Shortlisted", "Offered",
                                                          "Placed", "CandidateAdded", "CandidateReview", "RejectedByTeam",
                                                          "ClientInterviewSecond",
                                                          "ClientInterviewFirst", "OfferRejected",
                                                          "SecondInterviewReject", "HoldbyClient",
                                                          "InterviewSelect", "OfferBackout", "HoldbyBDM",
                                                          "InternalInterview", "InterviewBackout", "FeedbackAwaited",
                                                          "FeedbackAwaited", "InternalInterviewReject",
                                                          "InterviewReject",
                                                          "InternalSubmission", "InternalSubmissionReject",
                                                          "InternalInterview1", "InternalInterviewReject1",
                                                          "InternalShortlisted",
                                                          "InternalOffered", "InternalOfferedReject", "InternalPlaced",
                                                          "SendOuttoClient"
                                                          ])

            writer.writeheader()
            writer.writerows(outputs)

        else:
            if date_range == 'today':
                queryset = get_recruiter_calls_performance_table(today, today, recruiter_id, country, data_type)
            elif date_range == 'yesterday':
                queryset = get_recruiter_calls_performance_table(yesterday, today, recruiter_id, country, data_type)
            elif date_range == 'last-24-hours':
                start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
                queryset = get_recruiter_calls_performance_table(start_date, today, recruiter_id, country, data_type)
            elif date_range == 'week':
                queryset = get_recruiter_calls_performance_table(week_start, week_end, recruiter_id, country, data_type)
            elif date_range == 'month':
                queryset = get_recruiter_calls_performance_table(month_start, month_end, recruiter_id, country,
                                                                 data_type)
            elif start_date is not None and end_date is not None:
                queryset = get_recruiter_calls_performance_table(start_date, end_date, recruiter_id, country, data_type)

            if queryset is not None:
                logger.info('Recruiter Calls performance CSV QuerySet Query formed: ' + str(queryset.query))
            serializer = RecruitersCallsPerformanceSummaryTableSerializer(queryset, many=True)
            array_length = len(serializer.data)
            outputs = []
            for i in range(array_length):
                rows = {
                    'recruiter_name': serializer.data[i]['recruiter_name'],
                    'jobs': serializer.data[i]['job_title'],
                    'country': serializer.data[i]['country'],
                    'attempted_calls': serializer.data[i]['attempted_calls'],

                    'Submission': serializer.data[i]['Submission'],
                    'StillSubmission': serializer.data[i]['StillSubmission'],
                    'SubmissionReject': serializer.data[i]['SubmissionReject'],
                    'SendOut': serializer.data[i]['SendOut'],
                    'SendoutReject': serializer.data[i]['SendoutReject'],
                    'ClientInterview': serializer.data[i]['ClientInterview'],
                    'RejectedByClient': serializer.data[i]['RejectedByClient'],
                    'Shortlisted': serializer.data[i]['Shortlisted'],
                    'Offered': serializer.data[i]['Offered'],
                    'Placed': serializer.data[i]['Placed'],
                    'CandidateAdded': serializer.data[i]['CandidateAdded'],
                    'CandidateReview': serializer.data[i]['CandidateReview'],
                    'RejectedByTeam': serializer.data[i]['RejectedByTeam'],
                    'ClientInterviewSecond': serializer.data[i]['ClientInterviewSecond'],
                    'ClientInterviewFirst': serializer.data[i]['ClientInterviewFirst'],
                    'OfferRejected': serializer.data[i]['OfferRejected'],
                    'SecondInterviewReject': serializer.data[i]['SecondInterviewReject'],
                    'HoldbyClient': serializer.data[i]['HoldbyClient'],
                    'InterviewSelect': serializer.data[i]['InterviewSelect'],
                    'OfferBackout': serializer.data[i]['OfferBackout'],
                    'HoldbyBDM': serializer.data[i]['HoldbyBDM'],
                    'InternalInterview': serializer.data[i]['InternalInterview'],
                    'InterviewBackout': serializer.data[i]['InterviewBackout'],
                    'FeedbackAwaited': serializer.data[i]['FeedbackAwaited'],
                    'InternalInterviewReject': serializer.data[i]['InternalInterviewReject'],
                    'InterviewReject': serializer.data[i]['InterviewReject'],
                    'InternalSubmission': serializer.data[i]['InternalSubmission'],
                    'InternalSubmissionReject': serializer.data[i]['InternalSubmissionReject'],
                    'InternalInterview1': serializer.data[i]['InternalInterview1'],
                    'InternalInterviewReject1': serializer.data[i]['InternalInterviewReject1'],
                    'InternalShortlisted': serializer.data[i]['InternalShortlisted'],
                    'InternalOffered': serializer.data[i]['InternalOffered'],
                    'InternalOfferedReject': serializer.data[i]['InternalOfferedReject'],
                    'InternalPlaced': serializer.data[i]['InternalPlaced'],
                    'SendOuttoClient': serializer.data[i]['SendOuttoClient']
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
            writer = csv.DictWriter(response, fieldnames=['recruiter_name', 'jobs',
                                                          'country', 'attempted_calls',
                                                          "Submission", "StillSubmission", "SubmissionReject",
                                                          "SendOut",
                                                          "SendoutReject",
                                                          "ClientInterview", "RejectedByClient", "Shortlisted",
                                                          "Offered",
                                                          "Placed", "CandidateAdded", "CandidateReview",
                                                          "RejectedByTeam",
                                                          "ClientInterviewSecond",
                                                          "ClientInterviewFirst", "OfferRejected",
                                                          "SecondInterviewReject", "HoldbyClient",
                                                          "InterviewSelect", "OfferBackout", "HoldbyBDM",
                                                          "InternalInterview", "InterviewBackout", "FeedbackAwaited",
                                                          "FeedbackAwaited", "InternalInterviewReject",
                                                          "InterviewReject",
                                                          "InternalSubmission", "InternalSubmissionReject",
                                                          "InternalInterview1", "InternalInterviewReject1",
                                                          "InternalShortlisted",
                                                          "InternalOffered", "InternalOfferedReject", "InternalPlaced",
                                                          "SendOuttoClient"
                                                          ])

            writer.writeheader()
            writer.writerows(outputs)

        return response


####################### Recruiter Submission Report #############################

class RecruiterPerformanceSummaryTable(generics.ListAPIView):
    serializer_class = RecruiterPerformanceSummarySerializer
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        logger.info('Recruter Performance Report Request' + str(request))
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        stage_name = request.query_params.get('stage_name')

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        print(start_date)
        print(end_date)

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroupID = None
        userGroup = None
        queryset = None

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
            # logger.info("groups: " + str(groups['groups']))
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
            userGroupID = userGroupDict['id']

        logger.info('userGroup Data: %s' % userGroup)
        logger.info('userGroupID Data: %s' % userGroupID)
        logger.info('stage_name: %s' % stage_name)
        uid = str(request.user.id).replace("-", "")

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

            # print(str(queryset.query))
        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        if queryset is not None:
            logger.info('Recruiter Perf Table QuerySet Query formed: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = RecruitersPerformanceSummarySerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        """array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):  # Use `xrange` for python 2.
            cursor = connection.cursor()
            recruiter_id = serializer.data[i]['recruiter_name']
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [recruiter_id])
            recruiter_name = cursor.fetchone()
            uuids.add(recruiter_id)

            rows = {
                'recruiter_id': serializer.data[i]['recruiter_name'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'company_name': serializer.data[i]['company_name'],
                'total_experience': serializer.data[i]['total_experience'],
                'rank': serializer.data[i]['rank'],
                'job_title': serializer.data[i]['job_title'],
                'skills_1': serializer.data[i]['skills_1'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'visa': serializer.data[i]['visa'],
                'job_type': serializer.data[i]['job_type'],
                'client_name': serializer.data[i]['client_name'],
                'location': serializer.data[i]['location'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'status': serializer.data[i]['status'],
                'recruiter_name': recruiter_name[0] + ' ' + recruiter_name[1],
                'submission_date': serializer.data[i]['submission_date'],
                'job_date': serializer.data[i]['job_date']
            }

            outputs.append(rows)"""

        return Response(serializer.data)


class RecruiterPerformanceSummaryGraph(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        print(today)
        yesterday = utils.yesterday_datetime()
        print(yesterday)

        week_start, week_end = utils.week_date_range()
        print(week_start)
        print(week_end)

        month_start, month_end = utils.month_date_range()
        print(month_start)
        print(month_end)

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")

        queryset = None
        print(GLOBAL_ROLE.get('ADMIN'))

        # if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):

        if date_range == 'today':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date > %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [today])
        elif date_range == 'yesterday':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date > %s AND cjs.submission_date < %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [yesterday, today])
        elif date_range == 'week':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [week_start, week_end])
        elif date_range == 'month':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [month_start, month_end])
        elif start_date is not None and end_date is not None:
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name != 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [start_date, end_date])

        """        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, start_date, end_date])
"""
        if queryset is not None:
            logger.info('Recruiter Perf Graph QuerySet Query formed: ' + str(queryset.query))
        serializer = RecruiterPerformanceSummaryGraphSerializer(queryset, many=True)
        # print(serializer.data)
        return Response(serializer.data)


class RecruiterPerformanceSummaryCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        filterRecruiter = ""
        filterCountry = ""
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        recruiter_id = request.query_params.get('recruiter_id')
        country = request.query_params.get('country')

        print(start_date)
        print(end_date)
        if end_date is not None:
            start_date, end_date = get_startdate_and_enddate(start_date, end_date)

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        if recruiter_id is not None:
            recruiter_id = str(recruiter_id).replace("-", "")
            filterRecruiter = " cjs.created_by_id = '" + recruiter_id + "' AND "
        if country is not None and country != 'ALL':
            filterCountry = " cl.country = '" + country + "' AND "
        filterQuery = filterRecruiter + filterCountry
        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                if recruiter_id is not None:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + " s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                        [month_start, month_end])
                else:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                        [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + " s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                if recruiter_id is not None:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                        [month_start, month_end])
                else:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                        [month_start, month_end])
            elif start_date is not None and end_date is not None:
                if recruiter_id is not None:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND ca.created_by_id = %s",
                        [start_date, end_date, recruiter_id])
                else:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                        [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

            # print(str(queryset.query))
        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE "+ filterQuery + "  s.stage_name != 'Candidate Added' AND j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        if queryset is not None:
            logger.info('Recruiter CSV QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = RecruitersPerformanceSummarySerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):  # Use `xrange` for python 2.
            cursor = connection.cursor()
            recruiter_id = serializer.data[i]['recruiter_name']
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [recruiter_id])
            recruiter_name = cursor.fetchone()
            created_by_id = serializer.data[i]['created_by_id']

            if created_by_id is not None:
                created_by_id = str(created_by_id).replace("-", "")

            cursor = connection.cursor()
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [created_by_id])
            created_by_name = cursor.fetchone()
            # logger.info("user_serializer: " + str(created_by_name))
            firstName = ""
            lastName = ""
            if created_by_name is not None:
                firstName = created_by_name[0]
                lastName = created_by_name[1]

            uuids.add(recruiter_id)

            rows = {
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'company_name': serializer.data[i]['company_name'],
                'total_experience': serializer.data[i]['total_experience'],
                'rank': serializer.data[i]['rank'],
                'job_title': serializer.data[i]['job_title'],
                'skills_1': serializer.data[i]['skills_1'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'min_salary': serializer.data[i]['max_salary'],
                'client_name': serializer.data[i]['client_name'],
                'location': serializer.data[i]['location'],
                'visa': serializer.data[i]['visa'],
                'job_type': serializer.data[i]['job_type'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'status': serializer.data[i]['status'],
                'recruiter_name': recruiter_name[0] + ' ' + recruiter_name[1],
                'client_country': serializer.data[i]['country'],
                'created_by': firstName + ' ' + lastName,
                'submission_date': serializer.data[i]['submission_date'],
                'job_date': serializer.data[i]['job_date'],
                'created_at': serializer.data[i]['created_at']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="recruiter_performance_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=["candidate_name", "primary_email", "primary_phone_number",
                                                      "company_name", "total_experience", "rank", "job_title",
                                                      "skills_1",
                                                      "min_rate", "max_rate", "min_salary", "max_salary", "client_name",
                                                      "location", "visa", "job_type", "bdm_name",
                                                      "status", "recruiter_name", "client_country", "created_by",
                                                      "submission_date", "job_date",
                                                      "created_at"
                                                      ])

        writer.writeheader()

        writer.writerows(outputs)

        return response


####################### Candidate Report #############################


class CandidateTable(generics.ListAPIView):
    serializer_class = RecruiterPerformanceSummarySerializer
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        logger.info('Recruter Performance Report Request' + str(request))
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        stage_name = request.query_params.get('stage_name')

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        print(start_date)
        print(end_date)

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroupID = None
        userGroup = None
        queryset = None

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
            # logger.info("groups: " + str(groups['groups']))
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
            userGroupID = userGroupDict['id']

        logger.info('userGroup Data: %s' % userGroup)
        logger.info('userGroupID Data: %s' % userGroupID)
        logger.info('stage_name: %s' % stage_name)
        uid = str(request.user.id).replace("-", "")

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

            # print(str(queryset.query))
        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " j.end_client_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, CONCAT(u1.first_name,' ',u1.last_name) as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, cl.country, cjs.notes as remarks FROM `osms_job_description` as j, "
                    "`users_user` as u, `users_user` as u1, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND ca.created_by_id = u1.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        if queryset is not None:
            logger.info('Recruiter Perf Table QuerySet Query formed: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = RecruitersPerformanceSummarySerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        """array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):  # Use `xrange` for python 2.
            cursor = connection.cursor()
            recruiter_id = serializer.data[i]['recruiter_name']
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [recruiter_id])
            recruiter_name = cursor.fetchone()
            uuids.add(recruiter_id)

            rows = {
                'recruiter_id': serializer.data[i]['recruiter_name'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'company_name': serializer.data[i]['company_name'],
                'total_experience': serializer.data[i]['total_experience'],
                'rank': serializer.data[i]['rank'],
                'job_title': serializer.data[i]['job_title'],
                'skills_1': serializer.data[i]['skills_1'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'visa': serializer.data[i]['visa'],
                'job_type': serializer.data[i]['job_type'],
                'client_name': serializer.data[i]['client_name'],
                'location': serializer.data[i]['location'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'status': serializer.data[i]['status'],
                'recruiter_name': recruiter_name[0] + ' ' + recruiter_name[1],
                'submission_date': serializer.data[i]['submission_date'],
                'job_date': serializer.data[i]['job_date']
            }

            outputs.append(rows)"""

        return Response(serializer.data)


class CandidateGraph(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        print(today)
        yesterday = utils.yesterday_datetime()
        print(yesterday)

        week_start, week_end = utils.week_date_range()
        print(week_start)
        print(week_end)

        month_start, month_end = utils.month_date_range()
        print(month_start)
        print(month_end)

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")

        queryset = None
        print(GLOBAL_ROLE.get('ADMIN'))

        # if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):

        if date_range == 'today':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date > %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name = 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [today])
        elif date_range == 'yesterday':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date > %s AND cjs.submission_date < %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name = 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [yesterday, today])
        elif date_range == 'week':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name = 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [week_start, week_end])
        elif date_range == 'month':
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name = 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [month_start, month_end])
        elif start_date is not None and end_date is not None:
            queryset = Candidates.objects.raw(
                "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name , c.created_by_id, c.country FROM `osms_candidates` as c, `candidates_stages` as s,`candidates_jobs_stages` as cjs , `users_user` as u WHERE cjs.stage_id = s.id AND c.created_by_id = u.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s "
                " AND cjs.candidate_name_id = c.id AND s.stage_name = 'Candidate Added' GROUP BY cjs.stage_id, u.first_name",
                [start_date, end_date])

        """        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u WHERE c.stage_id = s.id AND c.created_by_id = u.id AND c.created_by_id = %s AND c.created_at >= %s AND c.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, start_date, end_date])
"""
        if queryset is not None:
            logger.info('Recruiter Perf Graph QuerySet Query formed: ' + str(queryset.query))
        serializer = RecruiterPerformanceSummaryGraphSerializer(queryset, many=True)
        # print(serializer.data)
        return Response(serializer.data)


class CandidateCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):

        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        recruiter_id = request.query_params.get('recruiter_id')

        print(start_date)
        print(end_date)
        if end_date is not None:
            start_date, end_date = get_startdate_and_enddate(start_date, end_date)

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        if recruiter_id is not None:
            recruiter_id = str(recruiter_id).replace("-", "")

        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                if recruiter_id is not None:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND ca.created_by_id = %s",
                        [month_start, month_end, recruiter_id])
                else:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                        [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                if recruiter_id is not None:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND ca.created_by_id = %s",
                        [month_start, month_end, recruiter_id])
                else:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                        [month_start, month_end])
            elif start_date is not None and end_date is not None:
                if recruiter_id is not None:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND ca.created_by_id = %s",
                        [start_date, end_date, recruiter_id])
                else:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                        " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                        "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                        [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

            # print(str(queryset.query))
        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date > %s AND cjs.submission_date < %s",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate,ca.max_rate, ca.min_salary , ca.max_salary,"
                    " cl.company_name AS client_name, j.location, CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id, cjs.created_by_id as recruiter_name, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, ca.created_at, cl.country, ca.resume FROM `osms_job_description` as j, "
                    "`users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND s.stage_name = 'Candidate Added' AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s",
                    [start_date, end_date])

        if queryset is not None:
            logger.info('Recruiter CSV QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = CandidateReportSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):  # Use `xrange` for python 2.
            cursor = connection.cursor()
            recruiter_id = serializer.data[i]['recruiter_name']
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [recruiter_id])
            recruiter_name = cursor.fetchone()
            created_by_id = serializer.data[i]['created_by_id']

            if created_by_id is not None:
                created_by_id = str(created_by_id).replace("-", "")

            cursor = connection.cursor()
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [created_by_id])
            created_by_name = cursor.fetchone()
            # logger.info("user_serializer: " + str(created_by_name))
            firstName = ""
            lastName = ""
            if created_by_name is not None:
                firstName = created_by_name[0]
                lastName = created_by_name[1]

            uuids.add(recruiter_id)

            resume = serializer.data[i]['resume']
            is_resume_available = False
            if resume is not None:
                is_resume_available = True

            rows = {
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'company_name': serializer.data[i]['company_name'],
                'total_experience': serializer.data[i]['total_experience'],
                'rank': serializer.data[i]['rank'],
                'job_title': serializer.data[i]['job_title'],
                'skills_1': serializer.data[i]['skills_1'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'min_salary': serializer.data[i]['max_salary'],
                'client_name': serializer.data[i]['client_name'],
                'location': serializer.data[i]['location'],
                'visa': serializer.data[i]['visa'],
                'job_type': serializer.data[i]['job_type'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'status': serializer.data[i]['status'],
                'recruiter_name': recruiter_name[0] + ' ' + recruiter_name[1],
                'client_country': serializer.data[i]['country'],
                'is_resume_available': is_resume_available,
                'created_by': firstName + ' ' + lastName,
                'submission_date': serializer.data[i]['submission_date'],
                'job_date': serializer.data[i]['job_date'],
                'created_at': serializer.data[i]['created_at']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="recruiter_performance_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=["candidate_name", "primary_email", "primary_phone_number",
                                                      "company_name", "total_experience", "rank", "job_title",
                                                      "skills_1",
                                                      "min_rate", "max_rate", "min_salary", "max_salary", "client_name",
                                                      "location", "visa", "job_type", "bdm_name",
                                                      "status", "recruiter_name", "client_country",
                                                      "is_resume_available", "created_by", "submission_date",
                                                      "job_date",
                                                      "created_at"
                                                      ])

        writer.writeheader()

        writer.writerows(outputs)

        return response


####################### BDM Performance Summary ######################


class BdmPerformanceSummaryTable(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        uid = str(request.user.id).replace("-", "")

        # if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
        if date_range == 'today':
            queryset = Candidates.objects.raw(
                "SELECT ca.id, j.created_by_id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, j.end_client_name AS client_name, j.location, "
                "CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id as recruiter_name, cjs.submission_date AS submission_date, cjs.submitted_by_id AS submitted_by_id, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,(SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, cl.country, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s ",
                [today])
        elif date_range == 'yesterday':
            queryset = Candidates.objects.raw(
                "SELECT ca.id, j.created_by_id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, j.end_client_name AS client_name, j.location, "
                "CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id as recruiter_name, cjs.submission_date AS submission_date, cjs.submitted_by_id AS submitted_by_id, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, cl.country, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s AND cjs.submission_date < %s ",
                [yesterday, yesterday])
        elif date_range == 'last-24-hours':
            start_date = datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0)
            queryset = Candidates.objects.raw(
                "SELECT ca.id, j.created_by_id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, j.end_client_name AS client_name, j.location, "
                "CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id as recruiter_name, cjs.submission_date AS submission_date, cjs.submitted_by_id AS submitted_by_id, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, cl.country, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s AND cjs.submission_date < %s ",
                [start_date, today])
        elif date_range == 'week':
            queryset = Candidates.objects.raw(
                "SELECT ca.id, j.created_by_id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, j.end_client_name AS client_name, j.location, "
                "CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id as recruiter_name, cjs.submission_date AS submission_date, cjs.submitted_by_id AS submitted_by_id,  j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, cl.country, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                [week_start, week_end])
        elif date_range == 'month':
            queryset = Candidates.objects.raw(
                "SELECT ca.id, j.created_by_id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, j.end_client_name AS client_name, j.location, "
                "CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id as recruiter_name, cjs.submission_date AS submission_date, cjs.submitted_by_id AS submitted_by_id, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, cl.country, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                [month_start, month_end])
        elif start_date is not None and end_date is not None:
            queryset = Candidates.objects.raw(
                "SELECT ca.id, j.created_by_id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, ca.company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, j.end_client_name AS client_name, j.location, "
                "CONCAT(u.first_name,' ',u.last_name) as bdm_name, s.stage_name as status, ca.created_by_id as recruiter_name, cjs.submission_date AS submission_date, cjs.submitted_by_id AS submitted_by_id,  j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type, (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, cl.country, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                [start_date, end_date])

        if queryset is not None:
            logger.info('BDM Perf Table QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = BdmPerformanceSummarySerializerSep(queryset, many=True)
        array_length = len(serializer.data)
        outputs = []
        uuids = set()
        for i in range(array_length):  # Use `xrange` for python 2.
            cursor = connection.cursor()
            recruiter_id = serializer.data[i]['recruiter_name']
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [recruiter_id])
            recruiter_name = cursor.fetchone()
            uuids.add(recruiter_id)
            
            
            submitted_by_id = serializer.data[i]['submitted_by_id']
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [submitted_by_id])
            submitted_by = cursor.fetchone() 

            rows = {
                'bdm_id': serializer.data[i]['created_by_id'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'company_name': serializer.data[i]['company_name'],
                'total_experience': serializer.data[i]['total_experience'],
                'rank': serializer.data[i]['rank'],
                'job_title': serializer.data[i]['job_title'],
                'skills_1': serializer.data[i]['skills_1'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'visa': serializer.data[i]['visa'],
                'job_type': serializer.data[i]['job_type'],
                'client_name': serializer.data[i]['client_name'],
                'location': serializer.data[i]['location'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'status': serializer.data[i]['status'],
                'recruiter_name': recruiter_name[0] + ' ' + recruiter_name[1],
                'client_country': serializer.data[i]['country'],
                'submission_date': serializer.data[i]['submission_date'],
                'submitted_by' : submitted_by[0] + ' ' + submitted_by[1] if submitted_by else "",
                'job_date': serializer.data[i]['job_date'],
                'remarks': serializer.data[i]['remarks'],
                'first_assingment_date': serializer.data[i]['first_assingment_date']
            }

            outputs.append(rows)

        uuids = list(uuids)
        if len(uuids) > 0:
            userqr = User.objects.filter(id__in=uuids)
            print(str(userqr.query))
            userSer = UserObjectSerializer(userqr)

        return Response(outputs)


class BdmPerformanceSummaryGraph(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        print("==============================today==========" + str(today))
        yesterday = utils.yesterday_datetime()
        print("==============================today==========" + str(yesterday))

        week_start, week_end = utils.week_date_range()
        print(week_start)
        print(week_end)

        month_start, month_end = utils.month_date_range()
        print(month_start)
        print(month_end)

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        queryset = None
        print(GLOBAL_ROLE.get('ADMIN'))
        if userGroup is not None and (userGroup == GLOBAL_ROLE.get('ADMIN') or userGroup == GLOBAL_ROLE.get(
                'BDMMANAGER') or userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER')):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, COUNT(s.stage_name = 'Submission') as submission , u.first_name as first_name, j.created_by_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, "
                    "`osms_job_description` as j , `candidates_jobs_stages` as cjs WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND cjs.job_description_id = j.id AND j.created_by_id = u.id AND cjs.candidate_name_id = c.id AND cjs.submission_date > %s GROUP BY u.first_name , cjs.stage_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, COUNT(s.stage_name = 'Submission') as submission , u.first_name as first_name, j.created_by_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, "
                    "`osms_job_description` as j , `candidates_jobs_stages` as cjs WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND cjs.job_description_id = j.id AND j.created_by_id = u.id AND cjs.candidate_name_id = c.id AND cjs.submission_date > %s AND cjs.submission_date < %s GROUP BY u.first_name , cjs.stage_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, COUNT(s.stage_name = 'Submission') as submission , u.first_name as first_name, j.created_by_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, "
                    "`osms_job_description` as j , `candidates_jobs_stages` as cjs WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND cjs.job_description_id = j.id AND j.created_by_id = u.id AND cjs.candidate_name_id = c.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s  GROUP BY u.first_name , cjs.stage_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, COUNT(s.stage_name = 'Submission') as submission , u.first_name as first_name, j.created_by_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, "
                    "`osms_job_description` as j , `candidates_jobs_stages` as cjs WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND cjs.job_description_id = j.id AND j.created_by_id = u.id AND cjs.candidate_name_id = c.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s  GROUP BY u.first_name , cjs.stage_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, COUNT(s.stage_name = 'Submission') as submission , u.first_name as first_name, j.created_by_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, "
                    "`osms_job_description` as j , `candidates_jobs_stages` as cjs WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND cjs.job_description_id = j.id AND j.created_by_id = u.id AND cjs.candidate_name_id = c.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s GROUP BY u.first_name , cjs.stage_id",
                    [start_date, end_date])

        """        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, `osms_job_description` as j WHERE c.stage_id = s.id AND c.job_description_id = j.id and j.created_by_id = u.id AND j.created_by_id = %s AND j.created_at = %s  GROUP BY c.stage_id, u.first_name", [uid, today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, `osms_job_description` as j WHERE c.stage_id = s.id AND c.job_description_id = j.id and j.created_by_id = u.id AND j.created_by_id = %s AND j.created_at = %s GROUP BY c.stage_id, u.first_name", [uid, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, `osms_job_description` as j WHERE c.stage_id = s.id AND c.job_description_id = j.id and j.created_by_id = u.id AND j.created_by_id = %s AND j.created_at >= %s  AND j.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, `osms_job_description` as j WHERE c.stage_id = s.id AND c.job_description_id = j.id and j.created_by_id = u.id AND j.created_by_id = %s AND j.created_at >= %s  AND j.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw("SELECT c.id, COUNT(*) as total_count, s.stage_name as stage_name, u.first_name as first_name FROM `osms_candidates` as c, `candidates_stages` as s, `users_user` as u, `osms_job_description` as j WHERE c.stage_id = s.id AND c.job_description_id = j.id and j.created_by_id = u.id AND j.created_by_id = %s AND j.created_at >= %s  AND j.created_at <= %s GROUP BY c.stage_id, u.first_name", [uid, start_date, end_date])
"""
        if queryset is not None:
            logger.info('BDM Perf Graph QuerySet Query formed: ' + str(queryset.query))
        serializer = BdmPerformanceSummaryGraphSerializer(queryset, many=True)
        # print(serializer.data)
        return Response(serializer.data)


class BdmPerformanceSummaryCSV(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        bdm_id = request.query_params.get('bdm_id')
        country = request.query_params.get('country')

        if start_date is not None and end_date is not None:
            start_date, end_date = get_startdate_and_enddate(start_date, end_date)

        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)
        filterRecruiter = ""
        filterCountry = ""
        if bdm_id is not None:
            bdm_id = str(bdm_id).replace("-", "")
            filterRecruiter = " j.created_by_id = '" + bdm_id + "' AND "
        if country is not None and country != 'ALL':
            filterCountry = " cl.country = '" + country + "' AND "
        filterQuery = filterRecruiter + filterCountry
        print(uid)


        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at ,(SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s ",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s AND cjs.submission_date < %s ",
                    [yesterday, yesterday])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [week_start, week_end])
            elif date_range == 'month':
                if bdm_id is not None:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                        "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                        "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                        [month_start, month_end])
                else:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                        "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                        "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                        [month_start, month_end])
            elif start_date is not None and end_date is not None:
                if bdm_id is not None:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                        "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, j.status,s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                        "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND j.created_by_id = %s ",
                        [start_date, end_date, bdm_id])
                else:
                    queryset = Candidates.objects.raw(
                        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                        "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                        "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                        [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, cjs.submitted_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at ,(SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks   FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s ",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, cjs.submitted_by_id as recruiter_name, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks   FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s AND cjs.submission_date < %s ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, cjs.submitted_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, cjs.submitted_by_id as recruiter_name,  cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [month_start, month_end])

            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status,cjs.submitted_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [start_date, end_date])
        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at ,(SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s ",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s AND cjs.submission_date < %s ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [start_date, end_date])

            # print(str(queryset.query))
        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at ,(SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s ",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date > %s AND cjs.submission_date < %s ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number, j.end_client_name as company_name, ca.total_experience, ca.rank, j.job_title as job_title, ca.skills_1, ca.min_rate , ca.max_rate, ca.min_salary , ca.max_salary, cl.company_name AS client_name, j.location, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.status as job_status, s.stage_name as status, ca.created_by_id as recruiter_name, cl.country, cjs.submission_date AS submission_date, j.created_at AS job_date ,ca.visa as visa ,j.employment_type as job_type,ca.created_at , (SELECT ja.created_at as assingment_date FROM job_description_assingment ja WHERE ja.job_id_id = j.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT cas.activity_status FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as activity_status, (SELECT cas.created_at FROM `candidates_activity_status` as cas WHERE cas.candidate_name_id = ca.id ORDER BY `created_at` DESC LIMIT 1) as last_updated_date, cjs.notes as remarks  FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca,"
                    "`candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE " + filterQuery + " j.created_by_id = u.id AND s.stage_name != 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND cjs.submission_date >= %s AND cjs.submission_date <= %s ",
                    [start_date, end_date])

        if queryset is not None:
            logger.info('BDM Perf csv QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = BdmPerformanceSummaryCSVSerializer(queryset, many=True)
        array_length = len(serializer.data)
        outputs = []
        uuids = set()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="bdm_performance_summary.csv"'

        writer = csv.DictWriter(response, fieldnames=["candidate_name", "primary_email", "primary_phone_number",
                                                      "company_name", "total_experience", "rank", "job_title",
                                                      "skills_1",
                                                      "min_rate", "max_rate", "min_salary", "max_salary", "client_name",
                                                      "location", "visa", "job_type", "bdm_name","job_status",
                                                      "status", "recruiter_name", "client_country", "submission_date",
                                                      "job_date",
                                                      "first_assingment_date", "created_at", "activity_status",
                                                      "last_updated_date", "created_by", "remarks"
                                                      ])

        writer.writeheader()

        for i in range(array_length):  # Use `xrange` for python 2.
            cursor = connection.cursor()
            recruiter_id = serializer.data[i]['recruiter_name']
            cursor.execute("SELECT first_name, last_name FROM users_user WHERE id=%s", [recruiter_id])
            recruiter_name = cursor.fetchone()
            uuids.add(recruiter_id)
            
            #clean remarks tags
            remarks = serializer.data[i]['remarks']
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(remarks, 'html.parser')
            cleaned_remarks = soup.get_text()
            if not cleaned_remarks:
                cleaned_remarks = ""
                
            rows = {
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'company_name': serializer.data[i]['company_name'],
                'total_experience': serializer.data[i]['total_experience'],
                'rank': serializer.data[i]['rank'],
                'job_title': serializer.data[i]['job_title'],
                'skills_1': serializer.data[i]['skills_1'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'client_name': serializer.data[i]['client_name'],
                'location': serializer.data[i]['location'],
                'visa': serializer.data[i]['visa'],
                'job_type': serializer.data[i]['job_type'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'job_status': serializer.data[i]['job_status'],
                'status': serializer.data[i]['status'],
                'recruiter_name': recruiter_name[0] + ' ' + recruiter_name[1],
                'client_country': serializer.data[i]['country'],
                'submission_date': serializer.data[i]['submission_date'],
                'job_date': serializer.data[i]['job_date'],
                'first_assingment_date': serializer.data[i]['first_assingment_date'],
                'created_at': serializer.data[i]['created_at'],
                'activity_status': serializer.data[i]['activity_status'],
                'last_updated_date': serializer.data[i]['last_updated_date'],
                'remarks': cleaned_remarks
            }

            outputs.append(rows)

        writer.writerows(outputs)

        return response


####################### Job Performance Summary ######################


class RecruiterCallsPerformanceSummaryByJobAndRecruiter(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        recruiter_id = request.query_params.get('rid')
        country = request.query_params.get('country')

        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if date_range == 'today':
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(today, today, recruiter_id, country)
        elif date_range == 'yesterday':
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(yesterday, yesterday, recruiter_id, country)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(start_date, today, recruiter_id, country)
        elif date_range == 'week':
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(week_start, week_end, recruiter_id, country)
        elif date_range == 'month':
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(month_start, month_end, recruiter_id, country)
        elif start_date is not None and end_date is not None:
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(start_date, end_date, recruiter_id, country)

        if queryset is not None:
            logger.info('Job Summary QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = RecruiterCallsPerformanceSummaryByJobAndRecruiterSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        # print(serializer.data)
        return Response(serializer.data)


class RecruiterCallsPerformanceSummaryByJobAndRecruiterCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        recruiter_id = request.query_params.get('rid')
        country = request.query_params.get('country')

        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        #bdm_id = str(bdm_id).replace("-", "")
        #print(bdm_id)

        if date_range == 'today':
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(today, today, recruiter_id, country)
        elif date_range == 'yesterday':
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(yesterday, today, recruiter_id, country)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(start_date, today, recruiter_id, country)
        elif date_range == 'week':
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(week_start, week_end, recruiter_id, country)
        elif date_range == 'month':
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(month_start, month_end, recruiter_id, country)
        elif start_date is not None and end_date is not None:
            queryset = recruiter_calls_performance_summary_by_job_and_recruiter(start_date, end_date, recruiter_id, country)

        if queryset is not None:
            logger.info('Job Summary CSV Query formed: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = RecruiterCallsPerformanceSummaryByJobAndRecruiterSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        for i in range(array_length):
            rows = {
                #'JobID': serializer.data[i]['Job_ID'],
                'ClientName': serializer.data[i]['client_name'],
                'JobTitle': serializer.data[i]['job_title'],
                'BdmName': serializer.data[i]['bdm_name'],
                'JobDate': serializer.data[i]['job_date'],
                # 'client_country': serializer.data[i]['country'],
                'NumberOfOpening': serializer.data[i]['number_of_opening'],
                #'JobType': serializer.data[i]['employment_type'],
                'AssignmentType': serializer.data[i]['assignment_type'],
                'Submission': serializer.data[i]['Submission'],
                # 'StatusStillSubmission': serializer.data[i]['StillSubmission'],
                'SubmissionReject': serializer.data[i]['SubmissionReject'],
                'InternalInterview': serializer.data[i]['InternalInterview'],
                'InternalInterviewReject': serializer.data[i]['InternalInterviewReject'],
                'CandidateReview': serializer.data[i]['CandidateReview'],
                'SendOut': serializer.data[i]['SendOut'],
                'SendoutReject': serializer.data[i]['SendoutReject'],
                'ClientInterview': serializer.data[i]['ClientInterview'],
                'HoldbyClient': serializer.data[i]['HoldbyClient'],
                'InterviewBackout': serializer.data[i]['InterviewBackout'],
                'InterviewReject': serializer.data[i]['InterviewReject'],
                'FeedbackAwaited': serializer.data[i]['FeedbackAwaited'],
                'Shortlisted': serializer.data[i]['Shortlisted'],
                'Offered': serializer.data[i]['Offered'],
                'OfferRejected': serializer.data[i]['OfferRejected'],
                'OfferBackout': serializer.data[i]['OfferBackout'],
                'Placed': serializer.data[i]['Placed'],

                'RejectedByClient': serializer.data[i]['RejectedByClient'],
                # 'CandidateAdded': serializer.data[i]['CandidateAdded'],
                'RejectedByTeam': serializer.data[i]['RejectedByTeam'],
                # 'ClientInterviewSecond': serializer.data[i]['ClientInterviewSecond'],
                # 'ClientInterviewFirst': serializer.data[i]['ClientInterviewFirst'],
                # 'SecondInterviewReject': serializer.data[i]['SecondInterviewReject'],
                'InterviewSelect': serializer.data[i]['InterviewSelect'],
                'HoldbyBDM': serializer.data[i]['HoldbyBDM'],
                # 'remarks': serializer.data[i]['remarks'],
                # 'assigned_recruiters': assigned_recruiters

                'InternalSubmission': serializer.data[i]['InternalSubmission'],
                'InternalSubmissionReject': serializer.data[i]['InternalSubmissionReject'],
                'InternalInterview1': serializer.data[i]['InternalInterview1'],
                'InternalInterviewReject1': serializer.data[i]['InternalInterviewReject1'],
                'InternalShortlisted': serializer.data[i]['InternalShortlisted'],
                'InternalOffered': serializer.data[i]['InternalOffered'],
                'InternalOfferedReject': serializer.data[i]['InternalOfferedReject'],
                'InternalPlaced': serializer.data[i]['InternalPlaced'],
                'SendOuttoClient': serializer.data[i]['SendOuttoClient']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=['ClientName',
                                                      'JobTitle', 'BdmName', 'JobDate',
                                                      'NumberOfOpening','AssignmentType',
                                                      "Submission", "SubmissionReject", "InternalInterview", "InternalInterviewReject", "CandidateReview","SendOut","SendoutReject","ClientInterview", "HoldbyClient", "InterviewBackout", "InterviewReject",  "FeedbackAwaited","Shortlisted", "Offered", "OfferRejected", "OfferBackout", "Placed", "RejectedByClient", "RejectedByTeam", "InterviewSelect", "HoldbyBDM",
                                                      "InternalSubmission", "InternalSubmissionReject",
                                                      "InternalInterview1", "InternalInterviewReject1",
                                                      "InternalShortlisted",
                                                      "InternalOffered", "InternalOfferedReject", "InternalPlaced",
                                                      "SendOuttoClient"
                ])
        # 'status',

        writer.writeheader()

        writer.writerows(outputs)

        return response


class JobSummaryTable(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):

        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        bdm_id = request.query_params.get('bdm_id')
        country = request.query_params.get('country')
        status = request.query_params.get('status')
        employment_type=request.query_params.get('employment_type')
        
            
        if status:
           status_values = status.split(',')
        else:
           status_values = []

        if employment_type:
            employment_type_values = employment_type.split(',')
        else:
            employment_type_values = []

        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if date_range == 'today':
            queryset = get_jobs_summary_csv_by_date_range_and_id(today, today, bdm_id, country, status_values, employment_type_values)
        elif date_range == 'yesterday':
            queryset = get_jobs_summary_csv_by_date_range_and_id(yesterday, yesterday, bdm_id, country, status_values, employment_type_values)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_jobs_summary_csv_by_date_range_and_id(start_date, today, bdm_id, country, status_values, employment_type_values)
        elif date_range == 'week':
            queryset = get_jobs_summary_csv_by_date_range_and_id(week_start, week_end, bdm_id, country, status_values, employment_type_values)
        elif date_range == 'month':
            queryset = get_jobs_summary_csv_by_date_range_and_id(month_start, month_end, bdm_id, country, status_values, employment_type_values)
        elif start_date is not None and end_date is not None:
            queryset = get_jobs_summary_csv_by_date_range_and_id(start_date, end_date, bdm_id, country, status_values, employment_type_values)

        if queryset is not None:
            logger.info('Job Summary QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = BdmJobSummaryTableSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):
            recruiter_name = serializer.data[i]['recruiter_name']
            # assigned_date = serializer.data[i]['assigned_date']
            # logger.info(str(serializer.data[i]['client_name']) + ' : ' + str(serializer.data[i]['bdm_name']))

            rows = {
                'id': serializer.data[i]['id'],
                'job_title': serializer.data[i]['job_title'],
                'job_id': serializer.data[i]['Job_ID'],
                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'bdm_id': serializer.data[i]['bdm_id'],
                'job_type': serializer.data[i]['employment_type'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'job_date': serializer.data[i]['job_date'],
                'client_country': serializer.data[i]['country'],
                'number_of_opening': serializer.data[i]['number_of_opening'],
                'status': serializer.data[i]['status'],

                'Submission': serializer.data[i]['Submission'],
                'StillSubmission': serializer.data[i]['StillSubmission'],
                'SubmissionReject': serializer.data[i]['SubmissionReject'],
                'SendOut': serializer.data[i]['SendOut'],
                'SendoutReject': serializer.data[i]['SendoutReject'],
                'ClientInterview': serializer.data[i]['ClientInterview'],
                'RejectedByClient': serializer.data[i]['RejectedByClient'],
                'Shortlisted': serializer.data[i]['Shortlisted'],
                'Offered': serializer.data[i]['Offered'],
                'Placed': serializer.data[i]['Placed'],

                'CandidateAdded': serializer.data[i]['CandidateAdded'],
                'CandidateReview': serializer.data[i]['CandidateReview'],
                'RejectedByTeam': serializer.data[i]['RejectedByTeam'],
                'ClientInterviewSecond': serializer.data[i]['ClientInterviewSecond'],
                'ClientInterviewFirst': serializer.data[i]['ClientInterviewFirst'],
                'OfferRejected': serializer.data[i]['OfferRejected'],
                'SecondInterviewReject': serializer.data[i]['SecondInterviewReject'],
                'HoldbyClient': serializer.data[i]['HoldbyClient'],
                'InterviewSelect': serializer.data[i]['InterviewSelect'],
                'OfferBackout': serializer.data[i]['OfferBackout'],
                'HoldbyBDM': serializer.data[i]['HoldbyBDM'],
                'InternalInterview': serializer.data[i]['InternalInterview'],
                'InterviewBackout': serializer.data[i]['InterviewBackout'],
                'FeedbackAwaited': serializer.data[i]['FeedbackAwaited'],
                'InternalInterviewReject': serializer.data[i]['InternalInterviewReject'],
                'InterviewReject': serializer.data[i]['InterviewReject'],

                'InternalSubmission': serializer.data[i]['InternalSubmission'],
                'InternalSubmissionReject': serializer.data[i]['InternalSubmissionReject'],
                'InternalInterview1': serializer.data[i]['InternalInterview1'],
                'InternalInterviewReject1': serializer.data[i]['InternalInterviewReject1'],
                'InternalShortlisted': serializer.data[i]['InternalShortlisted'],
                'InternalOffered': serializer.data[i]['InternalOffered'],
                'InternalOfferedReject': serializer.data[i]['InternalOfferedReject'],
                'InternalPlaced': serializer.data[i]['InternalPlaced'],
                'SendOuttoClient': serializer.data[i]['SendOuttoClient']


                # 'remarks': serializer.data[i]['remarks'],
                # 'assigned_recruiters': assigned_recruiters
            }

            outputs.append(rows)

        return Response(outputs)


class JobSummaryGraph(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        print(today)
        yesterday = utils.yesterday_datetime()
        print(yesterday)

        week_start, week_end = utils.week_date_range()
        print(week_start)
        print(week_end)

        month_start, month_end = utils.month_date_range()
        print(month_start)
        print(month_end)

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        queryset = None
        print(GLOBAL_ROLE.get('ADMIN'))
        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s GROUP BY cjs.stage_id, j.job_title",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY cjs.stage_id, j.job_title",
                    [yesterday, today])
            elif date_range == 'last-24-hours':
                start_date = datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0)
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY cjs.stage_id, j.job_title",
                    [start_date, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY cjs.stage_id, j.job_title",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY c.id,cjs.stage_id, j.job_title,u.first_name,u.last_name,j.id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY cjs.stage_id, j.job_title",
                    [start_date, end_date])

        elif userGroup is not None and (
                userGroup == GLOBAL_ROLE.get('BDMMANAGER') or userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER')):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at > %s GROUP BY cjs.stage_id, j.job_title",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at > %s AND j.created_at < %s GROUP BY cjs.stage_id, j.job_title",
                    [yesterday, today])
            elif date_range == 'last-24-hours':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at > %s AND j.created_at < %s GROUP BY cjs.stage_id, j.job_title",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY cjs.stage_id, j.job_title",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY c.id,cjs.stage_id, j.job_title,u.first_name,u.last_name,j.id",
                    [month_start, month_end])

                    #  queryset = Candidates.objects.raw(
                    # "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    # " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY c.id,cjs.stage_id, j.job_title,u.first_name,u.last_name,j.id",
                    # [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , j.job_title as job_title , j.id as job_id, j.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY cjs.stage_id, j.job_title",
                    [start_date, end_date])

        if queryset is not None:
            logger.info('Job Summary Graph Query formed: ' + str(queryset.query))

        serializer = JobSummaryGraphSerializer(queryset, many=True)
        # print(serializer.data)
        return Response(serializer.data)


class JobSummaryCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        bdm_id = request.query_params.get('bdm_id')
        country = request.query_params.get('country')
        status = request.query_params.get('status')

        if status:
            status_values = status.split(',')
        else:
            status_values = None


        employment_type = request.query_params.get('employment_type')

        if employment_type:
            employment_type_values = employment_type.split(',')
        else:
            employment_type_values = None


        if bdm_id:
            bdm_ids = bdm_id.split(',')
        else:
            bdm_ids = None

        if country:
           countries = country.split(',')
        else:
           countries = None
           
   
        

        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
      

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        #bdm_id = str(bdm_id).replace("-", "")
        #print(bdm_id)

        if date_range == 'today':
            queryset = get_jobs_summary_csv_by_date_range_and_id(today, today, bdm_ids,  countries, status_values,employment_type_values)
        elif date_range == 'yesterday':
            queryset = get_jobs_summary_csv_by_date_range_and_id(yesterday, today, bdm_ids,  countries, status_values,employment_type_values)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_jobs_summary_csv_by_date_range_and_id(start_date, today,bdm_ids,  countries, status_values,employment_type_values)
        elif date_range == 'week':
            queryset = get_jobs_summary_csv_by_date_range_and_id(week_start, week_end, bdm_ids,  countries,status_values,employment_type_values)
        elif date_range == 'month':
            queryset = get_jobs_summary_csv_by_date_range_and_id(month_start, month_end, bdm_ids,  countries, status_values,employment_type_values)
        elif start_date is not None and end_date is not None:
            queryset = get_jobs_summary_csv_by_date_range_and_id(start_date, end_date, bdm_ids,  countries,status_values,employment_type_values)

        if queryset is not None:
            logger.info('Job Summary CSV Query formed: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = BdmJobSummaryTableSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):
            #recruiter_name = serializer.data[i]['recruiter_name']
            #assigned_date = serializer.data[i]['assigned_date']
            rows = {
                'JobID': serializer.data[i]['Job_ID'],
                'ClientName': serializer.data[i]['client_name'],
                'JobTitle': serializer.data[i]['job_title'],
                'BdmName': serializer.data[i]['bdm_name'],
                'JobDate': serializer.data[i]['job_date'],
                'country': serializer.data[i]['country'],
                'NumberOfOpening': serializer.data[i]['number_of_opening'],
                'JobType': serializer.data[i]['employment_type'],
                'status': serializer.data[i]['status'],

                'Submission': serializer.data[i]['Submission'],
                # 'StatusStillSubmission': serializer.data[i]['StillSubmission'],
                'SubmissionReject': serializer.data[i]['SubmissionReject'],
                'InternalInterview': serializer.data[i]['InternalInterview'],
                'InternalInterviewReject': serializer.data[i]['InternalInterviewReject'],
                'CandidateReview': serializer.data[i]['CandidateReview'],
                'SendOut': serializer.data[i]['SendOut'],
                'SendoutReject': serializer.data[i]['SendoutReject'],
                'ClientInterview': serializer.data[i]['ClientInterview'],
                'HoldbyClient': serializer.data[i]['HoldbyClient'],
                'InterviewBackout': serializer.data[i]['InterviewBackout'],
                'InterviewReject': serializer.data[i]['InterviewReject'],
                'FeedbackAwaited': serializer.data[i]['FeedbackAwaited'],
                'Shortlisted': serializer.data[i]['Shortlisted'],
                'Offered': serializer.data[i]['Offered'],
                'OfferRejected': serializer.data[i]['OfferRejected'],
                'OfferBackout': serializer.data[i]['OfferBackout'],
                'Placed': serializer.data[i]['Placed'],

                'RejectedByClient': serializer.data[i]['RejectedByClient'],
                # 'CandidateAdded': serializer.data[i]['CandidateAdded'],
                'RejectedByTeam': serializer.data[i]['RejectedByTeam'],
                # 'ClientInterviewSecond': serializer.data[i]['ClientInterviewSecond'],
                # 'ClientInterviewFirst': serializer.data[i]['ClientInterviewFirst'],
                # 'SecondInterviewReject': serializer.data[i]['SecondInterviewReject'],
                'InterviewSelect': serializer.data[i]['InterviewSelect'],
                'HoldbyBDM': serializer.data[i]['HoldbyBDM'],
                # 'remarks': serializer.data[i]['remarks'],
                # 'assigned_recruiters': assigned_recruiters

                'InternalSubmission': serializer.data[i]['InternalSubmission'],
                'InternalSubmissionReject': serializer.data[i]['InternalSubmissionReject'],
                'InternalInterview1': serializer.data[i]['InternalInterview1'],
                'InternalInterviewReject1': serializer.data[i]['InternalInterviewReject1'],
                'InternalShortlisted': serializer.data[i]['InternalShortlisted'],
                'InternalOffered': serializer.data[i]['InternalOffered'],
                'InternalOfferedReject': serializer.data[i]['InternalOfferedReject'],
                'InternalPlaced': serializer.data[i]['InternalPlaced'],
                'SendOuttoClient': serializer.data[i]['SendOuttoClient']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=['JobID', 'ClientName',
                                                      'JobTitle', 'BdmName', 'JobDate', 'country',
                                                      'JobType','NumberOfOpening','status',
                                                      "Submission", "SubmissionReject", "InternalInterview", "InternalInterviewReject", "CandidateReview","SendOut","SendoutReject","ClientInterview", "HoldbyClient", "InterviewBackout", "InterviewReject",  "FeedbackAwaited","Shortlisted", "Offered", "OfferRejected", "OfferBackout", "Placed", "RejectedByClient", "RejectedByTeam", "InterviewSelect", "HoldbyBDM",
                                                      "InternalSubmission", "InternalSubmissionReject",
                                                      "InternalInterview1", "InternalInterviewReject1",
                                                      "InternalShortlisted",
                                                      "InternalOffered", "InternalOfferedReject", "InternalPlaced",
                                                      "SendOuttoClient"
                ])
        # 'status',

        writer.writeheader()

        writer.writerows(outputs)

        return response


class JobSummaryTableByIdAllData(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)

        job_id = str(job_id).replace("-", "")
        print(job_id)

        if date_range == 'today':
            queryset = get_jobs_summary_by_job_title_alldata(today, today, job_id)
        elif date_range == 'yesterday':
            queryset = get_jobs_summary_by_job_title_alldata(yesterday, today, job_id)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_jobs_summary_by_job_title_alldata(start_date, today, job_id)
        elif date_range == 'week':
            queryset = get_jobs_summary_by_job_title_alldata(week_start, week_end, job_id)
        elif date_range == 'month':
            queryset = get_jobs_summary_by_job_title_alldata(month_start, month_end, job_id)
        elif start_date is not None and end_date is not None:
            queryset = get_jobs_summary_by_job_title_alldata(start_date, end_date, job_id)

        if queryset is not None:
            logger.info('Job Summary QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = JobSummaryTableByTitleAllDataSerializer(queryset, many=True)

        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):
            rows = {
                'id': serializer.data[i]['id'],
                'submission_date': serializer.data[i]['submission_date'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'current_status': serializer.data[i]['current_status'],
                'remarks': serializer.data[i]['remarks']
            }

            outputs.append(rows)

        return Response(outputs)


class JobSummaryTableByIdAllDataCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)

        job_id = str(job_id).replace("-", "")
        print(job_id)

        if date_range == 'today':
            queryset = get_jobs_summary_by_job_title_alldata(today, today, job_id)
        elif date_range == 'yesterday':
            queryset = get_jobs_summary_by_job_title_alldata(yesterday, today, job_id)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_jobs_summary_by_job_title_alldata(start_date, today, job_id)
        elif date_range == 'week':
            queryset = get_jobs_summary_by_job_title_alldata(week_start, week_end, job_id)
        elif date_range == 'month':
            queryset = get_jobs_summary_by_job_title_alldata(month_start, month_end, job_id)
        elif start_date is not None and end_date is not None:
            queryset = get_jobs_summary_by_job_title_alldata(start_date, end_date, job_id)

        if queryset is not None:
            logger.info('Job Summary QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = JobSummaryTableByTitleAllDataSerializer(queryset, many=True)

        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):
            rows = {
                #'id': serializer.data[i]['id'],
                'submission_date': serializer.data[i]['submission_date'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'current_status': serializer.data[i]['current_status'],
                'remarks': serializer.data[i]['remarks']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=['submission_date', 'recruiter_name',
                                                      'candidate_name', 'current_status', 'remarks'
                                                      ])
        writer.writeheader()
        writer.writerows(outputs)
        return response
    
    
    
class JobSummaryCommonSubmissionCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']

        job_id = str(job_id).replace("-", "")

        if date_range == 'today':
            queryset = get_jobs_summary_by_job_title_alldata(today, today, job_id)
        elif date_range == 'yesterday':
            queryset = get_jobs_summary_by_job_title_alldata(yesterday, today, job_id)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_jobs_summary_by_job_title_alldata(start_date, today, job_id)
        elif date_range == 'week':
            queryset = get_jobs_summary_by_job_title_alldata(week_start, week_end, job_id)
        elif date_range == 'month':
            queryset = get_jobs_summary_by_job_title_alldata(month_start, month_end, job_id)
        elif start_date is not None and end_date is not None:
            queryset = get_jobs_summary_by_job_title_alldata(start_date, end_date, job_id)

        if queryset is not None:
            logger.info('Job Summary QuerySet Query formed: ' + str(queryset.query))
        serializer = JobSummaryCommonSubmissionSerializerCsv(queryset, many=True)

        array_length = len(serializer.data)
        outputs = []
        uuids = set()
        for i in range(array_length):
            rows = {
                'submission_date': serializer.data[i]['submission_date'],
                'status': serializer.data[i]['current_status'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'client_name' : serializer.data[i]['company_name'],
                'remarks': serializer.data[i]['remarks']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=['submission_date', 'status',
                                                      'candidate_name', 'recruiter_name','client_name', 'remarks'
                                                      ])
        writer.writeheader()
        writer.writerows(outputs)
        return response

    
    




class JobSummaryTableByDatewiseBreakdown(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
        logger.info('job_id: ' + str(job_id))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        job_id = str(job_id).replace("-", "")
        print(job_id)

        if date_range == 'today':
            queryset = get_jobs_summary_by_datewise_breakdown(today, today, job_id)
        elif date_range == 'yesterday':
            queryset = get_jobs_summary_by_datewise_breakdown(yesterday, today, job_id)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_jobs_summary_by_datewise_breakdown(start_date, today, job_id)
        elif date_range == 'week':
            queryset = get_jobs_summary_by_datewise_breakdown(week_start, week_end, job_id)
        elif date_range == 'month':
            queryset = get_jobs_summary_by_datewise_breakdown(month_start, month_end, job_id)
        elif start_date is not None and end_date is not None:
            queryset = get_jobs_summary_by_datewise_breakdown(start_date, end_date, job_id)

        if queryset is not None:
            logger.info('Job Summary QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = BdmJobSummaryTableByDatewiseBreakdownSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        uuids = set()
        for i in range(array_length):
            rows = {
                'id': serializer.data[i]['id'],
                'rid': serializer.data[i]['rid'],
                'job_title': serializer.data[i]['job_title'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'job_posted_date': serializer.data[i]['job_posted_date'],

                'Submission': serializer.data[i]['Submission'],
                'StillSubmission': serializer.data[i]['StillSubmission'],
                'SubmissionReject': serializer.data[i]['SubmissionReject'],
                'SendOut': serializer.data[i]['SendOut'],
                'SendoutReject': serializer.data[i]['SendoutReject'],
                'ClientInterview': serializer.data[i]['ClientInterview'],
                'RejectedByClient': serializer.data[i]['RejectedByClient'],
                'Shortlisted': serializer.data[i]['Shortlisted'],
                'Offered': serializer.data[i]['Offered'],
                'Placed': serializer.data[i]['Placed'],

                'CandidateAdded': serializer.data[i]['CandidateAdded'],
                'CandidateReview': serializer.data[i]['CandidateReview'],
                'RejectedByTeam': serializer.data[i]['RejectedByTeam'],
                'ClientInterviewSecond': serializer.data[i]['ClientInterviewSecond'],
                'ClientInterviewFirst': serializer.data[i]['ClientInterviewFirst'],
                'OfferRejected': serializer.data[i]['OfferRejected'],
                'SecondInterviewReject': serializer.data[i]['SecondInterviewReject'],
                'HoldbyClient': serializer.data[i]['HoldbyClient'],
                'InterviewSelect': serializer.data[i]['InterviewSelect'],
                'OfferBackout': serializer.data[i]['OfferBackout'],
                'HoldbyBDM': serializer.data[i]['HoldbyBDM'],
                'InternalInterview': serializer.data[i]['InternalInterview'],
                'InterviewBackout': serializer.data[i]['InterviewBackout'],
                'FeedbackAwaited': serializer.data[i]['FeedbackAwaited'],
                'InternalInterviewReject': serializer.data[i]['InternalInterviewReject'],
                'InterviewReject': serializer.data[i]['InterviewReject'],

                'InternalSubmission': serializer.data[i]['InternalSubmission'],
                'InternalSubmissionReject': serializer.data[i]['InternalSubmissionReject'],
                'InternalInterview1': serializer.data[i]['InternalInterview1'],
                'InternalInterviewReject1': serializer.data[i]['InternalInterviewReject1'],
                'InternalShortlisted': serializer.data[i]['InternalShortlisted'],
                'InternalOffered': serializer.data[i]['InternalOffered'],
                'InternalOfferedReject': serializer.data[i]['InternalOfferedReject'],
                'InternalPlaced': serializer.data[i]['InternalPlaced'],
                'SendOuttoClient': serializer.data[i]['SendOuttoClient']
            }

            outputs.append(rows)

        return Response(outputs)


class JobSummaryTableByDatewiseBreakdownCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))
        logger.info('job_id: ' + str(job_id))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        job_id = str(job_id).replace("-", "")
        print(job_id)

        if date_range == 'today':
            queryset = get_jobs_summary_by_datewise_breakdown(today, today, job_id)
        elif date_range == 'yesterday':
            queryset = get_jobs_summary_by_datewise_breakdown(yesterday, today, job_id)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_jobs_summary_by_datewise_breakdown(start_date, today, job_id)
        elif date_range == 'week':
            queryset = get_jobs_summary_by_datewise_breakdown(week_start, week_end, job_id)
        elif date_range == 'month':
            queryset = get_jobs_summary_by_datewise_breakdown(month_start, month_end, job_id)
        elif start_date is not None and end_date is not None:
            queryset = get_jobs_summary_by_datewise_breakdown(start_date, end_date, job_id)

        if queryset is not None:
            logger.info('Queryset of get_jobs_summary_by_datewise_breakdown_csv: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = BdmJobSummaryTableByDatewiseBreakdownSerializer(queryset, many=True)
        # print(serializer.data['first_name'])

        array_length = len(serializer.data)
        outputs = []
        uuids = set()
        for i in range(array_length):
            rows = {
                #'id': serializer.data[i]['id'],
                'job_title': serializer.data[i]['job_title'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'job_posted_date': serializer.data[i]['job_posted_date'],

                'Submission': serializer.data[i]['Submission'],
                'StillSubmission': serializer.data[i]['StillSubmission'],
                'SubmissionReject': serializer.data[i]['SubmissionReject'],
                'SendOut': serializer.data[i]['SendOut'],
                'SendoutReject': serializer.data[i]['SendoutReject'],
                'ClientInterview': serializer.data[i]['ClientInterview'],
                'RejectedByClient': serializer.data[i]['RejectedByClient'],
                'Shortlisted': serializer.data[i]['Shortlisted'],
                'Offered': serializer.data[i]['Offered'],
                'Placed': serializer.data[i]['Placed'],

                'CandidateAdded': serializer.data[i]['CandidateAdded'],
                'CandidateReview': serializer.data[i]['CandidateReview'],
                'RejectedByTeam': serializer.data[i]['RejectedByTeam'],
                'ClientInterviewSecond': serializer.data[i]['ClientInterviewSecond'],
                'ClientInterviewFirst': serializer.data[i]['ClientInterviewFirst'],
                'OfferRejected': serializer.data[i]['OfferRejected'],
                'SecondInterviewReject': serializer.data[i]['SecondInterviewReject'],
                'HoldbyClient': serializer.data[i]['HoldbyClient'],
                'InterviewSelect': serializer.data[i]['InterviewSelect'],
                'OfferBackout': serializer.data[i]['OfferBackout'],
                'HoldbyBDM': serializer.data[i]['HoldbyBDM'],
                'InternalInterview': serializer.data[i]['InternalInterview'],
                'InterviewBackout': serializer.data[i]['InterviewBackout'],
                'FeedbackAwaited': serializer.data[i]['FeedbackAwaited'],
                'InternalInterviewReject': serializer.data[i]['InternalInterviewReject'],
                'InterviewReject': serializer.data[i]['InterviewReject'],

                'InternalSubmission': serializer.data[i]['InternalSubmission'],
                'InternalSubmissionReject': serializer.data[i]['InternalSubmissionReject'],
                'InternalInterview1': serializer.data[i]['InternalInterview1'],
                'InternalInterviewReject1': serializer.data[i]['InternalInterviewReject1'],
                'InternalShortlisted': serializer.data[i]['InternalShortlisted'],
                'InternalOffered': serializer.data[i]['InternalOffered'],
                'InternalOfferedReject': serializer.data[i]['InternalOfferedReject'],
                'InternalPlaced': serializer.data[i]['InternalPlaced'],
                'SendOuttoClient': serializer.data[i]['SendOuttoClient']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=['job_title', 'recruiter_name', 'job_posted_date',
                                                      "Submission", "StillSubmission", "SubmissionReject", "SendOut",
                                                      "SendoutReject",
                                                      "ClientInterview", "RejectedByClient", "Shortlisted", "Offered",
                                                      "Placed", "CandidateAdded", "CandidateReview", "RejectedByTeam",
                                                      "ClientInterviewSecond",
                                                      "ClientInterviewFirst", "OfferRejected",
                                                      "SecondInterviewReject", "HoldbyClient",
                                                      "InterviewSelect", "OfferBackout", "HoldbyBDM",
                                                      "InternalInterview", "InterviewBackout", "FeedbackAwaited",
                                                      "FeedbackAwaited", "InternalInterviewReject",
                                                      "InterviewReject",
                                                      "InternalSubmission", "InternalSubmissionReject",
                                                      "InternalInterview1", "InternalInterviewReject1",
                                                      "InternalShortlisted",
                                                      "InternalOffered", "InternalOfferedReject", "InternalPlaced",
                                                      "SendOuttoClient"
                                                      ])

        writer.writeheader()
        writer.writerows(outputs)

        return response


class CandidateDetailsByJobId(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        rid = request.query_params.get('rid')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        job_id = str(job_id).replace("-", "")
        rid = str(rid).replace("-", "")

        if date_range == 'today':
            queryset = get_candidate_details_by_job_id(today, today, job_id, rid)
        elif date_range == 'yesterday':
            queryset = get_candidate_details_by_job_id(yesterday, today, job_id, rid)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_candidate_details_by_job_id(start_date, today, job_id, rid)
        elif date_range == 'week':
            queryset = get_candidate_details_by_job_id(week_start, week_end, job_id, rid)
        elif date_range == 'month':
            queryset = get_candidate_details_by_job_id(month_start, month_end, job_id, rid)
        elif start_date is not None and end_date is not None:
            queryset = get_candidate_details_by_job_id(start_date, end_date, job_id, rid)

        if queryset is not None:
            logger.info('Candidate QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = CandidateDetailsByJobIdSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        uuids = set()
        for i in range(array_length):
            rows = {
                'id': serializer.data[i]['id'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'company_name': serializer.data[i]['company_name'],
                'total_experience': serializer.data[i]['total_experience'],
                'rank': serializer.data[i]['rank'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'client_name': serializer.data[i]['client_name'],
                'location': serializer.data[i]['location'],
                'visa': serializer.data[i]['visa'],
                'job_type': serializer.data[i]['job_type'],
                'country': serializer.data[i]['country'],
                'status': serializer.data[i]['status'],
                'submission_date': serializer.data[i]['submission_date'],
                'remarks': serializer.data[i]['remarks']
            }

            outputs.append(rows)

        return Response(outputs)


class CandidateDetailsByJobIdCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        job_id = request.query_params.get('job_id')
        rid = request.query_params.get('rid')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        job_id = str(job_id).replace("-", "")
        print(job_id)
        rid = str(rid).replace("-", "")

        if date_range == 'today':
            queryset = get_candidate_details_by_job_id_csv(today, today, job_id, rid)
        elif date_range == 'yesterday':
            queryset = get_candidate_details_by_job_id_csv(yesterday, today, job_id, rid)
        elif date_range == 'last-24-hours':
            start_date = str(datetime.datetime.today() - datetime.timedelta(hours=24, minutes=0))
            queryset = get_candidate_details_by_job_id_csv(start_date, today, job_id, rid)
        elif date_range == 'week':
            queryset = get_candidate_details_by_job_id_csv(week_start, week_end, job_id, rid)
        elif date_range == 'month':
            queryset = get_candidate_details_by_job_id_csv(month_start, month_end, job_id, rid)
        elif start_date is not None and end_date is not None:
            queryset = get_candidate_details_by_job_id_csv(start_date, end_date, job_id, rid)

        if queryset is not None:
            logger.info('Candidate QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = CandidateDetailsByJobIdSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        uuids = set()
        for i in range(array_length):
            rows = {
                # 'id': serializer.data[i]['id'],
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'company_name': serializer.data[i]['company_name'],
                'total_experience': serializer.data[i]['total_experience'],
                'rank': serializer.data[i]['rank'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'client_name': serializer.data[i]['client_name'],
                'location': serializer.data[i]['location'],
                'visa': serializer.data[i]['visa'],
                'job_type': serializer.data[i]['job_type'],
                'country': serializer.data[i]['country'],
                'status': serializer.data[i]['status'],
                'submission_date': serializer.data[i]['submission_date'],
                'remarks': serializer.data[i]['remarks']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=['candidate_name', 'primary_email', 'primary_phone_number',
                                                      "company_name", "total_experience", "rank", "min_rate",
                                                      "max_rate",
                                                      "min_salary", "max_salary", "client_name", "location",
                                                      "location", "visa", "job_type", "country",
                                                      "status","submission_date", "remarks"
                                                      ])

        writer.writeheader()
        writer.writerows(outputs)

        return response


class JobSubmissionsByClientTable(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        client_id = request.query_params.get('client_id')
        country = request.query_params.get('country')
        bdm_id = request.query_params.get('bdm_id')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if date_range == 'today':
            queryset = get_job_submission_by_client(today, today, client_id, country, bdm_id)
        elif date_range == 'yesterday':
            queryset = get_job_submission_by_client(yesterday, yesterday, client_id, country, bdm_id)
        elif date_range == 'last-24-hours':
            queryset = get_job_submission_by_client(yesterday, today, client_id, country, bdm_id)
        elif date_range == 'week':
            queryset = get_job_submission_by_client(week_start, week_end, client_id, country, bdm_id)
        elif date_range == 'month':
            queryset = get_job_submission_by_client(month_start, month_end, client_id, country, bdm_id)
        elif start_date is not None and end_date is not None:
            queryset = get_job_submission_by_client(start_date, end_date, client_id, country, bdm_id)

        if queryset is not None:
            logger.info('Job Submission by client Table QuerySet: ' + str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = JobSubmissionsByClientTableSerializer(queryset, many=True)

        return Response(serializer.data)

        """        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs, j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s AND j.created_at < %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s AND j.created_at < %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s AND j.created_at < %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [start_date, end_date])

            # print(str(queryset.query))
        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s AND j.created_at < %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [start_date, end_date])

        if queryset is not None:
            logger.info('Job Summary QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = JobSubmissionsByClientTableSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):  # Use `xrange` for python 2.

            rows = {
                'id': serializer.data[i]['id'],
                'job_id': serializer.data[i]['Job_ID'],
                # 'job_title': serializer.data[i]['job_title'],
                'total_jobs': serializer.data[i]['total_jobs'],
                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],
                # 'job_type': serializer.data[i]['employment_type'],
                # 'min_salary': serializer.data[i]['min_salary'],
                # 'max_salary': serializer.data[i]['max_salary'],
                # 'min_rate': serializer.data[i]['min_rate'],
                # 'max_rate': serializer.data[i]['max_rate'],
                # 'job_date': serializer.data[i]['job_date'],
                'client_interview': serializer.data[i]['Client_Interview'],
                'offered': serializer.data[i]['Offered'],
                'submission': serializer.data[i]['Submission'],
                'rejected_by_team': serializer.data[i]['Rejected_By_Team'],
                'sendout_reject': serializer.data[i]['Sendout_Reject'],
                'offer_rejected': serializer.data[i]['Offer_Rejected'],
                'shortlisted': serializer.data[i]['Shortlisted'],
                'internal_interview': serializer.data[i]['Internal_Interview'],
                'awaiting_feedback': serializer.data[i]['Awaiting_Feedback'],
                'placed': serializer.data[i]['Placed'],
                'rejected_by_client': serializer.data[i]['Rejected_By_Client'],
                'submission_reject': serializer.data[i]['Submission_Reject'],
                'send_out': serializer.data[i]['SendOut'],
            }

            outputs.append(rows)

        return Response(outputs)"""


class JobSubmissionsByClientGraph(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        print(today)
        yesterday = utils.yesterday_datetime()
        print(yesterday)

        week_start, week_end = utils.week_date_range()
        print(week_start)
        print(week_end)

        month_start, month_end = utils.month_date_range()
        print(month_start)
        print(month_end)

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        queryset = None
        print(GLOBAL_ROLE.get('ADMIN'))
        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at > %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at > %s AND j.created_at < %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s GROUP BY cjs.stage_id, j.client_name_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at > %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at > %s AND j.created_at < %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT c.id,COUNT(*) as total_count, s.stage_name as stage_name,CONCAT(u.first_name, ' ' , u.last_name) as bdm_name , cl.company_name as company_name , j.id as job_id, cl.country FROM `osms_candidates` as c, `candidates_stages` as s, `osms_job_description` as j ,"
                    " `candidates_jobs_stages` as cjs, users_user as u, osms_clients as cl WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND u.id = j.created_by_id AND cjs.candidate_name_id = c.id AND j.created_at >= %s AND j.created_at <= %s AND j.client_name_id = cl.id GROUP BY cjs.stage_id, j.client_name_id",
                    [start_date, end_date])

        if queryset is not None:
            logger.info('Job Summary Graph Query formed: ' + str(queryset.query))

        serializer = JobSubmissionsByClientGraphSerializer(queryset, many=True)
        # print(serializer.data)
        return Response(serializer.data)


class JobSubmissionsByClientCSV(generics.ListAPIView):
    queryset = Candidates.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        client_id = request.query_params.get('client_id')
        country = request.query_params.get('country')
        bdm_id = request.query_params.get('bdm_id')

        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        """        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs, j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s AND j.created_at < %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s AND j.created_at < %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s AND j.created_at < %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [start_date, end_date])

            # print(str(queryset.query))
        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [today])
            elif date_range == 'yesterday':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at > %s AND j.created_at < %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = Candidates.objects.raw(
                    "SELECT * FROM (SELECT j.id, COUNT(j.client_name_id) as total_jobs ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
                    "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date FROM `osms_job_description` as j LEFT JOIN `users_user` as u on j.created_by_id = u.id LEFT JOIN `osms_clients` as cl on j.client_name_id = cl.id WHERE j.created_at >= %s AND j.created_at <= %s GROUP BY j.client_name_id)AS"
                    " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
                    " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
                    " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
                    "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
                    " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id",
                    [start_date, end_date])"""

        if date_range == 'today':
            queryset = get_job_submission_by_client(today, today, client_id, country, bdm_id)
        elif date_range == 'yesterday':
            queryset = get_job_submission_by_client(yesterday, yesterday, client_id, country, bdm_id)
        elif date_range == 'last-24-hours':
            queryset = get_job_submission_by_client(yesterday, today, client_id, country, bdm_id)
        elif date_range == 'week':
            queryset = get_job_submission_by_client(week_start, week_end, client_id, country, bdm_id)
        elif date_range == 'month':
            queryset = get_job_submission_by_client(month_start, month_end, client_id, country, bdm_id)
        elif start_date is not None and end_date is not None:
            queryset = get_job_submission_by_client(start_date, end_date, client_id, country, bdm_id)

        if queryset is not None:
            logger.info('Job Summary QuerySet Query formed: ' + str(queryset.query))
        # queryset = self.filter_queryset(queryset)
        serializer = JobSubmissionsByClientTableSerializer(queryset, many=True)
        # print(serializer.data['first_name'])
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()

        for i in range(array_length):
            rows = {
                'id': serializer.data[i]['id'],
                'total_jobs': serializer.data[i]['total_jobs'],
                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'country': serializer.data[i]['country'],

                'Submission': serializer.data[i]['Submission'],
                # 'StatusStillSubmission': serializer.data[i]['StillSubmission'],
                'SubmissionReject': serializer.data[i]['SubmissionReject'],
                'InternalInterview': serializer.data[i]['InternalInterview'],
                'InternalInterviewReject': serializer.data[i]['InternalInterviewReject'],
                'CandidateReview': serializer.data[i]['CandidateReview'],
                'SendOut': serializer.data[i]['SendOut'],
                'SendoutReject': serializer.data[i]['SendoutReject'],
                'ClientInterview': serializer.data[i]['ClientInterview'],
                'HoldbyClient': serializer.data[i]['HoldbyClient'],
                'InterviewBackout': serializer.data[i]['InterviewBackout'],
                'InterviewReject': serializer.data[i]['InterviewReject'],
                'FeedbackAwaited': serializer.data[i]['FeedbackAwaited'],
                'Shortlisted': serializer.data[i]['Shortlisted'],
                'Offered': serializer.data[i]['Offered'],
                'OfferRejected': serializer.data[i]['OfferRejected'],
                'OfferBackout': serializer.data[i]['OfferBackout'],
                'Placed': serializer.data[i]['Placed'],

                'RejectedByClient': serializer.data[i]['RejectedByClient'],
                # 'CandidateAdded': serializer.data[i]['CandidateAdded'],
                'RejectedByTeam': serializer.data[i]['RejectedByTeam'],
                # 'ClientInterviewSecond': serializer.data[i]['ClientInterviewSecond'],
                # 'ClientInterviewFirst': serializer.data[i]['ClientInterviewFirst'],
                # 'SecondInterviewReject': serializer.data[i]['SecondInterviewReject'],
                'InterviewSelect': serializer.data[i]['InterviewSelect'],
                'HoldbyBDM': serializer.data[i]['HoldbyBDM'],
                # 'remarks': serializer.data[i]['remarks'],
                # 'assigned_recruiters': assigned_recruiters

            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=['id','total_jobs', 'client_name', 'bdm_name','country',
                                                      "Submission", "SubmissionReject", "InternalInterview", "InternalInterviewReject", "CandidateReview","SendOut","SendoutReject","ClientInterview", "HoldbyClient", "InterviewBackout", "InterviewReject",  "FeedbackAwaited","Shortlisted", "Offered", "OfferRejected", "OfferBackout", "Placed", "RejectedByClient", "RejectedByTeam", "InterviewSelect", "HoldbyBDM",

                ])

        """        for i in range(array_length):  # Use `xrange` for python 2.

            rows = {
                'id': serializer.data[i]['id'],
                'job_id': serializer.data[i]['Job_ID'],
                'total_jobs': serializer.data[i]['total_jobs'],
                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],

                'client_interview': serializer.data[i]['Client_Interview'],
                'offered': serializer.data[i]['Offered'],
                'submission': serializer.data[i]['Submission'],
                'rejected_by_team': serializer.data[i]['Rejected_By_Team'],
                'sendout_reject': serializer.data[i]['Sendout_Reject'],
                'offer_rejected': serializer.data[i]['Offer_Rejected'],
                'shortlisted': serializer.data[i]['Shortlisted'],
                'internal_interview': serializer.data[i]['Internal_Interview'],
                'awaiting_feedback': serializer.data[i]['Awaiting_Feedback'],
                'placed': serializer.data[i]['Placed'],
                'rejected_by_client': serializer.data[i]['Rejected_By_Client'],
                'submission_reject': serializer.data[i]['Submission_Reject'],
                'send_out': serializer.data[i]['SendOut'],
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_submissions_by_client.csv"'
        writer = csv.DictWriter(response, fieldnames=['id', 'job_id',
                                                      'total_jobs', 'client_name', 'bdm_name',
                                                      'client_interview', 'offered', 'submission', 'rejected_by_team',
                                                      'sendout_reject', 'offer_rejected', 'shortlisted',
                                                      'internal_interview', 'awaiting_feedback',
                                                      'placed', 'rejected_by_client',
                                                      'submission_reject', 'send_out'
                                                      ])"""

        writer.writeheader()

        writer.writerows(outputs)

        return response


class AggregateData(generics.ListAPIView):
    queryset = clientModel.objects.all()

    def get(self, request, format=None):
        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        active_clients = 0
        submissions = 0
        placed = 0
        active_jobs = 0
        revenue = 0
        sendOut = 0
        total_jobs = 0
        interviewed = 0
        queryset = None
        uid = str(request.user.id).replace("-", "")

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']

        logger.info('userGroup Data: %s' % userGroup)

        total_jobs = jobModel.objects.count()

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            logger.info('================ADMIN==========')
            active_jobs = jobModel.objects.count()
            active_clients = clientModel.objects.count()
            revenue = jobModel.objects.all().aggregate(Sum('projected_revenue'))['projected_revenue__sum']
            placed = candidatesJobDescription.objects.filter(stage_id__stage_name="Placed").annotate(
                Count('stage')).count()

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            logger.info('================BDM==========')
            active_jobs = jobModel.objects.filter(
                created_by_id=request.user.id,
                status="Active").count()  # Q(created_by_id__created_by_id=request.user.id) |

            active_clients = clientModel.objects.filter(
                created_by_id=request.user.id).count()  # Q(created_by_id__created_by_id=request.user.id) |
            queryset = jobModel.objects.raw(
                "SELECT c.id, COUNT(*) as total_records FROM `osms_candidates` as c, `osms_job_description` as j, `candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE cjs.job_description_id = j.id AND cjs.stage_id = s.id AND cjs.candidate_name_id = c.id AND j.created_by_id = %s AND s.stage_name != 'Candidate Added' ",
                [uid])
            serializer = TotalRecordSerializer(queryset, many=True)
            if serializer.data[0] is not None and len(serializer.data[0]) > 0:
                submissions = str(serializer.data[0]['total_records'])
            queryset = jobModel.objects.raw(
                "SELECT c.id, COUNT(*) as total_records FROM `osms_candidates` as c, `osms_job_description` as j, `candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE cjs.job_description_id = j.id AND cjs.stage_id = s.id AND cjs.candidate_name_id = c.id AND j.created_by_id = %s AND s.stage_name = 'Placed'",
                [uid])
            serializer = TotalRecordSerializer(queryset, many=True)
            if serializer.data[0] is not None and len(serializer.data[0]) > 0:
                placed = str(serializer.data[0]['total_records'])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            logger.info('================REC MANAGER==========')
            active_jobs = jobModel.objects.filter(
                Q(default_assignee_id=request.user.id)).count()  # Q(created_by_id__created_by_id=request.user.id) |
            queryset = clientModel.objects.raw(
                "SELECT c.id, COUNT(DISTINCT(c.company_name)) as active_clients FROM `osms_job_description` as j, `osms_clients` as c WHERE j.client_name_id = c.id AND j.default_assignee_id = %s",
                [uid])
            serializer = ActiveClientSerializer(queryset, many=True)
            if serializer.data[0] is not None and len(serializer.data[0]) > 0:
                active_clients = str(serializer.data[0]['active_clients'])
            submissions = candidatesJobDescription.objects.filter(
                (Q(candidate_name__created_by_id=request.user.id))).exclude(
                stage__stage_name="Candidate Added").annotate(Count('stage')).count()
            placed = candidatesJobDescription.objects.filter(
                (Q(created_by_id__created_by_id=request.user.id) | Q(created_by_id=request.user.id)),
                stage_id__stage_name="Placed").annotate(Count('stage')).count()

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            logger.info('================RECRUITER==========')
            interviewed = candidatesJobDescription.objects.filter(candidate_name__created_by_id=request.user.id).count()
            sendOut = candidatesJobDescription.objects.filter(candidate_name__created_by_id=request.user.id,
                                                              stage_id__stage_name="SendOut").annotate(
                Count('stage')).count()
            submissions = candidatesJobDescription.objects.filter(
                candidate_name__created_by_id=request.user.id).exclude(stage__stage_name="Candidate Added").annotate(
                Count('stage')).count()
            placed = candidatesJobDescription.objects.filter(candidate_name__created_by_id=request.user.id,
                                                             stage_id__stage_name="Placed").annotate(
                Count('stage')).count()

        # active_jobs = jobModel.objects.count()
        # submissions = Candidates.objects.filter(stage_id__stage_name="Subimission").annotate(Count('stage')).count()
        # placed = Candidates.objects.filter(stage_id__stage_name="Placed").annotate(Count('stage')).count()
        response = {
            "active_clients": active_clients,
            "active_jobs": active_jobs,
            "submissions": submissions,
            "placed": placed,
            "revenue": revenue,
            "interviewed": interviewed,
            "sendOut": sendOut,
            "total_jobs": total_jobs
        }
        # logger.info('Aggreagte Data: ' + str(response))
        # serializer = AggregateDataSerializer(total_client, many=True)
        return Response(response)


class TopClients(generics.ListAPIView):
    queryset = clientModel.objects.all()
    serializer_class = TopClientSerializer
    permission_classes = [DjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter, ]

    def get(self, request, format=None):
        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        finalOutput = []
        clients = []
        uid = str(request.user.id).replace("-", "")

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']

        logger.info('userGroup Data: %s' % userGroup)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            queryset = clientModel.objects.raw(
                "SELECT cl.id, cl.company_name as client_name, (Select COUNT(s.stage_name) from osms_candidates as c,"
                "candidates_stages as s, osms_job_description as j , candidates_jobs_stages as cjs WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND s.stage_name != 'Placed' "
                "AND cjs.job_description_id = j.id and j.client_name_id = cl.id AND cjs.candidate_name_id = c.id ) as submissions, (Select COUNT(s.stage_name) "
                "from osms_candidates as c, candidates_stages as s, osms_job_description as j , candidates_jobs_stages as cjs WHERE cjs.stage_id = s.id AND s.stage_name = 'Placed' AND cjs.job_description_id = j.id and j.client_name_id = cl.id and cjs.candidate_name_id = c.id) as placed, (Select COUNT(j.job_title) from osms_job_description as j WHERE j.client_name_id = cl.id ) as job_title, cjs.created_at FROM `osms_clients` as cl  ORDER BY cjs.created_at DESC")  # Q(created_by_id__created_by_id=request.user.id) |

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            #   queryset = clientModel.objects.raw("SELECT cl.id, cl.company_name as client_name, s.stage_name as stage, (Select COUNT(j.job_title) from osms_job_description as j WHERE j.client_name_id = cl.id ) as job_title, cjs.created_at FROM candidates_stages as s, candidates_jobs_stages as cjs, `osms_clients` as cl, `osms_job_description` as ja WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND cjs.job_description_id = ja.id AND ja.client_name_id = cl.id AND cl.created_by_id = %s AND ja.created_by_id = %s ORDER BY cjs.created_at DESC", [uid, uid])

            queryset = clientModel.objects.raw("SELECT gcl.id, gcl.company_name as client_name, (Select COUNT("
                                               "j.job_title) from osms_job_description as j WHERE j.client_name_id = "
                                               "gcl.id ) as job_title, (SELECT COUNT(*) FROM osms_job_description as "
                                               "j, candidates_stages as s , candidates_jobs_stages as cjs WHERE "
                                               "cjs.stage_id = s.id AND j.client_name_id = gcl.id AND j.created_by_id "
                                               "= %s AND cjs.job_description_id = j.id AND s.stage_name != 'Candidate "
                                               "Added') as submissions, (SELECT COUNT(*) FROM osms_job_description as "
                                               "j, candidates_stages as s , candidates_jobs_stages as cjs WHERE "
                                               "cjs.stage_id = s.id AND j.client_name_id = gcl.id AND j.created_by_id "
                                               "= %s AND cjs.job_description_id = j.id AND s.stage_name = 'Placed') "
                                               "as placed, max(cjs.created_at) as created_at FROM candidates_stages "
                                               "as s, candidates_jobs_stages as cjs, `osms_clients` as gcl, "
                                               "`osms_job_description` as j WHERE cjs.stage_id = s.id AND "
                                               "s.stage_name != 'Candidate Added' AND cjs.job_description_id = j.id "
                                               "AND j.client_name_id = gcl.id AND gcl.created_by_id = %s AND "
                                               "j.created_by_id = %s GROUP BY gcl.company_name ORDER BY created_at "
                                               "DESC", [uid, uid, uid, uid])
            logger.info('BDMMANAGER Top Client: ' + str(queryset.query))

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            queryset = clientModel.objects.raw("SELECT gcl.id, gcl.company_name as client_name, (Select COUNT("
                                               "j.job_title) from osms_job_description as j WHERE j.client_name_id = "
                                               "gcl.id ) as job_title, (SELECT COUNT(*) FROM osms_job_description as "
                                               "j, candidates_stages as s , candidates_jobs_stages as cjs WHERE "
                                               "cjs.stage_id = s.id AND j.client_name_id = gcl.id AND j.created_by_id "
                                               "= %s AND cjs.job_description_id = j.id AND s.stage_name != 'Candidate "
                                               "Added') as submissions, (SELECT COUNT(*) FROM osms_job_description as "
                                               "j, candidates_stages as s , candidates_jobs_stages as cjs WHERE "
                                               "cjs.stage_id = s.id AND j.client_name_id = gcl.id AND j.created_by_id "
                                               "= %s AND cjs.job_description_id = j.id AND s.stage_name = 'Placed') "
                                               "as placed, max(cjs.created_at) as created_at FROM candidates_stages "
                                               "as s, candidates_jobs_stages as cjs, `osms_clients` as gcl, "
                                               "`osms_job_description` as j WHERE cjs.stage_id = s.id AND "
                                               "s.stage_name != 'Candidate Added' AND cjs.job_description_id = j.id "
                                               "AND j.client_name_id = gcl.id AND gcl.created_by_id = %s AND "
                                               "j.created_by_id = %s GROUP BY gcl.company_name ORDER BY created_at "
                                               "DESC", [uid, uid, uid, uid])
            logger.info('BDMMANAGER Top Client: ' + str(queryset.query))

            """queryset = clientModel.objects.raw(
                "SELECT cl.id, cl.company_name as client_name, s.stage_name as stage, (Select COUNT(j.job_title) from "
                "osms_job_description as j WHERE j.client_name_id = cl.id ) as job_title, cjs.created_at FROM "
                "candidates_stages as s, candidates_jobs_stages as cjs, `osms_clients` as cl, `osms_job_description` "
                "as ja WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND cjs.job_description_id = "
                "ja.id AND ja.client_name_id = cl.id AND ja.default_assignee_id = %s ORDER BY cjs.created_at DESC", 
                [uid])"""

        if queryset is not None:
            logger.info('Top Client: ' + str(queryset.query))
        serializer = TopClientSerializer(queryset, many=True)

        return Response(serializer.data)

        """        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            queryset = clientModel.objects.raw(
                "SELECT cl.id, cl.company_name as client_name, (Select COUNT(s.stage_name) from osms_candidates as c, candidates_stages as s, osms_job_description as j , candidates_jobs_stages as cjs WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND s.stage_name != 'Placed' AND cjs.job_description_id = j.id and cjs.candidate_name_id = c.id and j.created_by_id = %s AND j.client_name_id = cl.id ) as submissions, (Select COUNT(s.stage_name) from osms_candidates as c, candidates_stages as s, osms_job_description as j , candidates_jobs_stages as cjs WHERE cjs.stage_id = s.id AND s.stage_name = 'Placed' AND cjs.job_description_id = j.id and cjs.candidate_name_id = c.id and j.created_by_id = %s AND j.client_name_id = cl.id ) as placed, (Select COUNT(j.job_title) from osms_job_description as j WHERE j.created_by_id = %s AND j.client_name_id = cl.id ) as job_title FROM `osms_clients` as cl WHERE cl.created_by_id = %s",
                [uid, uid, uid, uid])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            queryset = clientModel.objects.raw(
                "SELECT cl.id, cl.company_name as client_name, (Select COUNT(s.stage_name) from osms_candidates as c, candidates_stages as s, osms_job_description as j , candidates_jobs_stages as cjs WHERE cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND s.stage_name != 'Placed' AND cjs.job_description_id = j.id and j.client_name_id = cl.id and cjs.candidate_name_id = c.id ) as submissions, (Select COUNT(s.stage_name) from osms_candidates as c, candidates_stages as s, osms_job_description as j , candidates_jobs_stages as cjs WHERE cjs.stage_id = s.id AND s.stage_name = 'Placed' AND cjs.job_description_id = j.id and j.client_name_id = cl.id and cjs.candidate_name_id = c.id ) as placed, (Select COUNT(j.job_title) from osms_job_description as j WHERE j.client_name_id = cl.id ) as job_title FROM `osms_clients` as cl, `osms_job_description` as ja WHERE ja.client_name_id = cl.id AND ja.default_assignee_id = %s GROUP BY cl.company_name",
                [uid])

        logger.info('Top Client: ' + str(queryset.query))
        serializer = ClientSummarySerializer(queryset, many=True)

        return Response(serializer.data)"""


class TopFiveHighPriorityJobs(generics.ListAPIView):
    queryset = clientModel.objects.all()
    serializer_class = TopFiveHighPriorityJobSerializer
    permission_classes = [DjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter, ]

    def get(self, request, format=None):
        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        finalOutput = []
        clients = []
        uid = str(request.user.id).replace("-", "")

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']

        logger.info('userGroup Data: %s' % userGroup)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            queryset = clientModel.objects.raw(
                "SELECT j.id, ca.id as candidate_id, cl.company_name as client_name, ca.first_name as candidate_name, u.first_name as "
                "recruiter_name, j.job_title, s.stage_name as current_status, cjs.submission_date as submission_date, "
                "cjs.updated_at as last_updated FROM `osms_candidates` as ca, candidates_jobs_stages as cjs, "
                "users_user as u, candidates_stages as s, osms_job_description as j, osms_clients as cl WHERE ca.id = "
                "cjs.candidate_name_id AND cjs.stage_id = s.id AND ca.created_by_id = u.id AND cjs.job_description_id "
                "= j.id AND cl.id = j.client_name_id AND s.stage_name != 'Candidate Added' ORDER BY cjs.submission_date DESC LIMIT 5")

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            queryset = clientModel.objects.raw(
                "SELECT j.id, ca.id as candidate_id, cl.company_name as client_name, ca.first_name as candidate_name, u.first_name as "
                "recruiter_name, j.job_title, s.stage_name as current_status, cjs.submission_date as submission_date, "
                "cjs.updated_at as last_updated FROM `osms_candidates` as ca, candidates_jobs_stages as cjs, "
                "users_user as u, candidates_stages as s, osms_job_description as j, osms_clients as cl WHERE ca.id = "
                "cjs.candidate_name_id AND cjs.stage_id = s.id AND ca.created_by_id = u.id AND cjs.job_description_id "
                "= j.id AND cl.id = j.client_name_id AND s.stage_name != 'Candidate Added' AND j.created_by_id = %s ORDER BY cjs.submission_date DESC LIMIT "
                "5", [uid])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            queryset = clientModel.objects.raw(
                "SELECT j.id, ca.id as candidate_id, cl.company_name as client_name, ca.first_name as candidate_name, u.first_name as "
                "recruiter_name, j.job_title, s.stage_name as current_status, cjs.submission_date as submission_date, "
                "cjs.updated_at as last_updated FROM `osms_candidates` as ca, candidates_jobs_stages as cjs, "
                "users_user as u, candidates_stages as s, osms_job_description as j, osms_clients as cl WHERE ca.id = "
                "cjs.candidate_name_id AND cjs.stage_id = s.id AND ca.created_by_id = u.id AND cjs.job_description_id "
                "= j.id AND cl.id = j.client_name_id AND s.stage_name != 'Candidate Added' AND j.created_by_id = %s ORDER BY cjs.submission_date DESC LIMIT "
                "5", [uid])

        logger.info('Top High Priority Jobs: ' + str(queryset.query))
        serializer = TopFiveHighPriorityJobSerializer(queryset, many=True)

        return Response(serializer.data)


class TopFivePlacement(generics.ListAPIView):
    queryset = Candidates.objects.none()

    def get(self, request, format=None):
        sql = 'SELECT  ca.id as id, CONCAT(ca.first_name, " ", ca.last_name ) AS candidate_name, cl.company_name AS client_name, s.stage_name as status FROM `osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s , `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND s.stage_name = "Placed"'
        queryset = Candidates.objects.raw(sql)
        serializer = TopFivePlacementSerializer(queryset, many=True)
        # serializer = AggregateDataSerializer(total_client, many=True)
        return Response(serializer.data)


class ClinetDropdownList(generics.ListAPIView):
    queryset = clientModel.objects.none()

    def get(self, request, format=None):
        user_token = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]
        token = Token.objects.get(key=user_token)
        user = token.user
        sql = "SELECT id, company_name FROM osms_clients where primary_email=%s"
       
        queryset = clientModel.objects.raw(sql,[user.email])
        print(queryset)
        serializer = ClientDropdownListSerializer(queryset, many=True)
        return Response(serializer.data)


class JobsDropdownList(generics.ListAPIView):
    queryset = jobModel.objects.none()

    def get(self, request, format=None):
        userObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(userObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        uid = str(request.user.id).replace("-", "")

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']

        logger.info('Role: ' + str(userGroup))

        """        if userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            sql = "SELECT j.id, CONCAT(j.job_title, '-', j.job_id) as job_title ,j.client_name_id FROM osms_job_description as j, job_description_assingment " \
                  "as jda WHERE j.status = 'Active' AND j.id = jda.job_id_id AND (jda.primary_recruiter_name_id = %s || jda.secondary_recruiter_name_id = %s) " \
                  "GROUP BY j.job_id ORDER BY j.created_at DESC"
            queryset = jobModel.objects.raw(sql, [uid, uid])
        else:
            sql = "SELECT id, CONCAT(job_title, '-', job_id) as job_title ,client_name_id  FROM osms_job_description WHERE status = 'Active' GROUP BY job_id ORDER BY created_at DESC"
            queryset = jobModel.objects.raw(sql)"""

        sql = "SELECT id, CONCAT(job_title, '-', job_id) as job_title ,client_name_id  FROM osms_job_description WHERE status = 'Active' GROUP BY job_id ORDER BY created_at DESC"
        queryset = jobModel.objects.raw(sql)

        logger.info("Dropdown List: " + str(queryset.query))
        serializer = JobsDropdownListSerializer(queryset, many=True)
        return Response(serializer.data)


class JobsDashboardList(generics.ListAPIView):
    queryset = jobModel.objects.none()

    def get(self, request, format=None):
        userObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(userObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        uid = str(request.user.id).replace("-", "")

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']

        logger.info('Role: ' + str(userGroup))

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            queryset = jobModel.objects.raw(
                "SELECT j.id, j.created_at, j.job_title as posted_date, cl.company_name, ja.assignee_name, CONCAT(u.first_name , ' ' , u.last_name) as bdm_name, ja.created_at as assinged_date FROM `osms_job_description` as j, `osms_clients` as cl, `users_user` as u, `job_description_assingment` as ja"
                " WHERE (j.client_name_id = cl.id AND ja.job_id_id = j.id AND ja.primary_recruiter_name_id = %s AND j.created_by_id = u.id) OR (j.client_name_id = cl.id AND ja.job_id_id = j.id AND ja.secondary_recruiter_name_id = %s AND j.created_by_id = u.id) ORDER BY assinged_date DESC",
                [uid, uid])
            logger.info('RM Jobs dashboard query: ' + str(queryset.query))

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            # queryset = jobModel.objects.raw(
            #     "SELECT j.id, j.created_at as posted_date , j.status, j.job_title, (SELECT COUNT(*) FROM candidates_stages as s , candidates_jobs_stages as cjs , osms_candidates as ca WHERE cjs.stage_id = s.id AND cjs.candidate_name_id = ca.id AND "
            #     "ca.created_by_id = %s AND cjs.job_description_id = j.id AND s.stage_name != 'Candidate Added') as total_submissions , (SELECT COUNT(*) FROM candidates_stages as s , candidates_jobs_stages as cjs , osms_candidates as ca WHERE cjs.stage_id = s.id AND "
            #     "cjs.candidate_name_id = ca.id AND ca.created_by_id = %s AND cjs.job_description_id = j.id AND s.stage_name = 'Placed') as placed , cl.company_name, CONCAT (u.first_name ,' ', u.last_name) as bdm_name,ja.assignee_name, ja.created_at as assinged_date "
            #     "FROM `osms_job_description` as j, `osms_clients` as cl, `users_user` as u, `job_description_assingment` as ja WHERE (j.client_name_id = cl.id AND u.id = j.created_by_id AND ja.job_id_id = j.id AND ja.primary_recruiter_name_id = %s) OR"
            #     "(j.client_name_id = cl.id AND u.id = j.created_by_id AND ja.job_id_id = j.id AND ja.secondary_recruiter_name_id = %s) ORDER BY assinged_date DESC",
            #     [uid, uid, uid, uid])
            
            query = """
                SELECT 
                    j.id, 
                    j.created_at AS posted_date, 
                    j.status, 
                    j.job_title, 
                    (
                        SELECT COUNT(*) 
                        FROM candidates_stages AS s 
                        INNER JOIN candidates_jobs_stages AS cjs ON s.id = cjs.stage_id 
                        INNER JOIN osms_candidates AS ca ON cjs.candidate_name_id = ca.id 
                        WHERE cjs.job_description_id = j.id 
                            AND ca.created_by_id = %s 
                            AND s.stage_name != 'Candidate Added'
                    ) AS total_submissions,
                    (
                        SELECT COUNT(*) 
                        FROM candidates_stages AS s 
                        INNER JOIN candidates_jobs_stages AS cjs ON s.id = cjs.stage_id 
                        INNER JOIN osms_candidates AS ca ON cjs.candidate_name_id = ca.id 
                        WHERE cjs.job_description_id = j.id 
                            AND ca.created_by_id = %s 
                            AND s.stage_name = 'Placed'
                    ) AS placed,
                    cl.company_name, 
                    CONCAT(u.first_name, ' ', u.last_name) AS bdm_name,
                    ja.assignee_name, 
                    ja.created_at AS assinged_date
                FROM osms_job_description AS j
                INNER JOIN osms_clients AS cl ON j.client_name_id = cl.id
                INNER JOIN users_user AS u ON u.id = j.created_by_id
                INNER JOIN job_description_assingment AS ja ON ja.job_id_id = j.id
                WHERE 
                    (ja.primary_recruiter_name_id = %s OR ja.secondary_recruiter_name_id = %s)
                ORDER BY assinged_date DESC
            """
            queryset = jobModel.objects.raw(query, [uid, uid, uid, uid])
            logger.info('Recr Jobs dashboard query: ' + str(queryset.query))

        serializer = ClientDashboardListSerializer(queryset, many=True)
        return Response(serializer.data)


class MyCandidatesList(generics.ListAPIView):
    queryset = Candidates.objects.none()

    def get(self, request, format=None):
        userObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(userObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        uid = str(request.user.id).replace("-", "")

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']

        logger.info('group: ' + str(userGroup))

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            queryset = Candidates.objects.raw(
                "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name,"
                "j.job_title as job_title, cl.company_name AS client_name, CONCAT(u.first_name,' ',u.last_name) as bdm_name, "
                "s.stage_name as current_status, cjs.submission_date AS submission_date, cjs.updated_at as last_updated FROM"
                "`osms_job_description` as j, `users_user` as u, `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages`"
                "as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u.id AND j.client_name_id = cl.id and j.id = cjs.job_description_id"
                " AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.created_by_id = %s ORDER BY cjs.created_at DESC",
                [uid])
        # sql = "SELECT j.id, j.created_at, j.job_title, cl.company_name, u.first_name as default_assignee_name FROM `osms_job_description` as j, `osms_clients` as cl, `users_user` as u WHERE j.client_name_id = cl.id AND u.id = j.default_assignee_id "
        serializer = MyCandidateSerializer(queryset, many=True)
        logger.info('Query for My candidates: ' + str(queryset.query))
        return Response(serializer.data)


class AssingedJobsList(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter, ]
    serializer_class = AssingedDashboardListSerializer

    def get(self, request, format=None):
        try:
            # Attempt to retrieve the user
            print(request.user.id) 
            user_token = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]
            token = Token.objects.get(key=user_token)
            user = token.user
            logger.info('user id from requiest' + str(user.id))
            userObj = User.objects.get(pk=user.id)
            if not userObj:
               return User.objects.none()
               
        except User.DoesNotExist:
            # Handle the case where the user does not exist
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        logger.info('passed exception ' + str(userObj))
        serializeObj = UserSerializer(userObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        uid = str(request.user.id).replace("-", "")

        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']

        logger.info('group: ' + str(userGroup))

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            # queryset = jobModel.objects.raw(
            #     "SELECT * FROM (SELECT j.id , j.job_title ,j.created_at as posted_date, c.company_name FROM `osms_job_description` as j LEFT JOIN `osms_clients` as c ON c.id = j.client_name_id) AS A "
            #     "LEFT JOIN (SELECT o.job_id_id as id, o.created_at as assinged_date,o.assignee_name , CONCAT(op1.first_name,' ',op1.last_name) as primary_recruiter_name,"
            #     " CONCAT(op2.first_name,' ',op2.last_name) as secondary_recruiter_name FROM `job_description_assingment` o INNER JOIN `users_user` op1 on o.primary_recruiter_name_id = op1.id LEFT JOIN `users_user` op2 on o.secondary_recruiter_name_id = op2.id) AS B ON A.id = B.id ORDER BY B.assinged_date DESC")
            
            #optmize raw query
            queryset = jobModel.objects.raw(
                        "SELECT "    
                        "j.id, j.job_title, j.created_at AS posted_date, c.company_name, "
                        "o.created_at AS assinged_date, o.assignee_name, "
                        "CONCAT(op1.first_name, ' ', op1.last_name) AS primary_recruiter_name, "
                        "CONCAT(op2.first_name, ' ', op2.last_name) AS secondary_recruiter_name "
                        "FROM `osms_job_description` AS j "
                        "LEFT JOIN `osms_clients` AS c ON c.id = j.client_name_id "
                        "LEFT JOIN ( "
                            "SELECT job_id_id AS id, created_at, assignee_name, "
                            "primary_recruiter_name_id, secondary_recruiter_name_id "
                            "FROM `job_description_assingment` "
                        ") AS o ON j.id = o.id "
                        "LEFT JOIN `users_user` AS op1 ON o.primary_recruiter_name_id = op1.id "
                        "LEFT JOIN `users_user` AS op2 ON o.secondary_recruiter_name_id = op2.id "
                        "ORDER BY o.created_at DESC"
                    )
            logger.info('Query for ADMIN: ' + str(queryset.query))

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            queryset = jobModel.objects.raw(
                "SELECT * FROM (SELECT j.id , j.job_title ,j.created_at as posted_date, c.company_name FROM `osms_job_description` as j, `osms_clients` as c WHERE c.id = j.client_name_id AND j.created_by_id = %s) AS A "
                "LEFT JOIN (SELECT o.job_id_id as id, o.created_at as assinged_date,o.assignee_name , CONCAT(op1.first_name,' ',op1.last_name) as primary_recruiter_name,"
                " CONCAT(op2.first_name,' ',op2.last_name) as secondary_recruiter_name FROM `job_description_assingment` o INNER JOIN `users_user` op1 on o.primary_recruiter_name_id = op1.id LEFT JOIN `users_user` op2 on o.secondary_recruiter_name_id = op2.id) AS B ON A.id = B.id ORDER BY A.posted_date DESC",
                [uid])
            
            logger.info('Query for BDM: ' + str(queryset.query))

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if request.query_params.get('action'):
                queryset = jobModel.objects.raw(
                    "SELECT j.* , IF(ja.primary_recruiter_name_id = %s, 'YES', 'NO') as primary_recruiter_name , IF(ja.secondary_recruiter_name_id = %s, 'YES', 'NO') as secondary_recruiter_name FROM `osms_job_description` as j, `osms_clients` as cl, `users_user` as u, `job_description_assingment` as ja WHERE (j.client_name_id = cl.id AND u.id = j.default_assignee_id AND ja.job_id_id = j.id AND ja.primary_recruiter_name_id = %s) OR"
                    "(j.client_name_id = cl.id AND u.id = j.default_assignee_id AND ja.job_id_id = j.id AND ja.secondary_recruiter_name_id = %s) ORDER BY j.created_at DESC",
                    [uid, uid, uid, uid])
                page = self.paginate_queryset(queryset)
                if page is not None:
                    serializer = AssingedDashboardListSerializer(queryset, many=True)
                    return self.get_paginated_response(serializer.data)
                logger.info('Query for RM: ' + str(queryset.query))
            else:
                # queryset = jobModel.objects.raw(
                #     "SELECT * FROM (SELECT j.id , j.job_title ,j.created_at as posted_date, c.company_name FROM `osms_job_description` as j LEFT JOIN `osms_clients` as c ON c.id = j.client_name_id) AS A "
                #     "LEFT JOIN (SELECT o.job_id_id as id, o.created_at as assinged_date,o.assignee_name , CONCAT(op1.first_name,' ',op1.last_name) as primary_recruiter_name,"
                #     " CONCAT(op2.first_name,' ',op2.last_name) as secondary_recruiter_name FROM `job_description_assingment` o INNER JOIN `users_user` op1 on o.primary_recruiter_name_id = op1.id LEFT JOIN `users_user` op2 on o.secondary_recruiter_name_id = op2.id) AS B ON A.id = B.id ORDER BY B.assinged_date DESC")
                
                queryset = jobModel.objects.raw(
                        "SELECT "    
                        "j.id, j.job_title, j.created_at AS posted_date, c.company_name, "
                        "o.created_at AS assinged_date, o.assignee_name, "
                        "CONCAT(op1.first_name, ' ', op1.last_name) AS primary_recruiter_name, "
                        "CONCAT(op2.first_name, ' ', op2.last_name) AS secondary_recruiter_name "
                        "FROM `osms_job_description` AS j "
                        "LEFT JOIN `osms_clients` AS c ON c.id = j.client_name_id "
                        "LEFT JOIN ( "
                            "SELECT job_id_id AS id, created_at, assignee_name, "
                            "primary_recruiter_name_id, secondary_recruiter_name_id "
                            "FROM `job_description_assingment` "
                        ") AS o ON j.id = o.id "
                        "LEFT JOIN `users_user` AS op1 ON o.primary_recruiter_name_id = op1.id "
                        "LEFT JOIN `users_user` AS op2 ON o.secondary_recruiter_name_id = op2.id "
                        "ORDER BY o.created_at DESC"
                    )
                
                logger.info('Query for RM: ' + str(queryset.query))

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if request.query_params.get('action'):
                queryset = jobModel.objects.raw(
                    "SELECT j.* FROM `osms_job_description` as j, `osms_clients` as cl, `users_user` as u, `job_description_assingment` as ja WHERE (j.client_name_id = cl.id AND u.id = j.default_assignee_id AND ja.job_id_id = j.id AND ja.primary_recruiter_name_id = %s) OR"
                    "(j.client_name_id = cl.id AND u.id = j.default_assignee_id AND ja.job_id_id = j.id AND ja.secondary_recruiter_name_id = %s) ORDER BY j.created_at DESC",
                    [uid, uid])
                page = self.paginate_queryset(queryset)
                if page is not None:
                    serializer = AssingedDashboardListSerializer(queryset, many=True)
                    return self.get_paginated_response(serializer.data)
                logger.info('Query for Rec: ' + str(queryset.query))

            else:
                queryset = jobModel.objects.raw(
                    "SELECT * FROM (SELECT j.id , j.job_title ,j.created_at as posted_date, c.company_name FROM `osms_job_description` as j LEFT JOIN `osms_clients` as c ON c.id = j.client_name_id) AS A "
                    "LEFT JOIN (SELECT o.job_id_id as id, o.created_at as assinged_date,o.assignee_name , CONCAT(op1.first_name,' ',op1.last_name) as primary_recruiter_name,"
                    " CONCAT(op2.first_name,' ',op2.last_name) as secondary_recruiter_name FROM `job_description_assingment` o INNER JOIN `users_user` op1 on o.primary_recruiter_name_id = op1.id LEFT JOIN `users_user` op2 on o.secondary_recruiter_name_id = op2.id) AS B ON A.id = B.id ORDER BY B.assinged_date DESC")
                logger.info('Query for Rec: ' + str(queryset.query))
        

        logger.info('after if else condition')
        serializer = AssingedDashboardSerializer(queryset, many=True)
        logger.info(serializer)
        logger.info('---------------- PRINTED SERIALIZER')
        # logger.info('ASSIGNED AND UNASSIGNED DATA: ' + str(serializer.data))
        return Response(serializer.data)


class GraphPointList(generics.ListAPIView):
    queryset = Candidates.objects.none()

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        logger.info('Date Range: ' + str(date_range))
        logger.info('Start Date: ' + str(start_date))
        logger.info('End Date: ' + str(end_date))

        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        if request.query_params.get('bdm_id') and request.query_params.get('stage'):
            bdm_id = str(request.query_params.get('bdm_id')).replace('UUID', ''). \
                replace('(\'', '').replace('\')', '').replace('-', '')
            # stage_id = str(request.query_params.get('stage_id')).replace('UUID', ''). \
            # replace('(\'', '').replace('\')', '').replace('-', '')
            if date_range == 'today':
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'yesterday':
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=yesterday,
                                                                  submission_date__lt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'week':
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=week_start,
                                                                  submission_date__lt=week_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'month':
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=month_start,
                                                                  submission_date__lt=month_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif start_date is not None and end_date is not None:
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=start_date,
                                                                  submission_date__lt=end_date)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

        elif request.query_params.get('recruiter_id') and request.query_params.get('stage'):
            recruiter_id = str(request.query_params.get('recruiter_id')).replace('UUID', ''). \
                replace('(\'', '').replace('\')', '').replace('-', '')
            if date_range == 'today':
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'yesterday':
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=yesterday,
                                                                  submission_date__lt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'week':
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=week_start,
                                                                  submission_date__lt=week_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'month':
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=month_start,
                                                                  submission_date__lt=month_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif start_date is not None and end_date is not None:
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=start_date,
                                                                  submission_date__lt=end_date)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

        elif request.query_params.get('job_id') and request.query_params.get('stage'):
            job_id = str(request.query_params.get('job_id')).replace('UUID', ''). \
                replace('(\'', '').replace('\')', '').replace('-', '')
            if date_range == 'today':
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'yesterday':
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=yesterday,
                                                                  job_description__created_at__lt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'week':
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=week_start,
                                                                  job_description__created_at__lt=week_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'month':
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=month_start,
                                                                  job_description__created_at__lt=month_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

            elif start_date is not None and end_date is not None:
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=start_date,
                                                                  job_description__created_at__lt=end_date)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)
                return Response(serializer.data)

        elif request.query_params.get('job_creater_id'):
            job_creater_id = str(request.query_params.get('job_creater_id')).replace('UUID', ''). \
                replace('(\'', '').replace('\')', '').replace('-', '')

            if date_range == 'today':
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__gt=today)
                serializer = JobDescriptionSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'yesterday':
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__gt=yesterday,
                                                  created_at__lt=today)
                serializer = JobDescriptionSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'week':
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__gt=week_start,
                                                  created_at__lt=week_end)
                serializer = JobDescriptionSerializer(candObj, many=True)
                return Response(serializer.data)

            elif date_range == 'month':
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__gt=month_start,
                                                  created_at__lt=month_end)
                serializer = JobDescriptionSerializer(candObj, many=True)
                return Response(serializer.data)

            elif request.query_params.get('month') and request.query_params.get('year'):
                month = request.query_params.get('month')
                year = request.query_params.get('year')
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__month=month,
                                                  created_at__year=year)
                serializer = JobDescriptionSerializer(candObj, many=True)
                return Response(serializer.data)

            elif request.query_params.get('single_date'):
                candObj = jobModel.objects.filter(created_by_id=job_creater_id,
                                                  created_at__date=request.query_params.get('single_date'))
                serializer = JobDescriptionSerializer(candObj, many=True)
                return Response(serializer.data)


class JobsByBDMSummaryTable(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = jobModel.objects.filter(created_at__gt=today)
            elif date_range == 'yesterday':
                queryset = jobModel.objects.filter(created_at__gt=yesterday, created_at__lt=today)
            elif date_range == 'week':
                queryset = jobModel.objects.filter(created_at__gt=week_start, created_at__lt=week_end)
            elif date_range == 'month':
                queryset = jobModel.objects.filter(created_at__gt=month_start, created_at__lt=month_end)
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.filter(created_at__gt=start_date, created_at__lt=end_date)

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.filter(created_at__gt=today)
            elif date_range == 'yesterday':
                queryset = jobModel.objects.filter(created_at__gt=yesterday, created_at__lt=today)
            elif date_range == 'week':
                queryset = jobModel.objects.filter(created_at__gt=week_start, created_at__lt=week_end)
            elif date_range == 'month':
                queryset = jobModel.objects.filter(created_at__gt=month_start, created_at__lt=month_end)
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.filter(created_at__gt=start_date, created_at__lt=end_date)

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.filter(created_at__gt=today)
            elif date_range == 'yesterday':
                queryset = jobModel.objects.filter(created_at__gt=yesterday, created_at__lt=today)
            elif date_range == 'week':
                queryset = jobModel.objects.filter(created_at__gt=week_start, created_at__lt=week_end)
            elif date_range == 'month':
                queryset = jobModel.objects.filter(created_at__gt=month_start, created_at__lt=month_end)
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.filter(created_at__gt=start_date, created_at__lt=end_date)

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = jobModel.objects.filter(created_at__gt=today)
            elif date_range == 'yesterday':
                queryset = jobModel.objects.filter(created_at__gt=yesterday, created_at__lt=today)
            elif date_range == 'week':
                queryset = jobModel.objects.filter(created_at__gt=week_start, created_at__lt=week_end)
            elif date_range == 'month':
                queryset = jobModel.objects.filter(created_at__gt=month_start, created_at__lt=month_end)
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.filter(created_at__gt=start_date, created_at__lt=end_date)

        if queryset is not None:
            print(str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = JobsByBDMTableSerializer(queryset, many=True)
        return Response(serializer.data)


class JobsByBDMSummaryCSV(generics.ListAPIView):
    queryset = Candidates.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]  # SearchFilter,
    filter_class = ReportFilter

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = jobModel.objects.filter(created_at__gt=today)
            elif date_range == 'yesterday':
                queryset = jobModel.objects.filter(created_at__gt=yesterday, created_at__lt=today)
            elif date_range == 'week':
                queryset = jobModel.objects.filter(created_at__gt=week_start, created_at__lt=week_end)
            elif date_range == 'month':
                queryset = jobModel.objects.filter(created_at__gt=month_start, created_at__lt=month_end)
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.filter(created_at__gt=start_date, created_at__lt=end_date)

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.filter(created_at__gt=today)
            elif date_range == 'yesterday':
                queryset = jobModel.objects.filter(created_at__gt=yesterday, created_at__lt=today)
            elif date_range == 'week':
                queryset = jobModel.objects.filter(created_at__gt=week_start, created_at__lt=week_end)
            elif date_range == 'month':
                queryset = jobModel.objects.filter(created_at__gt=month_start, created_at__lt=month_end)
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.filter(created_at__gt=start_date, created_at__lt=end_date)

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.filter(created_at__gt=today)
            elif date_range == 'yesterday':
                queryset = jobModel.objects.filter(created_at__gt=yesterday, created_at__lt=today)
            elif date_range == 'week':
                queryset = jobModel.objects.filter(created_at__gt=week_start, created_at__lt=week_end)
            elif date_range == 'month':
                queryset = jobModel.objects.filter(created_at__gt=month_start, created_at__lt=month_end)
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.filter(created_at__gt=start_date, created_at__lt=end_date)

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITER'):
            if date_range == 'today':
                queryset = jobModel.objects.filter(created_at__gt=today)
            elif date_range == 'yesterday':
                queryset = jobModel.objects.filter(created_at__gt=yesterday, created_at__lt=today)
            elif date_range == 'week':
                queryset = jobModel.objects.filter(created_at__gt=week_start, created_at__lt=week_end)
            elif date_range == 'month':
                queryset = jobModel.objects.filter(created_at__gt=month_start, created_at__lt=month_end)
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.filter(created_at__gt=start_date, created_at__lt=end_date)

        if queryset is not None:
            print(str(queryset.query))

        # queryset = self.filter_queryset(queryset)
        serializer = JobsByBDMTableSerializer(queryset, many=True)
        array_length = len(serializer.data)
        outputs = []
        print(array_length)
        uuids = set()
        for i in range(array_length):  # Use `xrange` for python 2.

            rows = {
                'job_id': serializer.data[i]['job_id'],
                'job_title': serializer.data[i]['job_title'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'job_type': serializer.data[i]['employment_type'],
                'client_name': serializer.data[i]['client_name']['company_name'],
                'bdm_name': str(serializer.data[i]['created_by']['first_name']) + ' ' + str(
                    serializer.data[i]['created_by']['last_name']),
                'job_date': serializer.data[i]['created_at']
            }

            outputs.append(rows)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="job_by_bdm_summary.csv"'
        writer = csv.DictWriter(response, fieldnames=['job_id',
                                                      'job_title', 'min_rate', 'max_rate', 'min_salary', 'max_salary',
                                                      'job_type', 'client_name', 'bdm_name', 'job_date'
                                                      ])

        writer.writeheader()

        writer.writerows(outputs)

        return response


class JobsByBDMSummaryGraph(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at > %s GROUP BY DATE(a.created_at), bdm_name",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id, COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at > %s AND a.created_at < %s GROUP BY DATE(a.created_at), bdm_name",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id, COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id, COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                logger.info(start_date)
                logger.info(end_date)
                if utils.get_number_of_days(end_date, start_date) > 30:
                    queryset = jobModel.objects.raw(
                        "SELECT a.id, MONTHNAME(a.created_at) AS month, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id, COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY MONTHNAME(a.created_at) , bdm_name",
                        [start_date, end_date])
                else:
                    queryset = jobModel.objects.raw(
                        "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id, COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                        [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at > %s GROUP BY DATE(a.created_at), bdm_name",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at > %s AND a.created_at < %s GROUP BY DATE(a.created_at), bdm_name",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                if (datetime.datetime.strptime(end_date, '%Y-%m-%d').date() - datetime.datetime.strptime(start_date,
                                                                                                         '%Y-%m-%d').date()).days > 30:
                    queryset = jobModel.objects.raw(
                        "SELECT a.id, MONTHNAME(a.created_at) AS month, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY MONTHNAME(a.created_at) , bdm_name",
                        [start_date, end_date])
                else:
                    queryset = jobModel.objects.raw(
                        "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                        [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at > %s GROUP BY DATE(a.created_at), bdm_name",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at > %s AND a.created_at < %s GROUP BY DATE(a.created_at), bdm_name",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                if (datetime.datetime.strptime(end_date, '%Y-%m-%d').date() - datetime.datetime.strptime(start_date,
                                                                                                         '%Y-%m-%d').date()).days > 30:
                    queryset = jobModel.objects.raw(
                        "SELECT a.id, MONTHNAME(a.created_at) AS month, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY MONTHNAME(a.created_at) , bdm_name",
                        [start_date, end_date])
                else:
                    queryset = jobModel.objects.raw(
                        "SELECT a.id, a.created_at, CONCAT(u.first_name, ' ' , u.last_name) AS bdm_name ,a.created_by_id as bdm_id , COUNT(a.id) AS total_count FROM osms_job_description as a , users_user as u WHERE u.id = a.created_by_id AND a.created_at >= %s AND a.created_at <= %s GROUP BY DATE(a.created_at), bdm_name",
                        [start_date, end_date])

        if queryset is not None:
            print(str(queryset.query))
            # queryset = self.filter_queryset(queryset)
            serializer = JobsByBDMGraphSerializer(queryset, many=True)
            # print(serializer.data['first_name'])
            print(serializer.data)
            return Response(serializer.data)


class ExportGraphsPointList(generics.ListAPIView):
    queryset = Candidates.objects.none()

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        if request.query_params.get('bdm_id') and request.query_params.get('stage'):
            bdm_id = str(request.query_params.get('bdm_id')).replace('UUID', ''). \
                replace('(\'', '').replace('\')', '').replace('-', '')

            if date_range == 'today':
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'yesterday':
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=yesterday,
                                                                  submission_date__lt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'week':
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=week_start,
                                                                  submission_date__lt=week_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'month':
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=month_start,
                                                                  submission_date__lt=month_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif start_date is not None and end_date is not None:
                candObj = candidatesJobDescription.objects.filter(job_description__created_by_id=bdm_id,
                                                                  stage__stage_name=request.query_params.get('stage'),
                                                                  submission_date__gt=start_date,
                                                                  submission_date__lt=end_date)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            array_length = len(serializer.data)
            outputs = []
            print(array_length)
            for i in range(array_length):  # Use `xrange` for python 2.

                rows = {
                    'candidate_name': str(serializer.data[i]['candidate_name']['first_name']) + ' ' + str(
                        serializer.data[i]['candidate_name']['last_name']),
                    'email': serializer.data[i]['candidate_name']['primary_email'],
                    'phone_number': serializer.data[i]['candidate_name']['primary_phone_number'],
                    'job_title': serializer.data[i]['job_description']['job_title'],
                    'min_rate': serializer.data[i]['candidate_name']['min_rate'],
                    'max_rate': serializer.data[i]['candidate_name']['max_rate'],
                    'min_salary': serializer.data[i]['candidate_name']['min_salary'],
                    'max_salary': serializer.data[i]['candidate_name']['max_salary'],
                    'status': serializer.data[i]['stage']['stage_name'],
                    'skills_1': serializer.data[i]['candidate_name']['skills_1'],
                    'skills_2': serializer.data[i]['candidate_name']['skills_2'],
                    'created_at': serializer.data[i]['candidate_name']['created_at']
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="bdm_performance.csv"'
            writer = csv.DictWriter(response, fieldnames=['candidate_name', 'email', 'phone_number', 'job_title',
                                                          'min_rate', 'max_rate', 'min_salary', 'max_salary',
                                                          'status', 'skills_1', 'skills_2', 'created_at'
                                                          ])

            writer.writeheader()
            writer.writerows(outputs)
            return response


        elif request.query_params.get('recruiter_id') and request.query_params.get('stage'):
            recruiter_id = str(request.query_params.get('recruiter_id')).replace('UUID', ''). \
                replace('(\'', '').replace('\')', '').replace('-', '')

            if date_range == 'today':
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'yesterday':
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=yesterday,
                                                                  submission_date__lt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'week':
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=week_start,
                                                                  submission_date__lt=week_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'month':
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=month_start,
                                                                  submission_date__lt=month_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif start_date is not None and end_date is not None:
                candObj = candidatesJobDescription.objects.filter(candidate_name__created_by_id=recruiter_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  submission_date__gt=start_date,
                                                                  submission_date__lt=end_date)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            array_length = len(serializer.data)
            outputs = []
            print(array_length)
            for i in range(array_length):  # Use `xrange` for python 2.

                rows = {
                    'candidate_name': str(serializer.data[i]['candidate_name']['first_name']) + ' ' + str(
                        serializer.data[i]['candidate_name']['last_name']),
                    'email': serializer.data[i]['candidate_name']['primary_email'],
                    'phone_number': serializer.data[i]['candidate_name']['primary_phone_number'],
                    'job_title': serializer.data[i]['job_description']['job_title'],
                    'min_rate': serializer.data[i]['candidate_name']['min_rate'],
                    'max_rate': serializer.data[i]['candidate_name']['max_rate'],
                    'min_salary': serializer.data[i]['candidate_name']['min_salary'],
                    'max_salary': serializer.data[i]['candidate_name']['max_salary'],
                    'status': serializer.data[i]['stage']['stage_name'],
                    'skills_1': serializer.data[i]['candidate_name']['skills_1'],
                    'skills_2': serializer.data[i]['candidate_name']['skills_2'],
                    'created_at': serializer.data[i]['candidate_name']['created_at']
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="recuiter_performance.csv"'
            writer = csv.DictWriter(response, fieldnames=['candidate_name', 'email', 'phone_number', 'job_title',
                                                          'min_rate', 'max_rate', 'min_salary', 'max_salary',
                                                          'status', 'skills_1', 'skills_2', 'created_at'
                                                          ])
            writer.writeheader()
            writer.writerows(outputs)
            return response

        elif request.query_params.get('job_id') and request.query_params.get('stage'):
            job_id = str(request.query_params.get('job_id')).replace('UUID', ''). \
                replace('(\'', '').replace('\')', '').replace('-', '')
            if date_range == 'today':
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'yesterday':
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=yesterday,
                                                                  job_description__created_at__lt=today)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'week':
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=week_start,
                                                                  job_description__created_at__lt=week_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif date_range == 'month':
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=month_start,
                                                                  job_description__created_at__lt=month_end)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            elif start_date is not None and end_date is not None:
                candObj = candidatesJobDescription.objects.filter(job_description_id=job_id,
                                                                  stage__stage_name=str(
                                                                      request.query_params.get('stage')),
                                                                  job_description__created_at__gt=start_date,
                                                                  job_description__created_at__lt=end_date)
                serializer = CandidateJobsStagesSerializer(candObj, many=True)

            array_length = len(serializer.data)
            outputs = []
            print(array_length)
            for i in range(array_length):  # Use `xrange` for python 2.

                rows = {
                    'candidate_name': str(serializer.data[i]['candidate_name']['first_name']) + ' ' + str(
                        serializer.data[i]['candidate_name']['last_name']),
                    'email': serializer.data[i]['candidate_name']['primary_email'],
                    'phone_number': serializer.data[i]['candidate_name']['primary_phone_number'],
                    'job_title': serializer.data[i]['job_description']['job_title'],
                    'min_rate': serializer.data[i]['candidate_name']['min_rate'],
                    'max_rate': serializer.data[i]['candidate_name']['max_rate'],
                    'min_salary': serializer.data[i]['candidate_name']['min_salary'],
                    'max_salary': serializer.data[i]['candidate_name']['max_salary'],
                    'status': serializer.data[i]['stage']['stage_name'],
                    'skills_1': serializer.data[i]['candidate_name']['skills_1'],
                    'skills_2': serializer.data[i]['candidate_name']['skills_2'],
                    'created_at': serializer.data[i]['candidate_name']['created_at']
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="job_summary.csv"'
            writer = csv.DictWriter(response, fieldnames=['candidate_name', 'email', 'phone_number', 'job_title',
                                                          'min_rate', 'max_rate', 'min_salary', 'max_salary',
                                                          'status', 'skills_1', 'skills_2', 'created_at'
                                                          ])
            writer.writeheader()
            writer.writerows(outputs)
            return response

        elif request.query_params.get('job_creater_id'):
            job_creater_id = str(request.query_params.get('job_creater_id')).replace('UUID', ''). \
                replace('(\'', '').replace('\')', '').replace('-', '')

            if date_range == 'today':
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__gt=today)
                serializer = JobDescriptionSerializer(candObj, many=True)

            elif date_range == 'yesterday':
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__gt=yesterday,
                                                  created_at__lt=today)
                serializer = JobDescriptionSerializer(candObj, many=True)

            elif date_range == 'week':
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__gt=week_start,
                                                  created_at__lt=week_end)
                serializer = JobDescriptionSerializer(candObj, many=True)

            elif date_range == 'month':
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__gt=month_start,
                                                  created_at__lt=month_end)
                serializer = JobDescriptionSerializer(candObj, many=True)

            elif request.query_params.get('month') and request.query_params.get('year'):
                month = request.query_params.get('month')
                year = request.query_params.get('year')
                candObj = jobModel.objects.filter(created_by_id=job_creater_id, created_at__month=month,
                                                  created_at__year=year)
                serializer = JobDescriptionSerializer(candObj, many=True)

            elif request.query_params.get('single_date'):
                candObj = jobModel.objects.filter(created_by_id=job_creater_id,
                                                  created_at__date=request.query_params.get('single_date'))
                serializer = JobDescriptionSerializer(candObj, many=True)

            array_length = len(serializer.data)
            outputs = []
            print(array_length)
            for i in range(array_length):  # Use `xrange` for python 2.

                rows = {
                    'job_posted_date': serializer.data[i]['created_at'],
                    'client': serializer.data[i]['client_name']['company_name'],
                    'job_title': serializer.data[i]['job_title'],
                    'min_rate': serializer.data[i]['min_rate'],
                    'max_rate': serializer.data[i]['max_rate'],
                    'min_salary': serializer.data[i]['min_salary'],
                    'max_salary': serializer.data[i]['max_salary'],
                    'job_id': serializer.data[i]['job_id']
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="bdm_jobs_summary.csv"'
            writer = csv.DictWriter(response, fieldnames=['job_posted_date', 'client', 'job_title',
                                                          'min_rate', 'max_rate', 'min_salary', 'max_salary', 'job_id'
                                                          ])
            writer.writeheader()
            writer.writerows(outputs)
            return response


class ActiveJobsAgingSummaryGraph(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name, CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id, js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id, js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id, js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id,js.job_id as job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date "
                    ", (SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date, (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u "
                    "WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        if queryset is not None:
            print(str(queryset.query))
            # queryset = self.filter_queryset(queryset)
            serializer = ActiveJobsAgingSerializer(queryset, many=True)
            return Response(serializer.data)


class ActiveJobsAgingSummaryTable(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.status = 'Active' AND js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        if queryset is not None:
            print(str(queryset.query))
            serializer = ActiveJobsAgingSerializer(queryset, many=True)
            return Response(serializer.data)


class ActiveJobsAgingSummaryCSV(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        uid = str(request.user.id).replace("-", "")

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at > %s ORDER BY js.created_at DESC",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at > %s AND js.created_at < %s ORDER BY js.created_at DESC",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT js.id ,js.job_id ,js.job_title,js.status, cl.company_name , CONCAT(u.first_name , ' ' ,u.last_name) as bdm_name, js.created_at as posted_date ,(SELECT cjs.submission_date as submission_date FROM candidates_jobs_stages cjs , osms_job_description as j WHERE cjs.job_description_id = js.id ORDER BY cjs.submission_date ASC LIMIT 1) as first_submission_date ,"
                    "(SELECT ja.created_at as assingment_date FROM job_description_assingment ja ,osms_job_description as j WHERE ja.job_id_id = js.id ORDER BY ja.created_at ASC LIMIT 1) as first_assingment_date,(SELECT CONCAT(u1.first_name, ' ' , u1.last_name) FROM job_description_assingment as ja , users_user as u1 WHERE ja.job_id_id = js.id AND ja.primary_recruiter_name_id = u1.id ORDER BY ja.created_at ASC LIMIT 1) as primary_recruiter_name"
                    ",(SELECT CONCAT(u2.first_name, ' ' , u2.last_name) FROM job_description_assingment as ja , users_user as u2 WHERE ja.job_id_id = js.id AND ja.secondary_recruiter_name_id = u2.id ORDER BY ja.created_at ASC LIMIT 1) as secondary_recruiter_name , (SELECT DATEDIFF(CURDATE(), posted_date)) as job_age FROM osms_job_description as js , osms_clients as cl , users_user as u WHERE cl.id = js.client_name_id AND js.created_by_id = u.id AND "
                    "js.created_at >= %s AND js.created_at <= %s ORDER BY js.created_at DESC",
                    [start_date, end_date])

        if queryset is not None:
            print(str(queryset.query))
            # queryset = self.filter_queryset(queryset)
            serializer = ActiveJobsAgingSerializer(queryset, many=True)
            array_length = len(serializer.data)
            outputs = []
            for i in range(array_length):  # Use `xrange` for python 2.

                rows = {
                    'job_id': serializer.data[i]['job_id'],
                    'job_title': serializer.data[i]['job_title'],
                    'status': serializer.data[i]['status'],
                    'client_name': serializer.data[i]['company_name'],
                    'posted_date': serializer.data[i]['posted_date'],
                    'first_submission_date': serializer.data[i]['first_submission_date'],
                    'first_assingment_date': serializer.data[i]['first_assingment_date'],
                    'job_age': serializer.data[i]['job_age'],
                    'bdm_name': serializer.data[i]['bdm_name'],
                    'primary_recruiter_name': serializer.data[i]['primary_recruiter_name'],
                    'secondary_recruiter_name': serializer.data[i]['secondary_recruiter_name'],
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="active_jobs_aging_summary.csv"'
            writer = csv.DictWriter(response, fieldnames=['job_id', 'job_title', 'status', 'client_name',
                                                          'posted_date', 'first_submission_date',
                                                          'first_assingment_date', 'job_age', 'bdm_name',
                                                          'primary_recruiter_name', 'secondary_recruiter_name'])

            writer.writeheader()

            writer.writerows(outputs)

            return response


class UnassignedJobsCSV(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]

    def get(self, request, format=None):
        queryset = jobModel.objects.raw(
            "SELECT j.id , j.job_id , j.job_title , cl.company_name , j.created_at as posted_date, CONCAT(u.first_name , ' ', u.last_name) as bdm_name "
            "FROM osms_job_description as j LEFT JOIN osms_clients as cl ON j.client_name_id = cl.id LEFT JOIN users_user as u ON u.id = j.created_by_id LEFT JOIN job_description_assingment as ja "
            "ON ja.job_id_id = j.id WHERE ja.primary_recruiter_name_id IS NULL AND ja.secondary_recruiter_name_id IS NULL ORDER BY j.created_at DESC")

        if queryset is not None:
            print(str(queryset.query))
            # queryset = self.filter_queryset(queryset)
            serializer = UnassignedJobsSerializer(queryset, many=True)
            array_length = len(serializer.data)
            outputs = []
            print(array_length)
            for i in range(array_length):  # Use `xrange` for python 2.

                rows = {
                    'job_id': serializer.data[i]['job_id'],
                    'job_title': serializer.data[i]['job_title'],
                    'client_name': serializer.data[i]['company_name'],
                    'posted_date': serializer.data[i]['posted_date'],
                    'bdm_name': serializer.data[i]['bdm_name'],
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="unassigned_jobs_summary.csv"'
            writer = csv.DictWriter(response, fieldnames=['job_id', 'job_title', 'client_name',
                                                          'posted_date', 'bdm_name'])

            writer.writeheader()

            writer.writerows(outputs)

            return response


class ClientRevenueReport(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id , cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id , cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id , cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [start_date, end_date])

        if queryset is not None:
            print(str(queryset.query))
            # queryset = self.filter_queryset(queryset)
            serializer = ClientRevenueSerializer(queryset, many=True)
            # print(serializer.data['first_name'])
            # print(serializer.data)
            return Response(serializer.data)


class ClientRevenueReportCSV(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]

    def get(self, request, format=None):
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        print(start_date)
        print(end_date)
        if end_date is not None:
            end_date = get_datetime_from_date(end_date)
        today = utils.get_current_date()
        yesterday = utils.yesterday_datetime()
        week_start, week_end = utils.week_date_range()
        month_start, month_end = utils.month_date_range()

        candObj = User.objects.get(pk=request.user.id)
        serializeObj = UserSerializer(candObj)
        groups = dict(serializeObj.data)
        userGroupDict = None
        userGroup = None
        queryset = None
        if len(groups['groups']) > 0:
            userGroupDict = dict(groups['groups'][0])
        if userGroupDict is not None:
            userGroup = userGroupDict['name']
        print(userGroup)
        uid = str(request.user.id).replace("-", "")
        print(uid)

        if userGroup is not None and userGroup == GLOBAL_ROLE.get('ADMIN'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id , cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('BDMMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id , cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [start_date, end_date])

        elif userGroup is not None and userGroup == GLOBAL_ROLE.get('RECRUITERMANAGER'):
            if date_range == 'today':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id , cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [today])
            elif date_range == 'yesterday':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [yesterday, today])
            elif date_range == 'week':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [week_start, week_end])
            elif date_range == 'month':
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [month_start, month_end])
            elif start_date is not None and end_date is not None:
                queryset = jobModel.objects.raw(
                    "SELECT cl.id ,cl.company_name as client_name_value , SUM(j.projected_revenue) as expected_revenue, (SELECT SUM(js.projected_revenue) FROM osms_job_description as js ,candidates_jobs_stages as cjs, candidates_stages as s WHERE js.client_name_id = cl.id ANd cjs.job_description_id = js.id"
                    " AND s.stage_name = 'Placed' AND s.id = cjs.stage_id) as actual_revenue FROM osms_job_description as j , osms_clients as cl WHERE j.client_name_id = cl.id AND j.created_at > %s AND j.created_at < %s GROUP BY client_name_value ORDER BY j.created_at DESC ",
                    [start_date, end_date])

        if queryset is not None:
            print(str(queryset.query))
            # queryset = self.filter_queryset(queryset)
            serializer = ClientRevenueSerializer(queryset, many=True)
            # print(serializer.data['first_name'])
            print(serializer.data)
            array_length = len(serializer.data)
            outputs = []
            print(array_length)
            for i in range(array_length):  # Use `xrange` for python 2.

                rows = {
                    'client_name': serializer.data[i]['client_name_value'],
                    'expected_revenue': serializer.data[i]['expected_revenue'],
                    'actual_revenue': serializer.data[i]['actual_revenue'],
                }

                outputs.append(rows)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="client_revenue_report.csv"'
            writer = csv.DictWriter(response, fieldnames=['client_name', 'expected_revenue', 'actual_revenue'])

            writer.writeheader()

            writer.writerows(outputs)

            return response


# Daily and weekly report modules
# daily mail sending method
def send_recruiter_email(country='India', isProd=False, finalOutput=None): # request,
    today_date = utils.get_current_datetime()
    # start_date = utils.get_current_date()
    start_date, end_date = utils.get_daily_report_start_and_end_datetime(country)
    # start_date = "2022-10-20 06:30:00"
    # end_date = "2022-10-20 22:30:59"

    both_country = []
    user_countries = [country, 'Both']
    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=1))
    queryset = Candidates.objects.raw(
        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, cl.company_name AS client_name ,"
        "CONCAT(u1.first_name,' ',u1.last_name) as bdm_name , CONCAT(u2.first_name,' ',u2.last_name) as "
        "recruiter_name , u2.country as location , j.job_title, j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
        "ca.created_at, (SELECT SUM(rc.attempted_calls) FROM recruiter_calls as rc WHERE rc.created_at >= %s AND rc.created_at <= %s AND u2.external_user = rc.recruiter_name ) as attempted_calls FROM "
        "`osms_job_description` as j,`users_user` as u1, users_user as u2 , `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, "
        "`candidates_jobs_stages` as cjs WHERE j.created_by_id = u1.id AND cjs.created_by_id = u2.id AND s.stage_name != 'Candidate Added' AND "
        "j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND u2.country IN %s ORDER BY recruiter_name",
        [start_date, end_date, start_date, end_date, user_countries])
    
    output = []
    submission_output = []
    finalOutput = []
    
    if queryset is not None:
        logger.info(str(queryset.query))
        serializer = RecruiterEmailReportSerializer(queryset, many=True)
        userqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '3' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(userqueryset, many=True)
        recruiter_emails = []
        if isProd:
            for i in range(len(user_serializer.data)):
                recruiter_emails.append(user_serializer.data[i]['email'])
        else:
            recruiter_emails.append('kuriwaln@opallios.com')
            # recruiter_emails.append('mathurp@opallios.com')

        no_submission_user = User.objects.raw(
            "SELECT u.id, u.first_name, (SELECT SUM(rc.attempted_calls) FROM recruiter_calls as rc WHERE "
            "rc.created_at >= %s AND rc.created_at <= %s AND u.external_user = rc.recruiter_name ) as attempted_calls "
            "FROM users_user as u WHERE u.role = 3 AND u.is_active = 1 AND u.country IN %s "
            "AND u.id NOT IN (SELECT cjs.created_by_id FROM `candidates_jobs_stages` as cjs, users_user as u, "
            "`candidates_stages` as s WHERE u.id = cjs.created_by_id AND "
            "cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND u.role = "
            "3 AND cjs.submission_date >= %s and cjs.submission_date <= "
            "%s GROUP BY cjs.created_by_id)", [start_date, end_date, user_countries, start_date, end_date])
        
        no_submission_user_serializer = NoSubmissionSerializer(no_submission_user, many=True)
        logger.info("====================================================: " )
        # logger.info(no_submission_user_serializer.data)
        for i in range(len(no_submission_user_serializer.data)):
            calls = no_submission_user_serializer.data[i]['attempted_calls']
            if calls is None:
                calls = 0
            rows = {
                'first_name': no_submission_user_serializer.data[i]['first_name'],
                'attempted_calls': int(float(calls))
            }
            submission_output.append(rows)

        bdmqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        bdm_serializer = UserSerializer(bdmqueryset, many=True)
        bdm_emails = []
        for i in range(len(bdm_serializer.data)):
            bdm_emails.append(bdm_serializer.data[i]['email'])

        # print(serializer.data)
        for i in range(len(serializer.data)):  # Use `xrange` for python 2.
            rows = {
                'candidate_name': serializer.data[i]['candidate_name'],
                'client_name': serializer.data[i]['client_name'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'location': serializer.data[i]['location'],
                'job_title': serializer.data[i]['job_title'],
                'attempted_calls': serializer.data[i]['attempted_calls'],
                'created_at': (serializer.data[i]['created_at']).split('.')[0],
            }

            output.append(rows)

        df = pd.DataFrame(output)
        if not df.empty:
            grouped = df.groupby('recruiter_name')
            for name, group in grouped:
                group_data = []
                total_calls = 0
                
                for row_index, row in group.iterrows():
                    group_row = {
                        'candidate_name': row['candidate_name'],
                        'client_name': row['client_name'],
                        'min_salary': row['min_salary'],
                        'max_salary': row['max_salary'],
                        'min_rate': row['min_rate'],
                        'max_rate': row['max_rate'],
                        'bdm_name': row['bdm_name'],
                        'location': row['location'],
                        'job_title': row['job_title'],
                        # 'attempted_calls': row['attempted_calls'],
                        'created_at': (row['created_at']).split('.')[0],
                        
                    }
                    group_data.append(group_row)

                    calls = row['attempted_calls']
                    if calls is None:
                        calls = 0
                     
                    total_calls = total_calls + int(float(calls))
                    # logger.info(row['Client_Interview'])

                row = {
                    'name': name,
                    'user_data': group_data,
                    'total_jobs': group['candidate_name'].nunique(),
                    'attempted_calls': total_calls
                }
                finalOutput.append(row)

        message = render_to_string('recruiter_email_report.html', {'data': output, 'no_submission': submission_output})
        # test_email = ['pandeym@cresitatech.com' , 'kuriwaln@opallios.com' , 'agrawalv@cresitatech.com']
        email = EmailMessage(subject="Daily submissions for {0}".format(start_date), body=message,
                             from_email=EMAIL_FROM_USER, to=recruiter_emails)  # recruiter_emails
        email.content_subtype = 'html'
        if isProd:
            email.cc = ['mathurp@opallios.com', 'girish@opallios.com', 'paradkaro@opallios.com',
                        'minglaniy@opallios.com',
                        'kuriwaln@opallios.com'] + bdm_emails + both_country
        email.send()
        print('Email Send Successfully !!!!!!!!')
        
        return str(queryset.query)
        # return render(request, "recruiter_email_report.html", {'data': output, 'no_submission': submission_output})


def send_bdm_email(country='India', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = utils.get_current_date()
    start_date, end_date = utils.get_daily_report_start_and_end_datetime(country)

    both_country = []
    user_countries = [country, 'Both']
    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=1))
    queryset = Candidates.objects.raw(
        "SELECT j.id ,j.job_title , j.job_id , cl.company_name as client_name , CONCAT(u.first_name,' ' ,u.last_name)"
        "as bdm_name,u.country as bdm_location, j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate FROM "
        "osms_job_description as j, osms_clients as cl,users_user as u "
        "WHERE cl.id = j.client_name_id "
        "AND u.id = j.created_by_id AND j.job_posted_date >= %s AND j.job_posted_date <= %s AND u.country IN %s AND "
        "cl.country = %s ORDER BY bdm_name",
        [start_date, end_date, user_countries, country])

    if queryset is not None:
        logger.info(str(queryset.query))
        serializer = BdmJobsReportSerializer(queryset, many=True)
        userqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(userqueryset, many=True)
        bdm_emails = []
        jobs_posted = []
        if isProd:
            for i in range(len(user_serializer.data)):
                bdm_emails.append(user_serializer.data[i]['email'])
        else:
            bdm_emails.append('kuriwaln@opallios.com')
            # bdm_emails.append('mathurp@opallios.com')

        output = []
        for i in range(len(serializer.data)):
            rows = {
                'job_title': serializer.data[i]['job_title'],
                'job_id': serializer.data[i]['job_id'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'bdm_location': serializer.data[i]['bdm_location'],
            }
            output.append(rows)

        no_jobs_posted_user = User.objects.raw(
            "SELECT u.id, u.first_name FROM users_user as u WHERE u.role = 9 AND u.is_active = 1 AND u.country IN %s "
            "AND u.id NOT IN (SELECT u.id FROM osms_job_description as j, osms_clients as cl,users_user as u WHERE "
            "cl.id = j.client_name_id AND u.id = j.created_by_id AND j.job_posted_date >= %s AND j.job_posted_date <= "
            "%s AND u.country IN %s AND cl.country = %s )",
            [user_countries, start_date, end_date, user_countries, country])

        logger.info('Query No', no_jobs_posted_user.query)

        no_submission_user_serializer = UserReportSerializer(no_jobs_posted_user, many=True)
        logger.info(no_submission_user_serializer.data)
        for i in range(len(no_submission_user_serializer.data)):
            logger.info(no_submission_user_serializer.data[i]['first_name'])
            jobs_posted.append(no_submission_user_serializer.data[i]['first_name'])

        message = render_to_string('bdm_email_report.html', {'data': output, 'jobs_posted': jobs_posted})
        email = EmailMessage(subject="Daily Jobs for {0}".format(start_date), body=message,
                             from_email=EMAIL_FROM_USER, to=bdm_emails)  # bdm_emails
        email.content_subtype = 'html'
        if isProd:
            email.cc = ['mathurp@opallios.com', 'girish@opallios.com', 'paradkaro@opallios.com',
                        'minglaniy@opallios.com',
                        'kuriwaln@opallios.com']
        email.send()

        return str(queryset.query)
        # return render(request, "bdm_email_report.html", {'data': output, 'jobs_posted': jobs_posted})


def send_recruiter_summary_report(country='US', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
    start_date, end_date = utils.get_daily_report_start_and_end_datetime(country)

    both_country = []
    user_countries = [country, 'Both']

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))

    """queryset = Candidates.objects.raw(
        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, ca.primary_phone_number,"
        "CONCAT(u2.first_name,' ',u2.last_name) as "
        "recruiter_name , u2.country as location, des.name as position FROM "
        "users_user as u2 , `osms_candidates` "
        "as ca, `candidates_stages` as s, interviewers_designation as des "
        "WHERE ca.created_by_id = u2.id AND s.stage_name = 'Candidate Added' AND "
        "ca.stage_id = s.id AND ca.created_at >= %s AND ca.created_at <= %s AND u2.country IN %s AND ca.designation_id = des.id ORDER BY recruiter_name",
        ['2022-03-22', '2022-03-22 23:59:59', user_countries])"""

    queryset = Candidates.objects.raw(
        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, cl.company_name AS client_name ,ca.primary_email, ca.primary_phone_number,"
        "CONCAT(u1.first_name,' ',u1.last_name) as bdm_name , CONCAT(u2.first_name,' ',u2.last_name) as recruiter_name , u2.country as location , j.job_title, j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, ca.created_at, ca.created_at as attempted_calls FROM"
        "`osms_job_description` as j,`users_user` as u1, users_user as u2 , `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, "
        "`candidates_jobs_stages` as cjs WHERE j.created_by_id = u1.id AND cjs.created_by_id = u2.id AND s.stage_name = 'Candidate Added' AND "
        "j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND u2.country IN %s ORDER BY recruiter_name",
        [start_date, end_date, user_countries])

    output = []
    finalOutput = []
    submission_output = []
    if queryset is not None:
        logger.info('Query: ' + str(queryset.query))
        serializer = RecruiterEmailReportSerializer(queryset, many=True)
        userqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '3' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(userqueryset, many=True)
        recruiter_emails = []
        if isProd:
            for i in range(len(user_serializer.data)):
                recruiter_emails.append(user_serializer.data[i]['email'])
        else:
            recruiter_emails.append('kuriwaln@opallios.com')
            # recruiter_emails.append('mathurp@opallios.com')
        bdmqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        bdm_serializer = UserSerializer(bdmqueryset, many=True)
        bdm_emails = []
        for i in range(len(bdm_serializer.data)):
            bdm_emails.append(bdm_serializer.data[i]['email'])

        for i in range(len(serializer.data)):
            rows = {
                'candidate_name': serializer.data[i]['candidate_name'],
                'primary_email': serializer.data[i]['primary_email'],
                'created_at': serializer.data[i]['created_at'],
                # 'max_salary': serializer.data[i]['max_salary'],
                # 'min_rate': serializer.data[i]['min_rate'],
                # 'max_rate': serializer.data[i]['max_rate'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'job_title': serializer.data[i]['job_title']
            }
            output.append(rows)

        df = pd.DataFrame(output)
        if not df.empty:
            grouped = df.groupby('recruiter_name')
            for name, group in grouped:
                group_data = []
                for row_index, row in group.iterrows():
                    group_row = {
                        'candidate_name': row['candidate_name'],
                        'primary_email': row['primary_email'],
                        'primary_phone_number': row['primary_phone_number'],
                        'created_at': (row['created_at']).split('.')[0],
                        # 'max_salary': row['max_salary'],
                        # 'min_rate': row['min_rate'],
                        # 'max_rate': row['max_rate'],
                        'recruiter_name': row['recruiter_name'],
                        'job_title': row['job_title']
                    }
                    group_data.append(group_row)

                row = {
                    'name': name,
                    'user_data': group_data,
                    'total_candidate': group['candidate_name'].nunique()
                }
                finalOutput.append(row)

        no_submission_user = User.objects.raw(
            "SELECT u.id, u.first_name FROM users_user as u WHERE u.role = 3 AND u.is_active = 1 AND u.country IN %s AND u.id NOT IN (SELECT DISTINCT(cjs.created_by_id) as created_by_id FROM`osms_job_description` as j,`users_user` as u1, users_user as u2 , `osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id = u1.id AND ca.created_by_id = u2.id AND s.stage_name = 'Candidate Added' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND u2.country IN %s ORDER BY cjs.created_by_id )",
            [user_countries, start_date, end_date, user_countries])

        logger.info('Query No', no_submission_user.query)

        no_submission_user_serializer = UserReportSerializer(no_submission_user, many=True)
        logger.info("====================================================")
        logger.info(no_submission_user_serializer.data)
        for i in range(len(no_submission_user_serializer.data)):
            logger.info(no_submission_user_serializer.data[i]['first_name'])

            submission_output.append(no_submission_user_serializer.data[i]['first_name'])

        logger.info(submission_output)

        message = render_to_string('recruiter_summary_report.html',
                                   {'data': finalOutput, 'no_submission': submission_output})
        email = EmailMessage(
            subject="Summary of Candidates Added By Recruiter: {0} to {1}".format(str(start_date).split(' ')[0],
                                                                                  str(today_date).split(' ')[0]),
            body=message,
            from_email=EMAIL_FROM_USER, to=recruiter_emails)
        email.content_subtype = 'html'
        if isProd:
            email.cc = ['mathurp@opallios.com', 'girish@opallios.com', 'paradkaro@opallios.com',
                        'minglaniy@opallios.com',
                        'kuriwaln@opallios.com', 'ats@opallios.com'] + bdm_emails + both_country
        email.send()
        print('Email Send Successfully !!!!!!!!')

        # return render(request, "recruiter_summary_report.html", {'data': finalOutput, 'df': str(queryset.query)})
        return str(queryset.query)


def bdm_daily_submission_report(country='India', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
    start_date, end_date = utils.get_daily_report_start_and_end_datetime(country)

    both_country = []
    user_countries = [country, 'Both']

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))

    queryset = Candidates.objects.raw(
        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, ca.primary_email, "
        "ca.total_experience, ca.primary_phone_number, ca.resume, cl.company_name AS client_name , "
        "CONCAT(u1.first_name,' ',u1.last_name) as bdm_name , CONCAT(u2.first_name,' ',u2.last_name) as "
        "recruiter_name , u2.country as location , j.job_title, cjs.submission_date, j.min_salary ,j.max_salary ,"
        "j.min_rate ,j.max_rate, ca.created_at, s.stage_name, cjs.updated_at, j.employment_type as "
        "job_type, j.location, j.created_by_id  FROM "
        "`osms_job_description` as j,`users_user` as u1, users_user as u2 , `osms_clients` as cl, `osms_candidates` "
        "as ca, `candidates_stages` as s, "
        "`candidates_jobs_stages` as cjs WHERE j.created_by_id = u1.id AND ca.created_by_id = u2.id AND s.stage_name "
        "= 'Submission' AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND "
        "ca.id = "
        "cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND u2.country IN %s ORDER "
        "BY recruiter_name, cjs.submission_date",
        [start_date, end_date, user_countries])
    output = []
    finalOutput = []
    summaryOutput = []
    submission_output = []
    bdm_name = ""
    resumeList = []
    if queryset is not None:
        logger.info("bdm_daily_submission_report: " + str(queryset.query))
        serializer = BdmDailySubmissionReportSerializer(queryset, many=True)
        userqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '3' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(userqueryset, many=True)
        recruiter_emails = []
        if isProd:
            for i in range(len(user_serializer.data)):
                recruiter_emails.append(user_serializer.data[i]['email'])
        else:
            recruiter_emails.append('kuriwaln@opallios.com')
            # recruiter_emails.append('minglaniy@opallios.com')

        for i in range(len(serializer.data)):
            rows = {
                'submission_date': str(serializer.data[i]['submission_date']),  # .split('.')[0]
                'candidate_name': serializer.data[i]['candidate_name'],
                'client_name': serializer.data[i]['client_name'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'created_at': serializer.data[i]['created_at'],
                'job_title': serializer.data[i]['job_title'],
                'job_type': serializer.data[i]['job_type'],
                'total_experience': serializer.data[i]['total_experience'],
                'primary_email': serializer.data[i]['primary_email'],
                'primary_phone_number': serializer.data[i]['primary_phone_number'],
                'location': serializer.data[i]['location'],
                'updated_at': serializer.data[i]['updated_at'],
                'stage_name': serializer.data[i]['stage_name'],
                'created_by_id': serializer.data[i]['created_by_id'],
                'resume': serializer.data[i]['resume']
            }
            output.append(rows)

        df = pd.DataFrame(output)

        if not df.empty:
            grouped = df.groupby('bdm_name')
            for name, group in grouped:
                group_data = []
                bdmEmail = ""
                for row_index, row in group.iterrows():
                    date_format = "%Y-%m-%d"
                    updated_at = (row['updated_at']).split(' ')[0]
                    now = dt.now()  # current date and time
                    today = now.strftime("%Y-%m-%d")

                    b = dt.strptime(today, date_format)
                    a = dt.strptime(updated_at, date_format)
                    delta = b - a
                    total_days = delta.days

                    resume = row['resume']
                    logger.info("Path: " + str(os.path.join(BASE_DIR, 'media', resume)))
                    file_path = os.path.join(BASE_DIR, 'media', resume)
                    if resume != None and resume != '':
                        if os.path.isfile(file_path):
                            dicData = {"name": row['bdm_name'], "resume": os.path.join(BASE_DIR, 'media', resume)}
                            resumeList.append(dicData)

                    group_row = {
                        'submission_date': str(row['submission_date']).split(' ')[0],
                        'candidate_name': row['candidate_name'],
                        'client_name': row['client_name'],
                        'bdm_name': row['bdm_name'],
                        'min_salary': row['min_salary'],
                        'max_salary': row['max_salary'],
                        'min_rate': row['min_rate'],
                        'max_rate': row['max_rate'],
                        'recruiter_name': row['recruiter_name'],
                        'created_at': row['created_at'],
                        'job_title': row['job_title'],
                        'job_type': row['job_type'],
                        'total_experience': row['total_experience'],
                        'primary_email': row['primary_email'],
                        'primary_phone_number': row['primary_phone_number'],
                        'location': row['location'],
                        'updated_at': updated_at,
                        'stage_name': row['stage_name'],
                        'resume': row['resume'],
                        'created_by_id': row['created_by_id'],
                        'today': today,
                        'total_days': total_days
                    }
                    group_data.append(group_row)

                bdmSubmissions = {
                    'name': name,
                    'user_data': group_data,
                    'total_jobs': group['job_title'].nunique(),
                    'total_client': group['candidate_name'].count()
                }
                finalOutput.append(bdmSubmissions)

        bdmqueryset = User.objects.raw(
            "SELECT id, email, country, first_name, last_name  from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        bdm_serializer = UserSerializer(bdmqueryset, many=True)

        for i in range(len(bdm_serializer.data)):
            bdm_name = bdm_serializer.data[i]['first_name'] + ' ' + bdm_serializer.data[i]['last_name']
            bdmEmail = bdm_serializer.data[i]['email']
            logger.info("bdmEmail: " + str(bdmEmail))
            logger.info("bdm_name: " + str(bdm_name))
            # [[filteredOutput for in output.name == bdm_name] for output in finalOutput]
            # filteredOutput = filter(lambda name: name == bdm_name, finalOutput)
            filteredOutput = []
            for output in finalOutput:
                if output.get('name') == bdm_name:
                    filteredOutput.append(output)

            message = render_to_string('bdm_daily_submission_report.html',
                                       {'data': filteredOutput[0] if len(filteredOutput) > 0 else filteredOutput,
                                        'bdmName': bdm_name})
            subject = "{0} - {1} Submissions today: ".format(str(start_date).split(' ')[0],
                                                             str(bdm_name).split(' ')[0])
            logger.info("subject: " + str(subject))

            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=EMAIL_FROM_USER, to=[bdmEmail])
            email.content_subtype = 'html'

            # [email.attach_file(resume) for resume in resumeList]
            for item in resumeList:
                if item.get('name') == bdm_name:
                    email.attach_file(item.get('resume'))

            if isProd:
                email.cc = ['paradkaro@opallios.com', 'minglaniy@opallios.com', 'kuriwaln@opallios.com',
                            'mathurp@opallios.com']
            email.send()
            logger.info('Email Send Successfully !!!!!!!!')

        # return render(request, "bdm_daily_submission_report.html", {'data': finalOutput[0] if len(finalOutput) > 0 else finalOutput , 'bdmName': bdm_name})
        return str(queryset.query)


class BdmActiveJobSummaryTable(generics.ListAPIView):
    queryset = jobModel.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, ]

    def get(self, request, format=None):
        today_date = utils.get_current_datetime()
        # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
        country = "India"
        user_countries = [country, 'Both']
        start_date, end_date = utils.get_daily_report_start_and_end_datetime(country)

        queryset = Candidates.objects.raw(
            "SELECT * FROM (SELECT j.id ,j.job_title , j.job_id as custom_job_id , cl.company_name "
            "as client_name , CONCAT(u.first_name,' ' ,u.last_name)as bdm_name, u.country as bdm_location, "
            "j.job_posted_date FROM osms_job_description as j, osms_clients as cl,users_user as u WHERE "
            "cl.id = j.client_name_id AND u.id = j.created_by_id AND u.country IN "
            "%s AND cl.country = %s AND j.status = 'Active' AND u.is_active = '1' AND u.role = '9' ORDER BY client_name, j.job_posted_date DESC ) AS  A "
            "INNER JOIN (select j.id as job_id , "
            "sum(case when (s.stage_name = 'Submission' OR s.stage_name = 'Submission Reject' OR s.stage_name = 'Internal "
            "Interview' OR s.stage_name = 'Internal Interview Reject' OR s.stage_name = 'Candidate Review' OR "
            "s.stage_name = 'SendOut' OR s.stage_name = 'SendOut Reject' OR s.stage_name = 'Client Interview First' OR "
            "s.stage_name = 'Interview Backout Interview Reject' OR s.stage_name = 'Interview Select' OR s.stage_name = "
            "'Client Interview - Second' OR s.stage_name = 'Second Interview Reject' OR s.stage_name = 'Offerred' OR "
            "s.stage_name = 'Offer Reject' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Feedback Awaited' OR "
            "s.stage_name = 'Hold by BDM' OR s.stage_name = 'Hold by Client' OR s.stage_name = 'Placed' OR s.stage_name = "
            "'Interview Reject') then 1 else 0 end) as Submission , "
            "sum(case when (s.stage_name = 'Submission Reject') then 1 else 0 end) as 'Rejected_By_Team' , "
            "sum(case when (s.stage_name = 'SendOut' OR s.stage_name = 'SendOut Reject' OR s.stage_name = 'Client "
            "Interview - First' OR s.stage_name = 'Interview Backout' OR s.stage_name = 'Interview Reject' OR s.stage_name = 'Interview "
            "Select' OR s.stage_name = 'Client Interview - Second' OR s.stage_name = 'Second Interview Reject' OR "
            "s.stage_name = 'Offerred' OR s.stage_name = 'Offer Reject' OR s.stage_name = 'Offer Backout' OR s.stage_name "
            "= 'Feedback Awaited' OR s.stage_name = 'Hold by Client' OR s.stage_name = 'Placed' ) then 1 else 0 end) as "
            "'SendOut', "
            "sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , "
            "sum(case when (s.stage_name = 'Client Interview - First' OR s.stage_name = 'Interview Backout' OR "
            "s.stage_name = 'Interview Reject' OR s.stage_name = 'Interview Select' OR s.stage_name = 'Client Interview - "
            "Second' OR s.stage_name = 'Second Interview Reject' OR s.stage_name = 'Offerred' OR s.stage_name = 'Offer "
            "Reject' OR s.stage_name = "
            "'Offer Backout' OR s.stage_name = 'Feedback Awaited' OR s.stage_name = 'Hold by Client' OR s.stage_name = "
            "'Placed' ) then 1 else 0 end) as Client_Interview, "
            "sum(case when s.stage_name = 'Interview Reject' then 1 else 0 end) as 'Rejected_By_Client' ,"
            "sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,"
            "sum(case when s.stage_name = 'Interview Select' then 1 else 0 end) as 'Shortlisted' , "
            "sum(case when (s.stage_name = 'Offerred' OR s.stage_name = 'Offer Reject' OR s.stage_name = 'Offer Backout') "
            "then 1 else 0 end) as Offered , "
            "sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
            "sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' "
            "from `osms_job_description` as j , "
            "`osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  "
            "WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id "
            "GROUP BY j.id ) AS B ON A.id = B.job_id AND B.job_id IS NOT NULL ORDER BY A.client_name, A.job_title",
            [user_countries, country])

        if queryset is not None:
            logger.info(str(queryset.query))
            serializer = BdmDailyJobsSummaryReportSerializer(queryset, many=True)

            output = []
            finalOutput = []
            for i in range(len(serializer.data)):
                rows = {
                    'job_posted_date': serializer.data[i]['job_posted_date'],
                    'job_title': serializer.data[i]['job_title'],
                    'client_name': serializer.data[i]['client_name'],
                    'bdm_name': serializer.data[i]['bdm_name'],
                    'Submission': serializer.data[i]['Submission'],
                    'Rejected_By_Team': serializer.data[i]['Rejected_By_Team'],
                    'SendOut': serializer.data[i]['SendOut'],
                    'Sendout_Reject': serializer.data[i]['Sendout_Reject'],
                    'Client_Interview': serializer.data[i]['Client_Interview'],
                    'Rejected_By_Client': serializer.data[i]['Rejected_By_Client'],
                    'Shortlisted': serializer.data[i]['Shortlisted'],
                    'Offered': serializer.data[i]['Offered'],
                    'Placed': serializer.data[i]['Placed'],
                    'Submission_Reject': serializer.data[i]['Submission_Reject']
                }
                output.append(rows)

            df = pd.DataFrame(output)
            if not df.empty:
                grouped = df.groupby('bdm_name')
                for name, group in grouped:
                    group_data = []
                    total_submission = 0
                    total_Rejected_By_Team = 0
                    total_send_out = 0
                    total_sendout_reject = 0
                    total_client_interview = 0
                    total_Rejected_By_Client = 0
                    total_shortlisted = 0
                    total_offered = 0
                    total_placed = 0
                    total_Submission_Reject = 0

                    for row_index, row in group.iterrows():
                        group_row = {
                            'job_posted_date': str(row['job_posted_date']).split(' ')[0],
                            'job_title': row['job_title'],
                            'client_name': row['client_name'],
                            'bdm_name': row['bdm_name'],
                            'submission': row['Submission'],
                            'Rejected_By_Team': row['Rejected_By_Team'],
                            'send_out': row['SendOut'],
                            'sendout_reject': row['Sendout_Reject'],
                            'client_interview': int(row['Client_Interview']),
                            'Rejected_By_Client': row['Rejected_By_Client'],
                            'shortlisted': row['Shortlisted'],
                            'offered': row['Offered'],
                            'placed': row['Placed'],
                            'Submission_Reject': row['Submission_Reject']
                        }
                        group_data.append(group_row)
                        # logger.info(row['Client_Interview'])

                        total_submission = total_submission + int(row['Submission'])
                        total_Rejected_By_Team = total_Rejected_By_Team + int(row['Rejected_By_Team'])
                        total_send_out = total_send_out + int(row['SendOut'])
                        total_sendout_reject = total_sendout_reject + int(row['Sendout_Reject'])
                        total_client_interview = total_client_interview + int(row['Client_Interview'])
                        total_Rejected_By_Client = total_Rejected_By_Client + int(row['Rejected_By_Client'])
                        total_shortlisted = total_shortlisted + int(row['Shortlisted'])
                        total_offered = total_offered + int(row['Offered'])
                        total_placed = total_placed + int(row['Placed'])
                        total_Submission_Reject = total_Submission_Reject + int(row['Submission_Reject'])

                    row = {
                        'name': name,
                        'user_data': group_data,
                        'total_jobs': group['job_title'].nunique(),
                        'total_client': (group['client_name'].str.lower()).nunique(),

                        'total_submission': total_submission,
                        'total_Rejected_By_Team': total_Rejected_By_Team,
                        'total_send_out': total_send_out,
                        'total_sendout_reject': total_sendout_reject,
                        'total_client_interview': total_client_interview,
                        'total_Rejected_By_Client': total_Rejected_By_Client,

                        'total_shortlisted': total_shortlisted,
                        'total_offered': total_offered,
                        'total_placed': total_placed,

                        'total_Submission_Reject': total_Submission_Reject,
                    }
                    finalOutput.append(row)

            return Response(finalOutput)


def send_daily_bdm_jobs_summary(country='India', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
    start_date, end_date = utils.get_daily_report_start_and_end_datetime(country)
    # start_date = "2022-11-01 00:00:00"
    # end_date = "2022-11-23 23:59:59"

    both_country = []
    user_countries = [country, 'Both']
    jobs_posted = []

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))
    queryset = Candidates.objects.raw(
        "SELECT * FROM (SELECT j.id ,j.job_title , j.job_id as custom_job_id , cl.company_name "
        "as client_name , CONCAT(u.first_name,' ' ,u.last_name)as bdm_name, u.country as bdm_location, "
        "j.job_posted_date FROM osms_job_description as j, osms_clients as cl,users_user as u WHERE "
        "cl.id = j.client_name_id AND u.id = j.created_by_id AND u.country IN "
        "%s AND cl.country = %s AND j.status = 'Active' AND u.is_active = '1' AND u.role = '9' ORDER BY client_name, j.job_posted_date DESC ) AS  A "
        "INNER JOIN (select j.id as job_id , "
        "sum(case when (s.stage_name = 'Submission' OR s.stage_name = 'Submission Reject' OR s.stage_name = 'Internal "
        "Interview' OR s.stage_name = 'Internal Interview Reject' OR s.stage_name = 'Candidate Review' OR "
        "s.stage_name = 'SendOut' OR s.stage_name = 'SendOut Reject' OR s.stage_name = 'Client Interview First' OR "
        "s.stage_name = 'Interview Backout Interview Reject' OR s.stage_name = 'Interview Select' OR s.stage_name = "
        "'Client Interview - Second' OR s.stage_name = 'Second Interview Reject' OR s.stage_name = 'Offerred' OR "
        "s.stage_name = 'Offer Reject' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Feedback Awaited' OR "
        "s.stage_name = 'Hold by BDM' OR s.stage_name = 'Hold by Client' OR s.stage_name = 'Placed' OR s.stage_name = "
        "'Interview Reject') then 1 else 0 end) as Submission , "
        "sum(case when (s.stage_name = 'Submission Reject') then 1 else 0 end) as 'Rejected_By_Team' , "
        "sum(case when (s.stage_name = 'SendOut' OR s.stage_name = 'SendOut Reject' OR s.stage_name = 'Client "
        "Interview - First' OR s.stage_name = 'Interview Backout' OR s.stage_name = 'Interview Reject' OR s.stage_name = 'Interview "
        "Select' OR s.stage_name = 'Client Interview - Second' OR s.stage_name = 'Second Interview Reject' OR "
        "s.stage_name = 'Offerred' OR s.stage_name = 'Offer Reject' OR s.stage_name = 'Offer Backout' OR s.stage_name "
        "= 'Feedback Awaited' OR s.stage_name = 'Hold by Client' OR s.stage_name = 'Placed' ) then 1 else 0 end) as "
        "'SendOut', "
        "sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , "
        "sum(case when (s.stage_name = 'Client Interview - First' OR s.stage_name = 'Interview Backout' OR "
        "s.stage_name = 'Interview Reject' OR s.stage_name = 'Interview Select' OR s.stage_name = 'Client Interview - "
        "Second' OR s.stage_name = 'Second Interview Reject' OR s.stage_name = 'Offerred' OR s.stage_name = 'Offer "
        "Reject' OR s.stage_name = "
        "'Offer Backout' OR s.stage_name = 'Feedback Awaited' OR s.stage_name = 'Hold by Client' OR s.stage_name = "
        "'Placed' ) then 1 else 0 end) as Client_Interview, "
        "sum(case when s.stage_name = 'Interview Reject' then 1 else 0 end) as 'Rejected_By_Client' ,"
        "sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,"
        "sum(case when s.stage_name = 'Interview Select' then 1 else 0 end) as 'Shortlisted' , "
        "sum(case when (s.stage_name = 'Offerred' OR s.stage_name = 'Offer Reject' OR s.stage_name = 'Offer Backout') "
        "then 1 else 0 end) as Offered , "
        "sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
        "sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' "
        "from `osms_job_description` as j , "
        "`osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  "
        "WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id "
        "GROUP BY j.id ) AS B ON A.id = B.job_id AND B.job_id IS NOT NULL ORDER BY A.client_name, A.job_title",
        [user_countries, country])

    if queryset is not None:
        logger.info(str(queryset.query))
        serializer = BdmDailyJobsSummaryReportSerializer(queryset, many=True)
        # userqueryset = User.objects.raw(
        #    "SELECT id, email, country from users_user where role = '9' AND country = %s", [country])
        bdmqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(bdmqueryset, many=True)
        bdm_emails = []
        if isProd:
            for i in range(len(user_serializer.data)):
                bdm_emails.append(user_serializer.data[i]['email'])
        else:
            bdm_emails.append('kuriwaln@opallios.com')

        output = []
        finalOutput = []
        for i in range(len(serializer.data)):
            rows = {
                'job_posted_date': serializer.data[i]['job_posted_date'],
                'job_title': serializer.data[i]['job_title'],

                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],

                'Submission': serializer.data[i]['Submission'],
                'Rejected_By_Team': serializer.data[i]['Rejected_By_Team'],
                'SendOut': serializer.data[i]['SendOut'],
                'Sendout_Reject': serializer.data[i]['Sendout_Reject'],
                'Client_Interview': serializer.data[i]['Client_Interview'],
                'Rejected_By_Client': serializer.data[i]['Rejected_By_Client'],
                'Shortlisted': serializer.data[i]['Shortlisted'],
                'Offered': serializer.data[i]['Offered'],
                'Placed': serializer.data[i]['Placed'],
                'Submission_Reject': serializer.data[i]['Submission_Reject']
            }
            output.append(rows)

        df = pd.DataFrame(output)
        if not df.empty:
            grouped = df.groupby('bdm_name')
            for name, group in grouped:
                group_data = []
                total_submission = 0
                total_Rejected_By_Team = 0
                total_send_out = 0
                total_sendout_reject = 0
                total_client_interview = 0
                total_Rejected_By_Client = 0
                total_shortlisted = 0
                total_offered = 0
                total_placed = 0
                total_Submission_Reject = 0

                for row_index, row in group.iterrows():
                    group_row = {
                        'job_posted_date': str(row['job_posted_date']).split(' ')[0],
                        'job_title': row['job_title'],
                        'client_name': row['client_name'],
                        'bdm_name': row['bdm_name'],

                        'submission': row['Submission'],
                        'Rejected_By_Team': row['Rejected_By_Team'],
                        'send_out': row['SendOut'],
                        'sendout_reject': row['Sendout_Reject'],
                        'client_interview': int(row['Client_Interview']),
                        'Rejected_By_Client': row['Rejected_By_Client'],
                        'shortlisted': row['Shortlisted'],
                        'offered': row['Offered'],
                        'placed': row['Placed'],
                        'Submission_Reject': row['Submission_Reject']
                    }
                    group_data.append(group_row)
                    # logger.info(row['Client_Interview'])

                    total_submission = total_submission + int(row['Submission'])
                    total_Rejected_By_Team = total_Rejected_By_Team + int(row['Rejected_By_Team'])
                    total_send_out = total_send_out + int(row['SendOut'])
                    total_sendout_reject = total_sendout_reject + int(row['Sendout_Reject'])
                    total_client_interview = total_client_interview + int(row['Client_Interview'])
                    total_Rejected_By_Client = total_Rejected_By_Client + int(row['Rejected_By_Client'])
                    total_shortlisted = total_shortlisted + int(row['Shortlisted'])
                    total_offered = total_offered + int(row['Offered'])
                    total_placed = total_placed + int(row['Placed'])
                    total_Submission_Reject = total_Submission_Reject + int(row['Submission_Reject'])

                row = {
                    'name': name,
                    'user_data': group_data,
                    'total_jobs': group['job_title'].nunique(),
                    'total_client': (group['client_name'].str.lower()).nunique(),

                    'total_submission': total_submission,
                    'total_Rejected_By_Team': total_Rejected_By_Team,
                    'total_send_out': total_send_out,
                    'total_sendout_reject': total_sendout_reject,
                    'total_client_interview': total_client_interview,
                    'total_Rejected_By_Client': total_Rejected_By_Client,

                    'total_shortlisted': total_shortlisted,
                    'total_offered': total_offered,
                    'total_placed': total_placed,

                    'total_Submission_Reject': total_Submission_Reject,
                }
                finalOutput.append(row)

        no_jobs_posted_user = User.objects.raw(
            "SELECT u.id, u.first_name FROM users_user as u WHERE u.role = 9 AND u.is_active = 1 AND u.country IN %s "
            "AND u.id NOT IN (SELECT u.id FROM osms_job_description as j, osms_clients as cl,users_user as u WHERE "
            "cl.id = j.client_name_id AND u.id = j.created_by_id AND j.job_posted_date >= %s AND j.job_posted_date <= "
            "%s AND u.country IN %s AND cl.country = %s )",
            [user_countries, start_date, end_date, user_countries, country])

        logger.info('Query No', no_jobs_posted_user.query)

        no_submission_user_serializer = UserReportSerializer(no_jobs_posted_user, many=True)
        logger.info(no_submission_user_serializer.data)
        for i in range(len(no_submission_user_serializer.data)):
            logger.info(no_submission_user_serializer.data[i]['first_name'])
            jobs_posted.append(no_submission_user_serializer.data[i]['first_name'])

        message = render_to_string('bdm_daily_jobs_summary_report.html',
                                   {'data': finalOutput, 'jobs_posted': jobs_posted})
        email = EmailMessage(
            subject="BDMs Daily Active Jobs Vs Submission Details: {0} ".format(str(start_date).split(' ')[0]),
            body=message,
            from_email=EMAIL_FROM_USER, to=['kuriwaln@opallios.com'])
        email.content_subtype = 'html'

        """"        if isProd:
            email.cc = ['vibhuti@opallioslabs.com', 'girish@opallios.com', 'paradkaro@opallios.com',
                        'minglaniy@opallios.com',
                        'kuriwaln@opallios.com']
        else:
            email.cc = ['mathurp@opallios.com']"""

        email.cc = ['mathurp@opallios.com']
        email.send()
        logger.info('Email Send Successfully !!!!!!!!')
        # return render(request, "bdm_daily_jobs_summary_report.html",
        #              {'data': finalOutput, 'df': str(queryset.query), 'jobs_posted': jobs_posted})
        return str(queryset.query)


# weekly mail sending method
def send_weeklly_recuiter_performance_report(country='India', isProd=False):
    week_start, week_end = utils.week_date_range()
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
    start_date, end_date = utils.get_weekly_report_start_and_end_datetime(country)

    both_country = []
    user_countries = [country, 'Both']

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))

    queryset = Candidates.objects.raw(
        "SELECT * FROM (SELECT j.id ,j.job_id as Job_ID, j.job_title as job_title, cl.company_name AS client_name,j.employment_type,j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
        "CONCAT(u.first_name,' ',u.last_name) as bdm_name, j.created_at AS job_date, cl.country FROM `osms_job_description` as j RIGHT JOIN `users_user` as u on j.created_by_id = u.id AND u.country IN %s RIGHT JOIN `osms_clients` as cl on j.client_name_id = cl.id AND cl.country = %s WHERE j.created_at >= %s AND j.created_at <= %s ORDER BY bdm_name ) AS "
        " A LEFT JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission ,"
        " sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' ,sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,sum(case when s.stage_name = 'Shortlisted'"
        " then 1 else 0 end) as 'Shortlisted' , sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
        "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j ,"
        " `osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id GROUP BY j.id ) AS B ON A.id = B.job_id order by A.bdm_name, A.job_date DESC ",
        [user_countries, country, start_date, end_date])

    if queryset is not None:
        logger.info('Recruiter Perf Table QuerySet Query formed: ' + str(queryset.query))
        print(str(queryset.query))

    # userqueryset = User.objects.raw("SELECT id, email, country from users_user where role = '3' AND country = %s",
    #                                [country])

    userqueryset = User.objects.raw(
        "SELECT id, email, country from users_user where role = '3' AND is_active = '1' AND country IN %s",
        [user_countries])
    user_serializer = UserSerializer(userqueryset, many=True)
    recruiter_emails = []
    for i in range(len(user_serializer.data)):
        recruiter_emails.append(user_serializer.data[i]['email'])

    bdmqueryset = User.objects.raw(
        "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
        [user_countries])
    bdm_serializer = UserSerializer(bdmqueryset, many=True)
    bdm_emails = []
    for i in range(len(bdm_serializer.data)):
        bdm_emails.append(bdm_serializer.data[i]['email'])

    # queryset = self.filter_queryset(queryset)
    serializer = JobSummaryTableSerializer(queryset, many=True)
    # print(serializer.data['first_name'])
    array_length = len(serializer.data)
    outputs = []
    for i in range(array_length):
        rows = {
            'id': serializer.data[i]['id'],
            'job_title': serializer.data[i]['job_title'],
            'job_id': serializer.data[i]['Job_ID'],
            'client_name': serializer.data[i]['client_name'],
            'bdm_name': serializer.data[i]['bdm_name'],
            'job_type': serializer.data[i]['employment_type'],
            'min_salary': serializer.data[i]['min_salary'],
            'max_salary': serializer.data[i]['max_salary'],
            'min_rate': serializer.data[i]['min_rate'],
            'max_rate': serializer.data[i]['max_rate'],
            'job_date': serializer.data[i]['job_date'].split(' ')[0],
            'client_interview': serializer.data[i]['Client_Interview'],
            'offered': serializer.data[i]['Offered'],
            'submission': serializer.data[i]['Submission'],
            'rejected_by_team': serializer.data[i]['Rejected_By_Team'],
            'sendout_reject': serializer.data[i]['Sendout_Reject'],
            'offer_rejected': serializer.data[i]['Offer_Rejected'],
            'shortlisted': serializer.data[i]['Shortlisted'],
            'internal_interview': serializer.data[i]['Internal_Interview'],
            'awaiting_feedback': serializer.data[i]['Awaiting_Feedback'],
            'placed': serializer.data[i]['Placed'],
            'rejected_by_client': serializer.data[i]['Rejected_By_Client'],
            'submission_reject': serializer.data[i]['Submission_Reject'],
            'send_out': serializer.data[i]['SendOut'],
        }

        outputs.append(rows)

    if isProd:
        send_to = ['mathurp@opallios.com', 'girish@opallios.com', 'paradkaro@opallios.com',
                   'minglaniy@opallios.com', 'kuriwaln@opallios.com'] + bdm_emails
    else:
        send_to = ['mathurp@opallios.com', 'kuriwaln@opallios.com']

    message = render_to_string('recruiter_performance_weekly_report.html', {'data': outputs})
    email = EmailMessage(subject="Weekly Jobs by BDMs: {0} to {1}".format(str(start_date).split(' ')[0],
                                                                          str(today_date).split(' ')[0]),
                         body=message, from_email=EMAIL_FROM_USER,
                         to=send_to)
    email.content_subtype = 'html'
    if isProd:
        email.cc = recruiter_emails
    email.send()

    return str(queryset.query)
    # return render(request, "recruiter_performance_weekly_report.html", {'data': outputs, 'df': str(queryset.query)})


def send_weekly_recruiter_submission(country='India', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
    start_date, end_date = utils.get_weekly_report_start_and_end_datetime(country)
    # start_date = "2022-09-10 06:30:00"
    # end_date = "2022-09-18 06:30:59"

    both_country = []
    user_countries = [country, 'Both']

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))

    queryset = Candidates.objects.raw(
        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, cl.company_name AS client_name ,"
        "CONCAT(u1.first_name,' ',u1.last_name) as bdm_name , CONCAT(u2.first_name,' ',u2.last_name) as "
        "recruiter_name , u2.country as location , j.job_title, cjs.submission_date, j.min_salary ,j.max_salary ,"
        "j.min_rate ,j.max_rate, ca.created_at, s.stage_name  FROM "
        "`osms_job_description` as j,`users_user` as u1, users_user as u2 , `osms_clients` as cl, `osms_candidates` "
        "as ca, `candidates_stages` as s, "
        "`candidates_jobs_stages` as cjs WHERE j.created_by_id = u1.id AND cjs.created_by_id = u2.id AND s.stage_name "
        "!= 'Candidate Added' AND "
        "j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = "
        "cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND u2.country IN %s ORDER "
        "BY recruiter_name, cjs.submission_date DESC",
        [start_date, end_date, user_countries])
    output = []
    finalOutput = []
    submission_output = []
    bdm_submission_output = []
    if queryset is not None:
        logger.info(str(queryset.query))
        serializer = RecruiterSubmissionReportSerializer(queryset, many=True)
        userqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '3' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(userqueryset, many=True)
        recruiter_emails = []
        if isProd:
            for i in range(len(user_serializer.data)):
                recruiter_emails.append(user_serializer.data[i]['email'])
        else:
            recruiter_emails.append('kuriwaln@opallios.com')
            recruiter_emails.append('agrawalv@cresitatech.com')

        bdmqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        bdm_serializer = UserSerializer(bdmqueryset, many=True)
        bdm_emails = []
        for i in range(len(bdm_serializer.data)):
            bdm_emails.append(bdm_serializer.data[i]['email'])

        for i in range(len(serializer.data)):
            rows = {
                'submission_date': str(serializer.data[i]['submission_date']),  # .split('.')[0]
                'candidate_name': serializer.data[i]['candidate_name'],
                'client_name': serializer.data[i]['client_name'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'created_at': serializer.data[i]['created_at'],
                'job_title': serializer.data[i]['job_title'],
                'stage_name': serializer.data[i]['stage_name']
            }
            output.append(rows)

        df = pd.DataFrame(output)
        if not df.empty:
            grouped = df.groupby('recruiter_name')
            for name, group in grouped:
                group_data = []
                for row_index, row in group.iterrows():
                    group_row = {
                        'submission_date': str(row['submission_date']).split(' ')[0],
                        'candidate_name': row['candidate_name'],
                        'client_name': row['client_name'],
                        'bdm_name': row['bdm_name'],
                        'min_salary': row['min_salary'],
                        'max_salary': row['max_salary'],
                        'min_rate': row['min_rate'],
                        'max_rate': row['max_rate'],
                        'recruiter_name': row['recruiter_name'],
                        'created_at': row['created_at'],
                        'job_title': row['job_title'],
                        'stage_name': row['stage_name']
                    }

                    group_data.append(group_row)

                row = {
                    'name': name,
                    'user_data': group_data,
                    'total_jobs': group['job_title'].nunique(),
                    'total_client': group['candidate_name'].count()
                }
                finalOutput.append(row)

        no_submission_user = User.objects.raw(
            "SELECT u.id, u.first_name FROM users_user as u WHERE u.role = 3 AND u.is_active = 1 AND u.country = %s "
            "AND u.id NOT IN (SELECT cjs.created_by_id FROM `candidates_jobs_stages` as cjs, users_user as u, "
            "`candidates_stages` as s WHERE u.id = cjs.created_by_id AND "
            "cjs.stage_id = s.id AND s.stage_name != 'Candidate Added' AND u.role = "
            "3 AND cjs.submission_date >= %s and cjs.submission_date <= "
            "%s GROUP BY cjs.created_by_id)", [country, start_date, end_date])

        no_submission_user_serializer = UserSerializer(no_submission_user, many=True)
        logger.info(no_submission_user.query)
        for i in range(len(no_submission_user_serializer.data)):
            submission_output.append(no_submission_user_serializer.data[i]['first_name'])

        bdm_submission = Candidates.objects.raw(
            "SELECT u1.id ,CONCAT(u1.first_name,' ',u1.last_name) as bdm_name, COUNT(s.stage_name) as stage_name FROM "
            "`osms_job_description` as j,`users_user` as u1, `osms_clients` as cl, "
            "`osms_candidates` as ca, `candidates_stages` as s, `candidates_jobs_stages` as cjs WHERE j.created_by_id "
            "= u1.id AND s.stage_name = 'Submission' AND j.client_name_id = cl.id and "
            "j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND "
            "cjs.submission_date >= %s AND cjs.submission_date <= %s AND u1.country IN %s GROUP BY bdm_name ORDER BY "
            "cjs.submission_date", [start_date, end_date, user_countries])

        bdm_submission_serializer = RecruiterSubmissionReportSerializer(bdm_submission, many=True)
        # logger.info(no_submission_user_serializer.data)
        for i in range(len(bdm_submission_serializer.data)):
            rows = {
                'bdm_name': bdm_submission_serializer.data[i]['bdm_name'],
                'stage_name': bdm_submission_serializer.data[i]['stage_name']
            }
            bdm_submission_output.append(rows)

        logger.info(str(bdm_submission.query))
        logger.info("submission_output: " + str(submission_output))
        message = render_to_string('recruiter_weekly_submission_report.html',
                                   {'data': finalOutput, 'bdm_emails': bdm_emails,
                                    'submission_output': submission_output,
                                    'bdm_submission_output': bdm_submission_output})
        email = EmailMessage(subject="Weekly Submission by Recruiter: {0} to {1}".format(str(start_date).split(' ')[0],
                                                                                         str(end_date).split(' ')[0]),
                             body=message,
                             from_email=EMAIL_FROM_USER, to=recruiter_emails)
        email.content_subtype = 'html'
        if isProd:
            email.cc = ['mathurp@opallios.com', 'girish@opallios.com', 'paradkaro@opallios.com',
                        'minglaniy@opallios.com',
                        'kuriwaln@opallios.com'] + bdm_emails + both_country
        else:
            email.cc = ['mathurp@opallios.com']

        email.send()
        logger.info('Email Send Successfully !!!!!!!!')

        # return render(request, "recruiter_weekly_submission_report.html", {'data': finalOutput,'submission_output':submission_output, 'bdm_submission_output': bdm_submission_output})
        return str(queryset.query)


def send_weekly_bdm_jobs(country='India', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
    start_date, end_date = utils.get_weekly_report_start_and_end_datetime(country)
    # start_date = "2022-06-18 00:00:00"
    # end_date = "2022-06-25 23:59:59"

    both_country = []
    user_countries = [country, 'Both']
    jobs_posted = []

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))
    queryset = Candidates.objects.raw(
        "SELECT j.id ,j.job_title , j.job_id , cl.company_name as client_name , CONCAT(u.first_name,' ' ,u.last_name)"
        "as bdm_name,u.country as bdm_location, j.job_posted_date, j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate,"
        " (SELECT GROUP_CONCAT(CONCAT(ca.first_name,' ' ,ca.last_name)) FROM candidates_jobs_stages as "
        "cjs, osms_candidates as ca, candidates_stages as cs WHERE ca.id = cjs.candidate_name_id AND j.id = cjs.job_description_id AND cs.id = cjs.stage_id AND cs.stage_name != 'Candidate Added' ) as "
        "candidates_name, (SELECT GROUP_CONCAT(cjs.submission_date)  FROM candidates_jobs_stages as cjs, "
        "osms_candidates as ca, candidates_stages as cs WHERE ca.id = cjs.candidate_name_id AND j.id = cjs.job_description_id AND cs.id = cjs.stage_id AND cs.stage_name != 'Candidate Added' ) as "
        "submission_dates FROM osms_job_description as j, osms_clients as cl,"
        "users_user as u WHERE cl.id = j.client_name_id "
        "AND u.id = j.created_by_id AND j.job_posted_date >= %s AND j.job_posted_date <= %s AND u.country IN %s AND "
        "cl.country = %s ORDER BY bdm_name, j.job_posted_date DESC ",
        [start_date, end_date, user_countries, country])

    if queryset is not None:
        logger.info(str(queryset.query))
        serializer = BdmEmailReportSerializer(queryset, many=True)
        # userqueryset = User.objects.raw(
        #    "SELECT id, email, country from users_user where role = '9' AND country = %s", [country])
        bdmqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(bdmqueryset, many=True)
        bdm_emails = []
        if isProd:
            for i in range(len(user_serializer.data)):
                bdm_emails.append(user_serializer.data[i]['email'])
        else:
            bdm_emails.append('mathurp@opallios.com')

        output = []
        finalOutput = []
        for i in range(len(serializer.data)):
            rows = {
                'job_posted_date': serializer.data[i]['job_posted_date'],
                'job_title': serializer.data[i]['job_title'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'candidates_name': serializer.data[i]['candidates_name'],
                'submission_dates': serializer.data[i]['submission_dates'],
            }
            output.append(rows)

        df = pd.DataFrame(output)
        if not df.empty:
            grouped = df.groupby('bdm_name')
            for name, group in grouped:
                group_data = []
                for row_index, row in group.iterrows():
                    candidates_name = row['candidates_name']
                    submission_dates = row['submission_dates']
                    candidates = ""
                    if candidates_name is not None:
                        if submission_dates is not None:
                            dates_list = submission_dates.split(",")
                            candidates_list = candidates_name.split(",")
                            if len(dates_list) == len(candidates_list):
                                logger.info(len(dates_list))
                                logger.info(len(candidates_list))
                                for i in range(len(candidates_list)):
                                    candidates = str(candidates) + str(candidates_list[i]) + ' - ' + str(
                                        dates_list[i].split(' ')[0]) + ', '

                    group_row = {
                        'job_posted_date': str(row['job_posted_date']).split(' ')[0],
                        'job_title': row['job_title'],
                        'min_salary': row['min_salary'],
                        'max_salary': row['max_salary'],
                        'min_rate': row['min_rate'],
                        'max_rate': row['max_rate'],
                        'client_name': row['client_name'],
                        'bdm_name': row['bdm_name'],
                        'candidates_name': candidates,
                    }
                    group_data.append(group_row)

                row = {
                    'name': name,
                    'user_data': group_data,
                    'total_jobs': group['job_title'].nunique(),
                    'total_client': (group['client_name'].str.lower()).nunique()
                }
                finalOutput.append(row)

        no_jobs_posted_user = User.objects.raw(
            "SELECT u.id, u.first_name FROM users_user as u WHERE u.role = 9 AND u.is_active = 1 AND u.country IN %s "
            "AND u.id NOT IN (SELECT u.id FROM osms_job_description as j, osms_clients as cl,users_user as u WHERE "
            "cl.id = j.client_name_id AND u.id = j.created_by_id AND j.job_posted_date >= %s AND j.job_posted_date <= "
            "%s AND u.country IN %s AND cl.country = %s )",
            [user_countries, start_date, end_date, user_countries, country])

        logger.info('Query No', no_jobs_posted_user.query)

        no_submission_user_serializer = UserReportSerializer(no_jobs_posted_user, many=True)
        logger.info(no_submission_user_serializer.data)
        for i in range(len(no_submission_user_serializer.data)):
            logger.info(no_submission_user_serializer.data[i]['first_name'])
            jobs_posted.append(no_submission_user_serializer.data[i]['first_name'])

        message = render_to_string('bdm_weekly_jobs_report.html', {'data': finalOutput, 'jobs_posted': jobs_posted})
        email = EmailMessage(subject="Weekly Jobs Posted by BDMs: {0} to {1}".format(str(start_date).split(' ')[0],
                                                                                     str(end_date).split(' ')[0]),
                             body=message,
                             from_email=EMAIL_FROM_USER, to=bdm_emails)
        email.content_subtype = 'html'
        if isProd:
            email.cc = ['mathurp@opallios.com', 'girish@opallios.com', 'paradkaro@opallios.com',
                        'minglaniy@opallios.com',
                        'kuriwaln@opallios.com'] + bdm_emails + both_country
        else:
            email.cc = ['agrawalv@cresitatech.com', 'kuriwaln@opallios.com']

        email.send()
        logger.info('Email Send Successfully !!!!!!!!')
        # return render(request, "bdm_weekly_jobs_report.html", {'data': finalOutput, 'df': str(queryset.query), 'jobs_posted': jobs_posted})
        return str(queryset.query)


def send_weekly_bdm_jobs_summary(country='India', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
    start_date, end_date = utils.get_weekly_report_start_and_end_datetime(country)
    # start_date = "2022-10-12 00:00:00"
    # end_date = "2022-10-14 23:59:59"

    both_country = []
    user_countries = [country, 'Both']
    jobs_posted = []

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))
    queryset = Candidates.objects.raw(
        "SELECT * FROM (SELECT j.id ,j.job_title , j.job_id as custom_job_id , cl.company_name "
        "as client_name , CONCAT(u.first_name,' ' ,u.last_name)as bdm_name, u.country as bdm_location, "
        "j.job_posted_date, j.min_salary ,j.max_salary ,j.min_rate ,j.max_rate, "
        "(SELECT GROUP_CONCAT(CONCAT(ca.first_name,' ' ,ca.last_name)) FROM candidates_jobs_stages as "
        "cjs, osms_candidates as ca, candidates_stages as cs WHERE ca.id = cjs.candidate_name_id AND "
        "j.id = cjs.job_description_id AND cs.id = cjs.stage_id AND cs.stage_name != 'Candidate Added' AND cjs.submission_date "
        ">= %s AND cjs.submission_date <= %s  ) "
        "as candidates_name, (SELECT GROUP_CONCAT(cjs.submission_date)  FROM candidates_jobs_stages as "
        "cjs, osms_candidates as ca, candidates_stages as cs WHERE ca.id = cjs.candidate_name_id AND "
        "j.id = cjs.job_description_id AND cs.id = cjs.stage_id AND cs.stage_name != 'Candidate Added' AND cjs.submission_date "
        ">= %s AND cjs.submission_date <= %s ) "
        "as submission_dates, (SELECT GROUP_CONCAT(cs.stage_name)  FROM candidates_jobs_stages as "
        "cjs, osms_candidates as ca, candidates_stages as cs WHERE ca.id = cjs.candidate_name_id AND "
        "j.id = cjs.job_description_id AND cs.id = cjs.stage_id AND cs.stage_name != 'Candidate Added' AND cjs.submission_date "
        ">= %s AND cjs.submission_date <= %s ) as stage_name FROM osms_job_description as j, osms_clients as cl,users_user as u WHERE "
        "cl.id = j.client_name_id AND u.id = j.created_by_id AND j.job_posted_date >= "
        "%s AND j.job_posted_date <= %s AND u.country IN "
        "%s AND cl.country = %s ORDER BY bdm_name, j.job_posted_date DESC ) AS  A "
        "INNER JOIN (select j.id as job_id , sum(case when s.stage_name = 'Client Interview' then 1 else 0 end) "
        "as Client_Interview, sum(case when s.stage_name = 'Offered' then 1 else 0 end) as Offered , "
        "sum(case when s.stage_name != 'Candidate Added' then 1 else 0 end) as Submission , "
        "sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as 'Rejected_By_Team' , "
        "sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as 'Sendout_Reject' , "
        "sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as 'Offer_Rejected' ,"
        "sum(case when s.stage_name = 'Shortlisted' then 1 else 0 end) as 'Shortlisted' , "
        "sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as 'Internal_Interview' ,"
        "sum(case when s.stage_name = 'Awaiting Feedback' then 1 else 0 end) as 'Awaiting_Feedback' , "
        "sum(case when s.stage_name = 'Placed' then 1 else 0 end) as 'Placed' ,"
        "sum(case when s.stage_name = 'Rejected By Client' then 1 else 0 end) as 'Rejected_By_Client' ,"
        "sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as 'Submission_Reject' ,"
        "sum(case when s.stage_name = 'SendOut' then 1 else 0 end) as 'SendOut' from `osms_job_description` as j , "
        "`osms_candidates` as ca , `candidates_stages` as s , `candidates_jobs_stages` as cjs  "
        "WHERE cjs.stage_id = s.id AND cjs.job_description_id = j.id AND cjs.candidate_name_id = ca.id "
        "GROUP BY j.id ) AS B ON A.id = B.job_id AND B.job_id IS NOT NULL",
        [start_date, end_date, start_date, end_date, start_date, end_date, start_date, end_date, user_countries,
         country])

    # [user_countries, country, start_date, end_date]

    if queryset is not None:
        logger.info(str(queryset.query))
        serializer = BdmJobsSummaryReportSerializer(queryset, many=True)
        # userqueryset = User.objects.raw(
        #    "SELECT id, email, country from users_user where role = '9' AND country = %s", [country])
        bdmqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(bdmqueryset, many=True)
        bdm_emails = []
        if isProd:
            for i in range(len(user_serializer.data)):
                bdm_emails.append(user_serializer.data[i]['email'])
        else:
            bdm_emails.append('kuriwaln@opallios.com')

        output = []
        finalOutput = []
        for i in range(len(serializer.data)):
            rows = {
                'job_posted_date': serializer.data[i]['job_posted_date'],
                'job_title': serializer.data[i]['job_title'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'candidates_name': serializer.data[i]['candidates_name'],
                'submission_dates': serializer.data[i]['submission_dates'],

                'Client_Interview': serializer.data[i]['Client_Interview'],
                'Offered': serializer.data[i]['Offered'],
                'Submission': serializer.data[i]['Submission'],
                'Rejected_By_Team': serializer.data[i]['Rejected_By_Team'],
                'Sendout_Reject': serializer.data[i]['Sendout_Reject'],
                'Offer_Rejected': serializer.data[i]['Offer_Rejected'],
                'Shortlisted': serializer.data[i]['Shortlisted'],
                'Internal_Interview': serializer.data[i]['Internal_Interview'],
                'Awaiting_Feedback': serializer.data[i]['Awaiting_Feedback'],
                'Placed': serializer.data[i]['Placed'],
                'Rejected_By_Client': serializer.data[i]['Rejected_By_Client'],
                'Submission_Reject': serializer.data[i]['Submission_Reject'],
                'SendOut': serializer.data[i]['SendOut'],
                'stage_name': serializer.data[i]['stage_name'],
            }
            output.append(rows)

        df = pd.DataFrame(output)
        if not df.empty:
            grouped = df.groupby('bdm_name')
            for name, group in grouped:
                group_data = []
                for row_index, row in group.iterrows():
                    candidates_name = row['candidates_name']
                    submission_dates = row['submission_dates']
                    stage_name = row['stage_name']
                    candidates = ""
                    if candidates_name is not None:
                        if submission_dates is not None:
                            dates_list = submission_dates.split(",")
                            candidates_list = candidates_name.split(",")
                            stage_name = stage_name.split(",")
                            if len(dates_list) == len(candidates_list):
                                logger.info(len(dates_list))
                                logger.info(len(candidates_list))
                                for i in range(len(candidates_list)):
                                    candidates = str(candidates) + str(candidates_list[i]) + ' - ' + str(
                                        dates_list[i].split(' ')[0]) + ' - ' + str(
                                        stage_name[i].split(' ')[0]) + ', '

                    group_row = {
                        'job_posted_date': str(row['job_posted_date']).split(' ')[0],
                        'job_title': row['job_title'],
                        'min_salary': row['min_salary'],
                        'max_salary': row['max_salary'],
                        'min_rate': row['min_rate'],
                        'max_rate': row['max_rate'],
                        'client_name': row['client_name'],
                        'bdm_name': row['bdm_name'],
                        'candidates_name': candidates,

                        'client_interview': row['Client_Interview'],
                        'offered': row['Offered'],
                        'submission': row['Submission'],
                        'Rejected_By_Team': row['Rejected_By_Team'],
                        'sendout_reject': row['Sendout_Reject'],
                        'Offer_Rejected': row['Offer_Rejected'],
                        'shortlisted': row['Shortlisted'],
                        'Internal_Interview': row['Internal_Interview'],
                        'Awaiting_Feedback': row['Awaiting_Feedback'],
                        'placed': row['Placed'],
                        'Rejected_By_Client': row['Rejected_By_Client'],
                        'Submission_Reject': row['Submission_Reject'],
                        'send_out': row['SendOut'],
                        'stage_name': row['stage_name'],
                    }
                    group_data.append(group_row)

                row = {
                    'name': name,
                    'user_data': group_data,
                    'total_jobs': group['job_title'].nunique(),
                    'total_client': (group['client_name'].str.lower()).nunique()
                }
                finalOutput.append(row)

        no_jobs_posted_user = User.objects.raw(
            "SELECT u.id, u.first_name FROM users_user as u WHERE u.role = 9 AND u.is_active = 1 AND u.country IN %s "
            "AND u.id NOT IN (SELECT u.id FROM osms_job_description as j, osms_clients as cl,users_user as u WHERE "
            "cl.id = j.client_name_id AND u.id = j.created_by_id AND j.job_posted_date >= %s AND j.job_posted_date <= "
            "%s AND u.country IN %s AND cl.country = %s )",
            [user_countries, start_date, end_date, user_countries, country])

        logger.info('Query No', no_jobs_posted_user.query)

        no_submission_user_serializer = UserReportSerializer(no_jobs_posted_user, many=True)
        logger.info(no_submission_user_serializer.data)
        for i in range(len(no_submission_user_serializer.data)):
            logger.info(no_submission_user_serializer.data[i]['first_name'])
            jobs_posted.append(no_submission_user_serializer.data[i]['first_name'])

        message = render_to_string('bdm_weekly_jobs_summary_report.html',
                                   {'data': finalOutput, 'jobs_posted': jobs_posted})
        email = EmailMessage(subject="BDMs Weekly Jobs Summary Report: {0} to {1}".format(str(start_date).split(' ')[0],
                                                                                          str(end_date).split(' ')[0]),
                             body=message,
                             from_email=EMAIL_FROM_USER, to=bdm_emails)
        email.content_subtype = 'html'
        if isProd:
            email.cc = ['mathurp@opallios.com', 'girish@opallios.com', 'paradkaro@opallios.com',
                        'minglaniy@opallios.com',
                        'kuriwaln@opallios.com'] + bdm_emails + both_country
        else:
            email.cc = ['kuriwaln@opallios.com']  # 'mathurp@opallios.com',

        email.send()
        logger.info('Email Send Successfully !!!!!!!!')
        # return render(request, "bdm_weekly_jobs_summary_report.html",
        #              {'data': finalOutput, 'df': str(queryset.query), 'jobs_posted': jobs_posted})
        return str(queryset.query)


def send_last_48hours_bdm_jobs(country='India', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))
    start_date, end_date = utils.get_start_and_end_datetime_before_twenty_four_hours_days(country)

    both_country = []
    user_countries = [country, 'Both']

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))
    queryset = Candidates.objects.raw(
        "SELECT j.id ,j.job_title , j.job_id , cl.company_name as client_name , CONCAT(u.first_name,' ' ,u.last_name)"
        "as bdm_name,u.country as bdm_location, j.job_posted_date, j.min_salary ,j.max_salary ,j.min_rate, "
        "j.created_at, j.max_rate, (SELECT GROUP_CONCAT(DISTINCT(CONCAT(u.first_name,' ' ,u.last_name))) FROM "
        "job_description_assingment as jad, users_user as u WHERE u.id = jad.primary_recruiter_name_id AND j.id = "
        "jad.job_id_id ) as candidates_name FROM osms_job_description as j, osms_clients as cl, "
        "users_user as u WHERE cl.id = j.client_name_id "
        "AND u.id = j.created_by_id AND j.job_posted_date >= %s AND j.job_posted_date <= %s AND u.country IN %s AND "
        "cl.country = %s ORDER BY bdm_name, j.job_posted_date",
        [start_date, end_date, user_countries, country])

    if queryset is not None:
        logger.info(str(queryset.query))
        serializer = BdmJobsAssignmentReportSerializer(queryset, many=True)
        # userqueryset = User.objects.raw(
        #    "SELECT id, email, country from users_user where role = '9' AND country = %s", [country])
        bdmqueryset = User.objects.raw(
            "SELECT id, email, country from users_user where role = '9' AND is_active = '1' AND country IN %s",
            [user_countries])
        user_serializer = UserSerializer(bdmqueryset, many=True)
        bdm_emails = []
        jobs_posted = []
        if isProd:
            for i in range(len(user_serializer.data)):
                bdm_emails.append(user_serializer.data[i]['email'])
        else:
            bdm_emails.append('kuriwaln@opallios.com')
            bdm_emails.append('mathurp@opallios.com')
            # bdm_emails.append('minglaniy@opallios.com')

        output = []
        finalOutput = []
        for i in range(len(serializer.data)):
            rows = {
                'job_posted_date': serializer.data[i]['job_posted_date'],
                'job_title': serializer.data[i]['job_title'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'client_name': serializer.data[i]['client_name'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'candidates_name': serializer.data[i]['candidates_name'],
                'created_at': serializer.data[i]['created_at'],
            }
            output.append(rows)

        df = pd.DataFrame(output)
        if not df.empty:
            grouped = df.groupby('bdm_name')
            for name, group in grouped:
                group_data = []

                for row_index, row in group.iterrows():
                    group_row = {
                        'job_posted_date': str(row['created_at']),
                        'job_title': row['job_title'],
                        'min_salary': row['min_salary'],
                        'max_salary': row['max_salary'],
                        'min_rate': row['min_rate'],
                        'max_rate': row['max_rate'],
                        'client_name': row['client_name'],
                        'bdm_name': row['bdm_name'],
                        'candidates_name': row['candidates_name'],
                    }
                    group_data.append(group_row)

                row = {
                    'name': name,
                    'user_data': group_data,
                    'total_jobs': group['job_title'].nunique(),
                    'total_covered': group['candidates_name'].notnull().sum(),
                    'total_client': (group['client_name'].str.lower()).nunique()
                }
                finalOutput.append(row)

        no_jobs_posted_user = User.objects.raw(
            "SELECT u.id, u.first_name FROM users_user as u WHERE u.role = 9 AND u.is_active = 1 AND u.country IN %s "
            "AND u.id NOT IN (SELECT u.id FROM osms_job_description as j, osms_clients as cl,users_user as u WHERE "
            "u.id = j.created_by_id AND cl.id = j.client_name_id AND j.job_posted_date >= %s AND j.job_posted_date <= "
            "%s AND u.country IN %s AND cl.country = %s )",
            [user_countries, start_date, end_date, user_countries, country])

        logger.info(str(no_jobs_posted_user.query))

        no_submission_user_serializer = UserReportSerializer(no_jobs_posted_user, many=True)
        logger.info(no_submission_user_serializer.data)
        for i in range(len(no_submission_user_serializer.data)):
            logger.info(no_submission_user_serializer.data[i]['first_name'])
            jobs_posted.append(no_submission_user_serializer.data[i]['first_name'])

        message = render_to_string('bdm__jobs_posted_in_last_48_hours.html',
                                   {'data': finalOutput, 'jobs_posted': jobs_posted})
        email = EmailMessage(
            subject="Jobs Posted by BDMs in Last 48 Hours: ({0} to {1})".format(str(start_date).split(' ')[0],
                                                                                str(today_date).split(' ')[0]),
            body=message,
            from_email=EMAIL_FROM_USER, to=["vibhuti@opallioslabs.com"])
        email.content_subtype = 'html'
        if isProd:
            email.cc = ['paradkaro@opallios.com', 'minglaniy@opallios.com', 'kuriwaln@opallios.com']
        email.send()
        logger.info('Email Send Successfully !!!!!!!!')
        # return render(request, "bdm__jobs_posted_in_last_48_hours.html", {'data': finalOutput, 'df': str(queryset.query), 'jobs_posted': jobs_posted})
        return str(queryset.query)


def send_weekly_recruiter_submission_follow_up(country='India', isProd=False):
    today_date = utils.get_current_datetime()
    # start_date = str(datetime.date.today() - datetime.timedelta(days=7))

    start_date, end_date = utils.month_date_range()
    # start_date = "2022-06-08 00:00:00"
    # end_date = "2022-07-08 23:59:59"

    both_country = []
    user_countries = [country, 'Both']

    if country == 'US':
        both_country.append('venkat@opallios.com')
        # start_date = str(datetime.date.today() - datetime.timedelta(days=8))

    summaryQueryset = Candidates.objects.raw(
        "SELECT ca.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, cl.company_name AS client_name ,"
        "CONCAT(u1.first_name,' ',u1.last_name) as bdm_name , CONCAT(u2.first_name,' ',u2.last_name) as "
        "recruiter_name , u2.country as location , j.job_title, cjs.submission_date, j.min_salary ,j.max_salary ,"
        "j.min_rate ,j.max_rate, ca.created_at, s.stage_name, cjs.updated_at, j.employment_type_description as job_type, j.location  FROM "
        "`osms_job_description` as j,`users_user` as u1, users_user as u2 , `osms_clients` as cl, `osms_candidates` "
        "as ca, `candidates_stages` as s, "
        "`candidates_jobs_stages` as cjs WHERE j.created_by_id = u1.id AND ca.created_by_id = u2.id AND s.stage_name "
        "!= 'Candidate Added' AND cjs.updated_at <=  NOW() - INTERVAL 3 DAY AND j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = "
        "cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND u2.country IN %s ORDER "
        "BY client_name, j.job_title, cjs.submission_date DESC",
        [start_date, end_date, user_countries])

    soutput = []
    summaryOutput = []
    bdmOutput = []
    if summaryQueryset is not None:
        logger.info(str('summaryQueryset: ' + str(summaryQueryset.query)))
        summarySerializer = RecruiterSubmissionFollowUpReportSerializer(summaryQueryset, many=True)

        for i in range(len(summarySerializer.data)):
            rows = {
                'submission_date': str(summarySerializer.data[i]['submission_date']),  # .split('.')[0]
                'candidate_name': summarySerializer.data[i]['candidate_name'],
                'client_name': summarySerializer.data[i]['client_name'],
                'min_salary': summarySerializer.data[i]['min_salary'],
                'max_salary': summarySerializer.data[i]['max_salary'],
                'min_rate': summarySerializer.data[i]['min_rate'],
                'max_rate': summarySerializer.data[i]['max_rate'],
                'bdm_name': summarySerializer.data[i]['bdm_name'],
                'recruiter_name': summarySerializer.data[i]['recruiter_name'],
                'created_at': summarySerializer.data[i]['created_at'],
                'job_title': summarySerializer.data[i]['job_title'],
                'job_type': summarySerializer.data[i]['job_type'],
                'location': summarySerializer.data[i]['location'],
                'updated_at': summarySerializer.data[i]['updated_at'],
                'stage_name': summarySerializer.data[i]['stage_name']
            }
            soutput.append(rows)

        sdf = pd.DataFrame(soutput)
        if not sdf.empty:
            grouped = sdf.groupby(['bdm_name'])
            sumOfSubmission = 0
            SubmissionReject = 0
            SendOut = 0
            SendoutReject = 0
            ClientInterview = 0
            RejectedByClient = 0
            Shortlisted = 0
            Offered = 0
            Placed = 0
            defaultValue = 0

            for bdmName, groupDf in grouped:
                bdm_data = []
                # statusDf = groupDf.loc[df['bdm_name'] == bdmName]
                statusDf1 = groupDf.groupby(['stage_name'])['stage_name'].count()
                statusOutput = []
                total = 0
                sumOfBdmSubmission = 0
                BdmSubmissionReject = 0
                BdmSendOut = 0
                BdmSendoutReject = 0
                BdmClientInterview = 0
                BdmRejectedByClient = 0
                BdmShortlisted = 0
                BdmOffered = 0
                BdmPlaced = 0

                for item in range(len(statusDf1)):
                    group_row = {
                        'status': statusDf1.index[item],
                        'status_count': statusDf1.iloc[item]
                    }

                    if statusDf1.index[item] == 'Submission' or statusDf1.index[item] == 'Submission Reject' or \
                            statusDf1.index[item] == 'SendOut' or statusDf1.index[item] == 'Sendout Reject' or \
                            statusDf1.index[item] == 'Internal Interview' or statusDf1.index[
                        item] == 'Internal Interview Reject' or statusDf1.index[item] == 'Candidate Review' or \
                            statusDf1.index[item] == 'Client Interview - First' or \
                            statusDf1.index[item] == 'Interview Backout' or statusDf1.index[
                        item] == 'Interview Reject' or statusDf1.index[item] == 'Interview Select' or \
                            statusDf1.index[item] == 'Client Interview - Second' or statusDf1.index[
                        item] == 'Second Interview Reject' or statusDf1.index[item] == 'Offer Rejected' or \
                            statusDf1.index[item] == 'Offer Backout' or statusDf1.index[item] == 'Feedback Awaited' or \
                            statusDf1.index[item] == 'Hold by BDM' or \
                            statusDf1.index[item] == 'Hold by Client' or \
                            statusDf1.index[item] == 'Shortlisted' or statusDf1.index[item] == 'Offered' or \
                            statusDf1.index[item] == 'Placed':
                        sumOfSubmission = sumOfSubmission + statusDf1.iloc[item]
                        sumOfBdmSubmission = sumOfBdmSubmission + statusDf1.iloc[item]
                    if statusDf1.index[item] == 'Submission Reject':
                        SubmissionReject = SubmissionReject + statusDf1.iloc[item]
                        BdmSubmissionReject = BdmSubmissionReject + statusDf1.iloc[item]

                    if statusDf1.index[item] == 'SendOut' or statusDf1.index[item] == 'Sendout Reject' or \
                            statusDf1.index[item] == 'Client Interview - First' or \
                            statusDf1.index[item] == 'Shortlisted' or statusDf1.index[item] == 'Interview Backout' or \
                            statusDf1.index[item] == 'Interview Reject' or statusDf1.index[
                        item] == 'Interview Select' or statusDf1.index[item] == 'Client Interview - Second' or \
                            statusDf1.index[item] == 'Second Interview Reject' or statusDf1.index[item] == 'Offered' or \
                            statusDf1.index[item] == 'Offer Backout' or \
                            statusDf1.index[item] == 'Feedback Awaited' or statusDf1.index[item] == 'Hold by Client' or \
                            statusDf1.index[item] == 'Placed' or statusDf1.index[item] == 'Offer Rejected':
                        SendOut = SendOut + statusDf1.iloc[item]
                        BdmSendOut = BdmSendOut + statusDf1.iloc[item]
                    if statusDf1.index[item] == 'Sendout Reject':
                        SendoutReject = SendoutReject + statusDf1.iloc[item]
                        BdmSendoutReject = BdmSendoutReject + statusDf1.iloc[item]
                    if statusDf1.index[item] == 'Client Interview - First' or statusDf1.index[
                        item] == 'Interview Backout' or \
                            statusDf1.index[item] == 'Interview Reject' or statusDf1.index[
                        item] == 'Interview Select' or statusDf1.index[item] == 'Client Interview - Second' or \
                            statusDf1.index[item] == 'Second Interview Reject' or statusDf1.index[
                        item] == 'Offer Rejected' or statusDf1.index[item] == 'Offer Backout' or \
                            statusDf1.index[item] == 'Feedback Awaited' or statusDf1.index[item] == 'Hold by Client' or \
                            statusDf1.index[item] == 'Shortlisted' or statusDf1.index[item] == 'Offered' or \
                            statusDf1.index[item] == 'Placed':
                        ClientInterview = ClientInterview + statusDf1.iloc[item]
                        BdmClientInterview = BdmClientInterview + statusDf1.iloc[item]
                    if statusDf1.index[item] == 'Interview Reject':
                        RejectedByClient = RejectedByClient + statusDf1.iloc[item]
                        BdmRejectedByClient = BdmRejectedByClient + statusDf1.iloc[item]
                    if statusDf1.index[item] == 'Shortlisted':
                        Shortlisted = Shortlisted + statusDf1.iloc[item]
                        BdmShortlisted = BdmShortlisted + statusDf1.iloc[item]
                    if statusDf1.index[item] == 'Offered' or statusDf1.index[item] == 'Offer Rejected' or \
                            statusDf1.index[item] == 'Offer Backout':
                        Offered = Offered + statusDf1.iloc[item]
                        BdmOffered = BdmOffered + statusDf1.iloc[item]
                    if statusDf1.index[item] == 'Placed':
                        Placed = Placed + statusDf1.iloc[item]
                        BdmPlaced = BdmPlaced + statusDf1.iloc[item]

                    total = total + statusDf1.iloc[item]
                    statusOutput.append(group_row)

                rowData = {
                    'bdmName': bdmName,
                    'total': total,
                    'sumOfBdmSubmission': sumOfBdmSubmission,
                    'BdmSubmissionReject': BdmSubmissionReject,
                    'BdmSendOut': BdmSendOut,
                    'BdmSendoutReject': BdmSendoutReject,
                    'BdmClientInterview': BdmClientInterview,
                    'BdmRejectedByClient': BdmRejectedByClient,
                    'BdmShortlisted': BdmShortlisted,
                    'BdmOffered': BdmOffered,
                    'BdmPlaced': BdmPlaced,
                    'status_data': statusOutput
                }
                bdmOutput.append(rowData)

            rowDbmData = {
                'bdmData': bdmOutput,
                'sumOfSubmission': sumOfSubmission,
                'SubmissionReject': SubmissionReject,
                'SendOut': SendOut,
                'SendoutReject': SendoutReject,
                'ClientInterview': ClientInterview,
                'RejectedByClient': RejectedByClient,
                'Shortlisted': Shortlisted,
                'Offered': Offered,
                'Placed': Placed,
                'defaultValue': defaultValue
            }
            summaryOutput.append(rowDbmData)

    queryset = Candidates.objects.raw(
        "SELECT u1.id, CONCAT(ca.first_name, ' ' , ca.last_name) as candidate_name, cl.company_name AS client_name ,"
        "CONCAT(u1.first_name,' ',u1.last_name) as bdm_name , CONCAT(u2.first_name,' ',u2.last_name) as "
        "recruiter_name , u2.country as location , j.job_title, cjs.submission_date, j.min_salary ,j.max_salary ,"
        "j.min_rate ,j.max_rate, ca.created_at, s.stage_name, cjs.updated_at, j.employment_type_description as "
        "job_type, j.location  FROM "
        "`osms_job_description` as j,`users_user` as u1, users_user as u2 , `osms_clients` as cl, `osms_candidates` "
        "as ca, `candidates_stages` as s, "
        "`candidates_jobs_stages` as cjs WHERE j.created_by_id = u1.id AND ca.created_by_id = u2.id AND s.stage_name "
        "!= 'Candidate Added' AND s.stage_name NOT LIKE %s AND cjs.updated_at <=  NOW() - INTERVAL 3 DAY AND "
        "j.client_name_id = cl.id and j.id = cjs.job_description_id AND cjs.stage_id = s.id AND ca.id = "
        "cjs.candidate_name_id AND cjs.submission_date >= %s AND cjs.submission_date <= %s AND u2.country IN %s ORDER "
        "BY client_name, j.job_title, cjs.submission_date DESC",
        ['%Reject%', start_date, end_date, user_countries])
    output = []
    finalOutput = []
    sumOfBdmUpdatedSubmission = 0
    if queryset is not None:
        logger.info(str(queryset.query))
        serializer = RecruiterSubmissionFollowUpReportSerializer(queryset, many=True)

        for i in range(len(serializer.data)):
            rows = {
                'id': serializer.data[i]['id'],
                'submission_date': str(serializer.data[i]['submission_date']),  # .split('.')[0]
                'candidate_name': serializer.data[i]['candidate_name'],
                'client_name': serializer.data[i]['client_name'],
                'min_salary': serializer.data[i]['min_salary'],
                'max_salary': serializer.data[i]['max_salary'],
                'min_rate': serializer.data[i]['min_rate'],
                'max_rate': serializer.data[i]['max_rate'],
                'bdm_name': serializer.data[i]['bdm_name'],
                'recruiter_name': serializer.data[i]['recruiter_name'],
                'created_at': serializer.data[i]['created_at'],
                'job_title': serializer.data[i]['job_title'],
                'job_type': serializer.data[i]['job_type'],
                'location': serializer.data[i]['location'],
                'updated_at': serializer.data[i]['updated_at'],
                'stage_name': serializer.data[i]['stage_name']
            }
            output.append(rows)

        df = pd.DataFrame(output)
        if not df.empty:
            grouped = df.groupby('bdm_name')
            for name, group in grouped:
                group_data = []
                bdm_id = ""
                for row_index, row in group.iterrows():
                    date_format = "%Y-%m-%d"
                    updated_at = (row['updated_at']).split(' ')[0]
                    bdm_id = row['id']

                    now = dt.now()  # current date and time
                    today = now.strftime("%Y-%m-%d")

                    b = dt.strptime(today, date_format)
                    a = dt.strptime(updated_at, date_format)
                    delta = b - a
                    total_days = delta.days
                    color = "#000"
                    rank = 0
                    weeks = (total_days // 7)
                    if weeks >= 3:
                        color = "#844204"
                        rank = 4
                    elif 2 <= weeks < 3:
                        color = "#E53935"
                        rank = 3
                    elif 1 <= weeks < 2:
                        color = "#D81B60"
                        rank = 2
                    elif weeks < 1:
                        color = "#F4511E"
                        rank = 1

                    group_row = {
                        'submission_date': str(row['submission_date']).split(' ')[0],
                        'candidate_name': row['candidate_name'],
                        'client_name': row['client_name'],
                        'bdm_name': row['bdm_name'],
                        'min_salary': row['min_salary'],
                        'max_salary': row['max_salary'],
                        'min_rate': row['min_rate'],
                        'max_rate': row['max_rate'],
                        'recruiter_name': row['recruiter_name'],
                        'created_at': row['created_at'],
                        'job_title': row['job_title'],
                        'job_type': row['job_type'],
                        'location': row['location'],
                        'updated_at': updated_at,
                        'stage_name': row['stage_name'],
                        'today': today,
                        'total_days': total_days,
                        'color': color,
                        'rank': rank
                    }
                    group_data.append(group_row)

                sumOfBdmUpdatedSubmission = 0
                bdm_id = str(bdm_id).replace('UUID', '').replace('(\'', '').replace('\')', '').replace('-', '')
                status_tuple = ('Submission', 'Submission Reject', 'SendOut', 'Sendout Reject', 'Internal Interview',
                                'Internal Interview Reject', 'Candidate Review', 'Client Interview - First',
                                'Interview Backout',
                                'Interview Reject', 'Interview Select', 'Client Interview - Second',
                                'Second Interview Reject',
                                'Offer Rejected', 'Offer Backout', 'Feedback Awaited', 'Hold by BDM', 'Hold by Client',
                                'Shortlisted', 'Offered', 'Placed')
                status_list = list(status_tuple)

                submitted_candidate = Candidates.objects.raw(
                    "SELECT u1.id, CONCAT(u1.first_name,' ',u1.last_name) as bdm_name, COUNT(s.stage_name) as "
                    "total_submissions FROM `osms_job_description` as j,`users_user` as u1, users_user as u2, "
                    "`osms_clients` as cl, `osms_candidates` as ca, `candidates_stages` as s, "
                    "`candidates_jobs_stages` as cjs WHERE j.created_by_id = u1.id AND ca.created_by_id = u2.id AND "
                    "s.stage_name IN %s AND j.client_name_id = cl.id and j.id = cjs.job_description_id "
                    "AND cjs.stage_id = s.id AND ca.id = cjs.candidate_name_id AND cjs.submission_date >= %s AND "
                    "cjs.submission_date <= %s AND u2.country IN %s AND u1.id = %s GROUP BY bdm_name ORDER BY bdm_name, "
                    "cjs.submission_date DESC",
                    [status_list, start_date, end_date, user_countries, bdm_id])

                logger.info(submitted_candidate.query)
                submitted_candidate_serializer = BdmSubmissionFollowUpReportSerializer(submitted_candidate, many=True)
                for i in range(len(submitted_candidate_serializer.data)):
                    sumOfBdmUpdatedSubmission = submitted_candidate_serializer.data[i]['total_submissions']

                row = {
                    'name': name,
                    'user_data': sorted(group_data, key=lambda d: d['rank'], reverse=True),
                    'total_jobs': group['job_title'].nunique(),
                    'sumOfBdmNotUpdatedSubmission': group['candidate_name'].count(),
                    'sumOfBdmUpdatedSubmission': sumOfBdmUpdatedSubmission
                }
                finalOutput.append(row)

        # finalOutput = sorted(finalOutput, key=lambda d: sortDic(d['user_data']), reverse=True)

        sendTo = ['mathurp@opallios.com', 'paradkaro@opallios.com',
                  'minglaniy@opallios.com',
                  'kuriwaln@opallios.com']
        message = render_to_string('recruiter_weekly_submission_follow_up_report.html',
                                   {'data': finalOutput, 'summaryOutput': summaryOutput})
        email = EmailMessage(subject="BDM Follow Up Summary: {0} to {1}".format(str(start_date).split(' ')[0],
                                                                                str(today_date).split(' ')[0]),
                             body=message,
                             from_email=EMAIL_FROM_USER, to=sendTo)
        email.content_subtype = 'html'
        email.send()
        logger.info('Email Send Successfully !!!!!!!!')

        # return render(request, "recruiter_weekly_submission_follow_up_report.html",
        #              {'data': finalOutput, 'summaryOutput': summaryOutput})

        return str(queryset.query)


def get_current_job_status(request, country='India', isProd=False):

    query = "select j.id, j.job_title, " + formulaFields() + " from `osms_job_description` as j LEFT JOIN `candidates_jobs_stages` as cjs ON j.id = cjs.job_description_id LEFT JOIN `candidates_stages` as s ON cjs.stage_id = s.id where j.status = 'Inactive' GROUP BY j.id"

    queryset = jobModel.objects.raw(query)
    logger.info(queryset.query)
    serializer = GetJobCurrentStatusSerializer(queryset, many=True)
    jobs = len(serializer.data)
    calOffered = 0
    calSendOut = 0
    calClientInterview = 0

    finalOutput = []
    for i in range(len(serializer.data)):
        job_id = serializer.data[i]['id']
        SendOut = int(serializer.data[i]['SendOut'])
        SendoutReject = int(serializer.data[i]['SendoutReject'])
        Placed = int(serializer.data[i]['Placed'])
        Offered = int(serializer.data[i]['Offered'])
        OfferRejected = int(serializer.data[i]['OfferRejected'])
        InterviewReject = int(serializer.data[i]['InterviewReject'])
        ClientInterview = int(serializer.data[i]['ClientInterview'])

        calOffered = OfferRejected + Placed
        calSendOut = SendoutReject + InterviewReject + OfferRejected + Placed
        calClientInterview = InterviewReject + OfferRejected + Placed
        
        # logger.info("calSendOut: " + str(calSendOut) + " SendoutReject: " + str(SendoutReject))

        action = "Pass"
        if SendOut != calSendOut:
            action = "Fail"
        elif Offered != calOffered:
            action = "Fail"
        elif ClientInterview != calClientInterview:
            action = "Fail"

        if action == 'Fail':
            job_id = str(job_id).replace("-", "")
            logger.info("JOB ID: " + str(job_id))
            jobdescriptionObj = jobModel.objects.get(pk=job_id)
            logger.info("JOB jobdescriptionObj: " + str(jobdescriptionObj))
            data = {
                "status": "Active",
                "manual_update": "Manual"
            }
            serializeObj = JobDescriptionWriteSerializer(jobdescriptionObj, data=data, partial=True)
            if serializeObj.is_valid():
                serializeObj.save(updated_by_id=request.user.id)
                logger.info("Jobs successfully updated: " + str(job_id))
            else:
                logger.info(serializeObj.errors)

        rows = {
            'id': serializer.data[i]['id'],
            'job_title': str(serializer.data[i]['job_title']),
            'SendOut': serializer.data[i]['SendOut'],
            'SendoutReject': serializer.data[i]['SendoutReject'],
            'InterviewReject': serializer.data[i]['InterviewReject'],
            'OfferRejected': serializer.data[i]['OfferRejected'],
            'calSendOut': calSendOut,
            'Placed': serializer.data[i]['Placed'],
            'Offered': serializer.data[i]['Offered'],
            'calOffered': calOffered,
            'ClientInterview': serializer.data[i]['ClientInterview'],
            'calClientInterview': calClientInterview,
            'action': action
        }
        finalOutput.append(rows)

    return render(request, "get_current_job_status.html", {'data': finalOutput})
    # return str(queryset.query)

