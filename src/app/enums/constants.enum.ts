export enum Constants {

  // application level constants
  AUTH_TOKEN = 'auth-token',
  USER_ID = 'user_id',
  ALL_ROLES = 'all_roles',
  USER_ROLE = 'user_role',
  USER_COUNTRY = 'user_country',

  MLAPI_BASE_URL = "",

  // error detail constants
  USERNAME_REQUIRED = 'Username is required',
  PASSWORD_REQUIRED = 'Password is required',
  PASSWORD_MINLENGTH = 'Password should have minimum 6 and maxium 30 charaters',


  // regex constants
  mobNumberPattern = "^((\\+91-?)|0)?[0-9]{10}$",
  last4DigitsSSNPattern = "^(?!0{4})\\d{4}$",
  skypeIdPattern = "^[a-zA-Z][a-zA-Z0-9\.,\-_]{5,31}$",
  linkedInIdPattern = "^https:\\/\\/[a-z]{2,3}\\.linkedin\\.com\\/.*$",
  password = '^[a-zA-Z][a-zA-Z0-9\.,\-_]{6,31}$',
  zoomUsername = '^[a-zA-Z\-]+$;',
  emailPattern = '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$',
  newPhonePattern = "^([0-9]{3}|[0-9]{3}-|[\\({1}][0-9]{3}[\\){1}] ?)[0-9]{3}-?[0-9]{4}$",



  //eventId;
  SAVE = 'save',
  EDIT = 'edit',
  ADD = 'add',
  POP_UP = "pop",
  EDIT_POP_UP = "edit_pop",
  DELETE = 'Delete',
  c2c = "C2C",
  c2h = "C2H",
  fulltime = "FullTime",
  w2 = "W2",

  //show as titles
  CANDIDATE = 'Candidate',
  CANDIDATE_STATUS = 'Candidate Status',
  OFFER_LETTER_REQUEST = 'Offer Letter Request',
  RTR = 'RTR',
  CARD = 'Placement Card',
  EMAIL = 'Email',
  EMAIL_TEMPLATE = 'Email template',
  ACTIVITY = 'Activity',
  ACTIVITY_INTERNAL = 'Activity Internal',
  CLIENT = 'Client',
  SUBMISSION = 'Submission',
  SUBMITTED_FOR = 'Submitted For',
  ASSIGNMENT = 'Assignment',
  JD = 'Jd',
  VENDOR = 'Vendor',
  VENDOR_LIST = 'Vendor List',
  CUSTOM_FIELD = 'Custom Field',
  CAMPAIGN_LIST = 'Campaign List',
  VENDOR_LIST_DETAILS = 'Vendor List',
  INTERVIEW = 'Interview',
  TIMESLOT = 'Time Slot',
  FEEDBACK = "Feedback",
  SOURCE = "Source",
  INTERVIEWER = "Interviewer",
  REPOSITORY = "Candidate Repository",
  GROUP = "Group",
  USER = "User",
  JOB_DESC = 'Job Description ',


  //Default stage Id-Candidate Added
  DEFAULT_STAGE = "6bef7192-0104-4e31-bff1-6948707fdc88",
  //default manager-Girish
  DEFAULT_MANAGER = "53970435-6adb-485e-8829-28a635012874",
  //send-out
  SEND_OUT = "f7c14044-ce77-4eb6-9b13-40aadf7fc8a6",
  CLIENT_INTERVIEW = "3a120e55-9d56-4a63-b134-47309c00ba3b",
  INTERNAL_INTERVIEW = "9d0f4bbb-5fb7-4aae-8b69-4e42fc42c6d5",
  CANDIDATE_SUBMISSION = "b46bd207-8ca0-4d67-be3f-50b645c84cc7",

  RUPEE_ICON = "₹"
}
